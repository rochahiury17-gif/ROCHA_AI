import json
import os


ARQUIVO_MEMORIA = "memoria.json"


def carregar_memoria():
    if os.path.exists(ARQUIVO_MEMORIA):
        with open(ARQUIVO_MEMORIA, "r", encoding="utf-8") as arquivo:
            return json.load(arquivo)

    return {
        "nome": "",
        "informacoes": []
    }


def salvar_memoria(memoria):
    with open(ARQUIVO_MEMORIA, "w", encoding="utf-8") as arquivo:
        json.dump(memoria, arquivo, indent=4, ensure_ascii=False)


def responder(pergunta):

    memoria = carregar_memoria()

    texto = pergunta.lower()


    if "meu nome é" in texto:

        nome = pergunta.split("é")[-1].strip()

        memoria["nome"] = nome

        salvar_memoria(memoria)

        return f"Prazer, {nome}! Eu guardei seu nome na minha memória."


    elif "qual meu nome" in texto:

        if memoria["nome"]:
            return f"Seu nome é {memoria['nome']}."

        else:
            return "Ainda não sei seu nome."


    elif "oi" in texto:

        if memoria["nome"]:
            return f"Olá {memoria['nome']}! Que bom falar com você novamente."

        return "Olá! Eu sou a ROCHA AI."


    else:
        return "Ainda estou aprendendo essa informação."
