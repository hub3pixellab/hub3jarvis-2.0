"""
local_llm.py — Gerenciador dos 3 modelos locais (Ollama)
Llama 3.2 3B (padrao), Qwen 2.5 7B, NemoMix 12B
Consenso multi-modelo + fallback remoto opcional
"""
import os, json, time, logging, asyncio
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False

class LocalLLM:
    """Gerencia modelos locais via Ollama com suporte a consenso."""

    MODELS = {
        "llama3.2:3b": {"display": "Llama 3.2 3B", "speed": "fast", "default": True},
        "qwen2.5:7b": {"display": "Qwen 2.5 7B", "speed": "medium", "default": False},
        "nemomix:12b": {"display": "NemoMix 12B", "speed": "slow", "default": False},
    }

    def __init__(self):
        self.default_model = "llama3.2:3b"
        self.available = self._check()

    def _check(self):
        if not OLLAMA_AVAILABLE:
            return []
        try:
            return [m["name"] for m in ollama.list().get("models", [])]
        except Exception:
            return []

    async def ensure(self, model: str) -> bool:
        if model in self.available:
            return True
        if not OLLAMA_AVAILABLE:
            return False
        try:
            logger.info(f"Baixando {model}...")
            ollama.pull(model)
            self.available.append(model)
            return True
        except Exception as e:
            logger.error(f"Falha ao baixar {model}: {e}")
            return False

    async def chat(self, prompt: str, model: str = None, system: str = None) -> str:
        model = model or self.default_model
        if not OLLAMA_AVAILABLE or model not in self.available:
            ok = await self.ensure(model)
            if not ok:
                return self._fallback(prompt, system)
        try:
            opts = {}
            if system:
                opts["system"] = system
            resp = ollama.chat(model=model, messages=[{"role": "user", "content": prompt}])
            return resp["message"]["content"]
        except Exception as e:
            logger.error(f"Erro no modelo {model}: {e}")
            return self._fallback(prompt, system)

    async def stream(self, prompt: str, model: str = None, system: str = None):
        model = model or self.default_model
        if not OLLAMA_AVAILABLE or model not in self.available:
            yield json.dumps({"delta": self._fallback(prompt, system)})
            return
        try:
            for chunk in ollama.chat(model=model, messages=[{"role": "user", "content": prompt}], stream=True):
                if "message" in chunk and "content" in chunk["message"]:
                    yield json.dumps({"delta": chunk["message"]["content"]})
        except Exception:
            yield json.dumps({"delta": self._fallback(prompt, system)})

    async def consensus(self, prompt: str, models: list = None, system: str = None) -> dict:
        """Consulta multiplos modelos e retorna o melhor."""
        if models is None:
            models = ["llama3.2:3b", "qwen2.5:7b", "nemomix:12b"]
        results = []
        for m in models:
            if m in self.available:
                t0 = time.time()
                try:
                    resp = await self.chat(prompt, m, system)
                    lat = round(time.time() - t0, 2)
                    score = self._score(resp)
                    results.append({"model": m, "display": self.MODELS.get(m, {}).get("display", m), "response": resp, "latency": lat, "score": score})
                except Exception as e:
                    results.append({"model": m, "display": self.MODELS.get(m, {}).get("display", m), "response": None, "error": str(e), "score": 0})
        if not results:
            return {"winner": None, "results": [], "fallback": self._fallback(prompt, system)}
        results.sort(key=lambda r: r["score"], reverse=True)
        return {"winner": results[0], "results": results, "fallback": None}

    def _score(self, text: str) -> float:
        if not text:
            return 0
        w = len(text.split())
        return round(max(0, min(100, 100 - abs(250 - w) / 2.5)), 1)

    def _fallback(self, prompt: str, system: str = None) -> str:
        api = os.getenv("EMERGENT_LLM_KEY", "")
        prov = os.getenv("REMOTE_PROVIDER", "")
        if not api or not prov:
            return "[Modelo local indisponivel e nenhuma API configurada]"
        if EMERGENT_AVAILABLE and prov == "anthropic":
            try:
                c = LlmChat(api_key=api, session_id="jarvis-fallback", system_message=system or "You are Jarvis.").with_model("anthropic", os.getenv("REMOTE_MODEL", "claude-sonnet-4-6"))
                return c.send_message(UserMessage(text=prompt)) if isinstance(c.send_message(UserMessage(text=prompt)), str) else str(c.send_message(UserMessage(text=prompt)))
            except Exception as e:
                return f"[Fallback falhou: {e}]"
        elif prov == "openai":
            try:
                from openai import OpenAI
                cl = OpenAI(api_key=api)
                msgs = [{"role": "user", "content": prompt}]
                if system:
                    msgs.insert(0, {"role": "system", "content": system})
                r = cl.chat.completions.create(model=os.getenv("REMOTE_MODEL", "gpt-4o-mini"), messages=msgs)
                return r.choices[0].message.content
            except Exception as e:
                return f"[Fallback falhou: {e}]"
        return "[Nenhum modelo disponivel]"

local_llm = LocalLLM()
