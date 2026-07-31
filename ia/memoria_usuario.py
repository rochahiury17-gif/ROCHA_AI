import json
import os


PASTA = "dados/memorias"


def caminho_memoria(usuario_id):

    os.makedirs(PASTA, exist_ok=True)

    return os.path.join(
        PASTA,
        f"{usuario_id}.json"
    )


def carregar_memoria_usuario(usuario_id):

    arquivo = caminho_memoria(usuario_id)

    if not os.path.exists(arquivo):
        return {}

    try:

        with open(
            arquivo,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except (json.JSONDecodeError, OSError):

        return {}


def salvar_memoria_usuario(
    usuario_id,
    memoria
):

    arquivo = caminho_memoria(usuario_id)

    with open(
        arquivo,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            memoria,
            f,
            indent=4,
            ensure_ascii=False
        )


def adicionar_memoria_usuario(
    usuario_id,
    categoria,
    valor
):

    memoria = carregar_memoria_usuario(
        usuario_id
    )


    if categoria not in memoria:

        memoria[categoria] = []


    if isinstance(
        memoria[categoria],
        list
    ):

        if valor not in memoria[categoria]:

            memoria[categoria].append(
                valor
            )

    else:

        memoria[categoria] = valor


    salvar_memoria_usuario(
        usuario_id,
        memoria
    )


def obter_memoria_usuario(
    usuario_id
):

    return carregar_memoria_usuario(
        usuario_id
    )
