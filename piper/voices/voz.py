import subprocess
import uuid
import os

BASE = os.path.dirname(os.path.abspath(__file__))

PIPER = os.path.join(BASE, "piper", "piper")
MODEL = os.path.join(BASE, "piper", "voices", "pt_BR-faber-medium.onnx")
OUT = os.path.join(BASE, "V2", "tts")

os.makedirs(OUT, exist_ok=True)

def gerar_audio(texto):
    nome = f"{uuid.uuid4().hex}.wav"
    caminho = os.path.join(OUT, nome)

    subprocess.run(
        [PIPER, "-m", MODEL, "-f", caminho],
        input=texto.encode("utf-8"),
        check=True
    )

    return "/V2/tts/" + nome
