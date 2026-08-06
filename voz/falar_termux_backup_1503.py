import os
import subprocess

def falar(texto):

    try:
        texto = str(texto)
        texto = texto.replace('"', '')

        subprocess.Popen(
            [
                "termux-tts-speak",
                texto
            ]
        )

        return True

    except Exception as erro:
        print("Erro voz:", erro)
        return False
