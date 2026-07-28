import requests
import config


def transcrever(arquivo):

    try:
        url = "https://api.openai.com/v1/audio/transcriptions"

        headers = {
            "Authorization": f"Bearer {config.OPENAI_API_KEY}"
        }

        with open(arquivo, "rb") as audio:

            files = {
                "file": audio,
                "model": (None, "whisper-1"),
                "language": (None, "pt")
            }

            resposta = requests.post(
                url,
                headers=headers,
                files=files
            )

        dados = resposta.json()

        if "text" in dados:
            return dados["text"]

        print(dados)
        return ""

    except Exception as erro:
        print("Erro Whisper:", erro)
        return ""
