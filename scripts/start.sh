#!/bin/bash
# start.sh — Jarvis AI Portátil (macOS)
# Uso: ./scripts/start.sh
# Inicia Ollama + Backend + Frontend a partir do SSD

set -e

JARVIS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$JARVIS_DIR"

echo "╔══════════════════════════════════════╗"
echo "║   🚀 JARVIS AI — PORTÁTIL           ║"
echo "║   $(date '+%d/%m/%Y %H:%M')                    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ─── 1. Verificar dependências ───
echo "🔍 Verificando dependências..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale: brew install python"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale: brew install node"
    exit 1
fi

if ! command -v ollama &> /dev/null; then
    echo "⚠️ Ollama não encontrado. Instalando..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

echo "✅ Dependências OK"
echo ""

# ─── 2. Ambiente virtual Python ───
echo "🐍 Configurando ambiente Python..."
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi
source backend/venv/bin/activate
pip install -q -r backend/requirements.txt 2>/dev/null || true
pip install -q chromadb ollama aiosqlite pyyaml 2>/dev/null || true
echo "✅ Ambiente Python pronto"
echo ""

# ─── 3. Verificar modelo padrão ───
echo "🤖 Verificando modelo Llama 3.2 3B..."
if ! ollama list 2>/dev/null | grep -q "llama3.2:3b"; then
    echo "📥 Baixando Llama 3.2 3B (~2GB)..."
    ollama pull llama3.2:3b
fi
echo "✅ Modelo padrão pronto"
echo ""

# ─── 4. Iniciar Ollama (se não estiver rodando) ───
if ! pgrep -x "ollama" > /dev/null; then
    echo "⚡ Iniciando Ollama..."
    ollama serve &
    OLLAMA_PID=$!
    for i in $(seq 1 15); do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    echo "✅ Ollama rodando (PID: $OLLAMA_PID)"
else
    echo "✅ Ollama já está rodando"
fi
echo ""

# ─── 5. Iniciar Backend ───
echo "🌐 Iniciando Backend FastAPI..."
cd backend
if [ ! -f ".env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
JWT_ALGO=HS256
ADMIN_EMAIL=admin@jarvis.local
ADMIN_PASSWORD=jarvis123
CORS_ORIGINS=http://localhost:3000
PORT=8000
MONGO_URL=
DB_NAME=jarvis
SQLITE_PATH=./memory/jarvis.db
EOF
    echo "   ✅ .env criado automaticamente"
fi

uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..
echo "✅ Backend rodando (PID: $BACKEND_PID) → http://localhost:8000"
echo ""

# ─── 6. Iniciar Frontend ───
echo "🎨 Iniciando Frontend React..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install --silent 2>/dev/null || npm install
fi
PORT=3000 npm start &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend rodando (PID: $FRONTEND_PID) → http://localhost:3000"
echo ""

# ─── 7. Ready ───
echo "╔══════════════════════════════════════╗"
echo "║   ✅ JARVIS AI ESTÁ RODANDO!         ║"
echo "║                                      ║"
echo "║   🌐 Frontend: http://localhost:3000 ║"
echo "║   🔧 Backend:  http://localhost:8000 ║"
echo "║   🤖 Modelo:   Llama 3.2 3B         ║"
echo "║   💾 Drive:    $(df -h . | tail -1 | awk '{print $4}') livres           ║"
echo "║                                      ║"
echo "║   Pressione Ctrl+C para parar tudo   ║"
echo "╚══════════════════════════════════════╝"

cleanup() {
    echo ""
    echo "⏳ Desligando..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo "✅ Jarvis desligado. Até mais!"
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
