"""
db_adapter.py — Database abstraction layer.
Tries MongoDB first, falls back to SQLite + ChromaDB.
"""
import os, sqlite3, uuid
from datetime import datetime, timezone
from pathlib import Path
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

class DatabaseAdapter:
    TABLE_MAP = {
        "users": "users", "second_brain_knowledge": "knowledge",
        "second_brain_prefs": "preferences", "chat_messages": "chat_messages",
        "learning_logs": "learning_logs", "whitelist": "whitelist",
        "consensus_queries": "consensus_queries",
    }
    def __init__(self, config=None):
        self.config = config or {}
        self.mongo_client = None
        self.mongo_db = None
        self.sqlite_conn = None
        self.chroma_client = None
        self.mode = "sqlite"
        self._ready = False

    async def _init_sqlite(self):
        cur = self.sqlite_conn.cursor()
        cur.execute("""CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT,
            password_hash TEXT, role TEXT DEFAULT 'user',
            provider TEXT DEFAULT 'local', avatar TEXT, created_at TEXT)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS knowledge (
            id TEXT PRIMARY KEY, user_id TEXT, content TEXT,
            source TEXT DEFAULT 'chat', type TEXT DEFAULT 'insight', created_at TEXT)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT, key TEXT, value TEXT, updated_at TEXT,
            UNIQUE(user_id, key))""")
        cur.execute("""CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY, conversation_id TEXT, user_id TEXT,
            role TEXT, text TEXT, created_at TEXT)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS learning_logs (
            id TEXT PRIMARY KEY, user_id TEXT, question TEXT, answer TEXT,
            model TEXT, confidence REAL DEFAULT 0, cost REAL DEFAULT 0,
            feedback TEXT, feedback_comment TEXT, feedback_at TEXT, created_at TEXT)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS whitelist (
            user_id TEXT, phone TEXT, name TEXT, level TEXT DEFAULT 'absolute',
            created_at TEXT, UNIQUE(user_id, phone))""")
        cur.execute("""CREATE TABLE IF NOT EXISTS consensus_queries (
            id TEXT PRIMARY KEY, user_id TEXT, question TEXT,
            winner_key TEXT, confidence REAL, total_cost REAL,
            total_time REAL, avg_confidence REAL, results TEXT, created_at TEXT)""")
        self.sqlite_conn.commit()
        cur.close()
        print("✅ [DB] Tabelas SQLite prontas")

    @property
    def db(self):
        return self.mongo_db if self.mode == "mongodb" else self.sqlite_conn

    def is_mongo(self):
        return self.mode == "mongodb"

    def get_collection(self, name: str):
        table = self.TABLE_MAP.get(name, name)
        if self.is_mongo():
            return self.mongo_db[name]
        return SQLiteCollection(self.sqlite_conn, table)

    async def get_chroma_collection(self):
        return self.chroma_collection

    async def close(self):
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.mongo_client:
            self.mongo_client.close()

class SQLiteCollection:
    """Simula collection MongoDB em SQLite."""

    def __init__(self, conn, table_name: str):
        self.conn = conn
        self.table = table_name

    async def insert_one(self, doc: dict) -> dict:
        cols = list(doc.keys())
        vals = [doc[c] for c in cols]
        cur = self.conn.cursor()
        try:
            cur.execute(f"INSERT OR REPLACE INTO {self.table} ({', '.join(cols)}) VALUES ({', '.join(['?']*len(cols))})", vals)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
        return doc

    async def insert_many(self, docs: list):
        for d in docs:
            await self.insert_one(d)

    async def find(self, query: dict, projection=None, sort=None, limit=0, **kw):
        clauses, vals = [], []
        for k, v in query.items():
            if k == "$or":
                parts = []
                for c in v:
                    for ck, cv in c.items():
                        parts.append(f"{ck} = ?")
                        vals.append(cv)
                clauses.append(f"({' OR '.join(parts)})")
            else:
                clauses.append(f"{k} = ?")
                vals.append(v)
        where = " AND ".join(clauses) if clauses else "1=1"
        order = ""
        if sort:
            parts = [f"{s[0]} {'DESC' if len(s)>1 and s[1]==-1 else 'ASC'}" for s in sort]
            order = " ORDER BY " + ", ".join(parts)
        lim = f" LIMIT {limit}" if limit > 0 else ""
        cur = self.conn.cursor()
        try:
            cur.execute(f"SELECT * FROM {self.table} WHERE {where}{order}{lim}", vals)
            return [dict(r) for r in cur.fetchall()]
        finally:
            cur.close()

    async def find_one(self, query, projection=None):
        rows = await self.find(query, projection, limit=1)
        return rows[0] if rows else None

    async def count_documents(self, query):
        clauses, vals = [], []
        for k, v in query.items():
            clauses.append(f"{k} = ?")
            vals.append(v)
        where = " AND ".join(clauses) if clauses else "1=1"
        cur = self.conn.cursor()
        try:
            cur.execute(f"SELECT COUNT(*) as c FROM {self.table} WHERE {where}", vals)
            return cur.fetchone()["c"] or 0
        finally:
            cur.close()

    async def update_one(self, query, update, upsert=False):
        setv = update.get("$set", {})
        if not setv:
            return type("o", (), {"matched_count": 0})()
        sets = ", ".join(f"{k} = ?" for k in setv)
        vals = list(setv.values())
        for k, v in query.items():
            vals.append(v)
        cur = self.conn.cursor()
        try:
            cur.execute(f"UPDATE {self.table} SET {sets} WHERE {' AND '.join(k+' = ?' for k in query)}", vals)
            self.conn.commit()
            return type("o", (), {"matched_count": cur.rowcount})()
        finally:
            cur.close()

    async def delete_one(self, query):
        cur = self.conn.cursor()
        try:
            cur.execute(f"DELETE FROM {self.table} WHERE {' AND '.join(k+' = ?' for k in query)}", list(query.values()))
            self.conn.commit()
        finally:
            cur.close()

    async def distinct(self, key, query=None):
        cur = self.conn.cursor()
        try:
            cur.execute(f"SELECT DISTINCT {key} FROM {self.table}")
            return [r[key] for r in cur.fetchall() if r[key] is not None]
        finally:
            cur.close()

    async def to_list(self, limit=0):
        cur = self.conn.cursor()
        try:
            if limit > 0:
                cur.execute(f"SELECT * FROM {self.table} LIMIT {limit}")
            else:
                cur.execute(f"SELECT * FROM {self.table}")
            return [dict(r) for r in cur.fetchall()]
        finally:
            cur.close()

    async def create_index(self, keys, unique=False):
        pass

    async def drop(self):
        cur = self.conn.cursor()
        try:
            cur.execute(f"DROP TABLE IF EXISTS {self.table}")
            self.conn.commit()
        finally:
            cur.close()
