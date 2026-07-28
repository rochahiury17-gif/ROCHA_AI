import subprocess


def ouvir():

    try:

        resultado = subprocess.run(
            [
                "termux-speech-to-text"
            ],
            capture_output=True,
            text=True,
            timeout=20
        )


        texto = resultado.stdout.strip()


        if not texto:
            return ""


        if "ERROR_NO_MATCH" in texto:
            return ""


        if texto.startswith("ERROR"):
            return ""


        return texto.lower()


    except subprocess.TimeoutExpired:
        return ""


    except Exception as erro:
        print("Erro voz:", erro)
        return ""
