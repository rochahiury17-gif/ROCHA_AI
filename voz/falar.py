import os
import uuid
from gtts import gTTS


def falar(texto):

    try:

        pasta = "static/audios"

        os.makedirs(
            pasta,
            exist_ok=True
        )

        nome = (
            str(uuid.uuid4())
            + ".mp3"
        )

        caminho = os.path.join(
            pasta,
            nome
        )

        audio = gTTS(
            text=str(texto),
            lang="pt",
            slow=False
        )

        audio.save(caminho)

        return "/" + caminho

    except Exception as erro:

        print(
            "Erro TTS:",
            erro
        )

        return None
