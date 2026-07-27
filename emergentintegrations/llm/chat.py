"""Compatibility shim — replaces emergentintegrations with local Ollama."""
import sys, json, asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))
from core.local_llm import LocalLLM

_local = LocalLLM()

class UserMessage:
    def __init__(self, text: str):
        self.text = text

class TextDelta:
    def __init__(self, content: str):
        self.content = content

class StreamDone:
    pass

class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.system_message = system_message
        self.session_id = session_id
        self._model = None

    def with_model(self, provider: str, model: str):
        # Ignora provider, usa só o modelo local
        self._model = "llama3.2:3b"
        return self

    async def send_message(self, message: UserMessage) -> str:
        return await _local.chat(
            prompt=message.text,
            model=self._model,
            system=self.system_message or None,
        )

    async def stream_message(self, message: UserMessage):
        async for chunk in _local.stream(
            prompt=message.text,
            model=self._model,
            system=self.system_message or None,
        ):
            data = json.loads(chunk)
            yield TextDelta(content=data.get("delta", ""))
        yield StreamDone()
