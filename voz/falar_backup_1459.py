import os

def falar(texto):
    texto = texto.replace('"', '')
    os.system(f'termux-tts-speak "{texto}"')

