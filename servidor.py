from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import json
import os

from ia.cerebro import responder


app = Flask(__name__, static_folder=".")
CORS(app)


def carregar_chats(usuario):

    pasta = "dados/usuarios"

    os.makedirs(pasta, exist_ok=True)

    arquivo = os.path.join(pasta, f"{usuario}.json")

    if os.path.exists(arquivo):

        with open(arquivo, "r", encoding="utf-8") as f:
            return json.load(f)

    return {}


def salvar_chats(usuario, chats):

    pasta = "dados/usuarios"

    os.makedirs(pasta, exist_ok=True)

    arquivo = os.path.join(pasta, f"{usuario}.json")

    with open(arquivo, "w", encoding="utf-8") as f:

        json.dump(
            chats,
            f,
            indent=4,
            ensure_ascii=False
        )


@app.route("/")
def inicio():

    return send_from_directory(".", "index.html")


@app.route("/<path:arquivo>")
def arquivos(arquivo):

    return send_from_directory(".", arquivo)


@app.post("/novo_chat")
def novo_chat():

    dados = request.get_json()

    usuario = dados.get("usuario")
    nome = dados.get("nome")

    if not nome:

        return jsonify({
            "erro": "Nome vazio"
        })


    chats = carregar_chats(usuario)


    if nome not in chats:

        chats[nome] = []


    salvar_chats(usuario, chats)


    return jsonify({
        "status": "ok"
    })


@app.post("/listar_chats")
def listar_chats():

    dados = request.get_json()

    usuario = dados.get("usuario")

    chats = carregar_chats(usuario)

    return jsonify(list(chats.keys()))


@app.post("/historico")
def historico():

    dados = request.get_json()

    usuario = dados.get("usuario")
    nome = dados.get("chat")


    chats = carregar_chats(usuario)


    return jsonify(
        chats.get(nome, [])
    )


@app.post("/chat")
def chat():

    dados = request.get_json()

    usuario = dados.get("usuario")
    nome_usuario = dados.get("nome", "Usuário")

    pergunta = dados.get("mensagem", "")

    nome_chat = dados.get("chat", "Geral")


    chats = carregar_chats(usuario)


    historico = chats.get(nome_chat, [])


    contexto = ""


    for item in historico[-10:]:

        contexto += (
            "Usuário: "
            + item["usuario"]
            + "\n"
            "ROCHA AI: "
            + item["rocha"]
            + "\n\n"
        )


    mensagem = f"""
Você é a ROCHA AI.

O nome do usuário é: {nome_usuario}.

Sempre chame essa pessoa por esse nome.

Histórico da conversa:

{contexto}

Nova pergunta:

{pergunta}

Responda mantendo o contexto.
"""


    resposta = responder(mensagem)


    if nome_chat not in chats:

        chats[nome_chat] = []


    chats[nome_chat].append({

        "usuario": pergunta,

        "rocha": resposta

    })


    salvar_chats(usuario, chats)


    return jsonify({

        "resposta": resposta

    })

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000)
