from gtts import gTTS
import uuid
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

PASTA = os.path.join(BASE_DIR, "V2", "tts")

os.makedirs(PASTA, exist_ok=True)


def gerar_audio(texto):

    nome = f"{uuid.uuid4().hex}.mp3"

    caminho = os.path.join(PASTA, nome)

    tts = gTTS(
        text=texto,
        lang="pt-br"
    )

    tts.save(caminho)

    return f"/V2/tts/{nome}"
