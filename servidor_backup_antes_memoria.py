from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from auth import registrar, login

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


@app.route("/V2/")
def v2():
    return send_from_directory("V2", "index.html")

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
@app.route("/api/chat", methods=["POST"])
def chat_api():

    dados = request.json

    mensagem = dados.get("mensagem", "")

    usuario = dados.get("usuario", "usuario")


    if not mensagem:
        return jsonify({
            "resposta": "Digite uma mensagem."
        })






resposta = responder(mensagem, usuario)


    pasta = "dados/usuarios"

    os.makedirs(pasta, exist_ok=True)

    arquivo = f"{pasta}/{usuario}.json"

    if os.path.exists(arquivo):
        with open(arquivo, "r", encoding="utf-8") as f:
            historico = json.load(f)
    else:
        historico = {}

    historico.setdefault("conversas", [])

    historico["conversas"].append({
        "usuario": mensagem,
        "ia": resposta
    })

    with open(arquivo, "w", encoding="utf-8") as f:
        json.dump(
            historico,
            f,
            indent=4,
            ensure_ascii=False
        )

    return jsonify({
        "resposta": resposta
    })

@app.route("/api/registro", methods=["POST"])
def api_registro():

    dados = request.json

    nome = dados.get("nome")
    email = dados.get("email")
    senha = dados.get("senha")

    sucesso, resultado = registrar(
        nome,
        email,
        senha
    )

    if sucesso:
        return jsonify({
            "sucesso": True,
            "usuario": resultado
        })

    return jsonify({
        "sucesso": False,
        "erro": resultado
    })


@app.route("/api/login", methods=["POST"])
def api_login():

    dados = request.json

    email = dados.get("email")
    senha = dados.get("senha")

    sucesso, resultado = login(
        email,
        senha
    )

    if sucesso:
        return jsonify({
            "sucesso": True,
            "usuario": resultado
        })

    return jsonify({
        "sucesso": False,
        "erro": resultado
})

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000)
