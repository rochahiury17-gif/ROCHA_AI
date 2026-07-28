from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import json
import os

from ia.cerebro import responder


app = Flask(__name__, static_folder=".")
CORS(app)


ARQUIVO_CHATS = "dados/chats.json"


def carregar_chats():

    if os.path.exists(ARQUIVO_CHATS):

        with open(ARQUIVO_CHATS, "r", encoding="utf-8") as arquivo:
            return json.load(arquivo)

    return {}



def salvar_chats(chats):

    with open(ARQUIVO_CHATS, "w", encoding="utf-8") as arquivo:

        json.dump(
            chats,
            arquivo,
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

    nome = dados.get("nome")


    if not nome:

        return jsonify({
            "erro":"Nome vazio"
        })


    chats = carregar_chats()


    if nome not in chats:

        chats[nome] = []


    salvar_chats(chats)


    return jsonify({
        "status":"ok"
    })



@app.get("/listar_chats")
def listar_chats():

    chats = carregar_chats()

    return jsonify(list(chats.keys()))



@app.post("/historico")
def historico():

    dados = request.get_json()

    nome = dados.get("chat")


    chats = carregar_chats()


    return jsonify(
        chats.get(nome, [])
    )



@app.post("/chat")
def chat():

    dados = request.get_json()


    pergunta = dados.get("mensagem","")

    nome_chat = dados.get("chat","Geral")


    chats = carregar_chats()


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


    salvar_chats(chats)



    return jsonify({

        "resposta": resposta

    })




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

