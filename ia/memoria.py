import json
import os


ARQUIVO = "dados/memoria.json"


def carregar_memoria():

    if not os.path.exists(ARQUIVO):
        return {}

    with open(ARQUIVO, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)



def salvar_memoria(memoria):

    with open(ARQUIVO, "w", encoding="utf-8") as arquivo:

        json.dump(
            memoria,
            arquivo,
            indent=4,
            ensure_ascii=False
        )



def adicionar_memoria(categoria, valor):

    memoria = carregar_memoria()


    if categoria not in memoria:

        memoria[categoria] = []


    if isinstance(memoria[categoria], list):

        if valor not in memoria[categoria]:

            memoria[categoria].append(valor)

    else:

        memoria[categoria] = valor


    salvar_memoria(memoria)



def obter_memoria():

    return carregar_memoria()
