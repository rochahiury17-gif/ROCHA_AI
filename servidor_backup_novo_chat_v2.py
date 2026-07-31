from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from auth import registrar, login
from ia.cerebro import responder

import json
import os


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_folder=BASE_DIR
)

CORS(app)


# ============================================================
# FUNÇÕES DE ARQUIVOS
# ============================================================

def carregar_chats(usuario):

    pasta = os.path.join(
        BASE_DIR,
        "dados",
        "usuarios"
    )

    os.makedirs(
        pasta,
        exist_ok=True
    )

    arquivo = os.path.join(
        pasta,
        f"{usuario}.json"
    )

    if os.path.exists(arquivo):

        try:

            with open(
                arquivo,
                "r",
                encoding="utf-8"
            ) as f:

                return json.load(f)

        except (json.JSONDecodeError, OSError):

            return {}

    return {}


def salvar_chats(usuario, chats):

    pasta = os.path.join(
        BASE_DIR,
        "dados",
        "usuarios"
    )

    os.makedirs(
        pasta,
        exist_ok=True
    )

    arquivo = os.path.join(
        pasta,
        f"{usuario}.json"
    )

    with open(
        arquivo,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            chats,
            f,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# PÁGINAS DA V2
# ============================================================

@app.route("/")
def inicio():

    return send_from_directory(
        os.path.join(BASE_DIR, "V2"),
        "index.html"
    )


@app.route("/V2/")
def v2_inicio():

    return send_from_directory(
        os.path.join(BASE_DIR, "V2"),
        "index.html"
    )


@app.route("/V2/<path:arquivo>")
def arquivos_v2(arquivo):

    return send_from_directory(
        os.path.join(BASE_DIR, "V2"),
        arquivo
    )


# ============================================================
# REGISTRO
# ============================================================

@app.route(
    "/api/registro",
    methods=["POST"]
)
def api_registro():

    dados = request.get_json(
        silent=True
    ) or {}

    nome = dados.get(
        "nome",
        ""
    ).strip()

    email = dados.get(
        "email",
        ""
    ).strip()

    senha = dados.get(
        "senha",
        ""
    )

    if not nome:

        return jsonify({
            "sucesso": False,
            "erro": "Digite seu nome."
        }), 400


    if not email:

        return jsonify({
            "sucesso": False,
            "erro": "Digite seu e-mail."
        }), 400


    if not senha:

        return jsonify({
            "sucesso": False,
            "erro": "Digite sua senha."
        }), 400


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
    }), 400


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def api_login():

    dados = request.get_json(
        silent=True
    ) or {}

    email = dados.get(
        "email",
        ""
    ).strip()

    senha = dados.get(
        "senha",
        ""
    )


    if not email or not senha:

        return jsonify({
            "sucesso": False,
            "erro": "Informe e-mail e senha."
        }), 400


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
    }), 401


# ============================================================
# LISTAR CHATS
# ============================================================

@app.route(
    "/chats",
    methods=["POST"]
)
def listar_chats():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = dados.get(
        "usuario"
    )


    if not usuario:

        return jsonify([])


    chats = carregar_chats(
        usuario
    )


    return jsonify(
        list(chats.keys())
    )


# ============================================================
# HISTÓRICO DE CHAT
# ============================================================

@app.route(
    "/historico",
    methods=["POST"]
)
def historico():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = dados.get(
        "usuario"
    )

    nome = dados.get(
        "chat"
    )


    if not usuario:

        return jsonify([])


    chats = carregar_chats(
        usuario
    )


    return jsonify(
        chats.get(
            nome,
            []
        )
    )


# ============================================================
# CHAT PRINCIPAL
# ============================================================

@app.route(
    "/chat",
    methods=["POST"]
)
@app.route(
    "/api/chat",
    methods=["POST"]
)
def chat_api():

    dados = request.get_json(
        silent=True
    ) or {}


    mensagem = dados.get(
        "mensagem",
        ""
    ).strip()


    usuario = dados.get(
        "usuario",
        "usuario"
    )


    if not mensagem:

        return jsonify({
            "resposta": "Digite uma mensagem."
        })


    # --------------------------------------------------------
    # ENVIA MENSAGEM PARA A IA
    # --------------------------------------------------------

    resposta = responder(
        mensagem,
        usuario
    )


    # --------------------------------------------------------
    # SALVA HISTÓRICO DO USUÁRIO
    # --------------------------------------------------------

    pasta = os.path.join(
        BASE_DIR,
        "dados",
        "usuarios"
    )

    os.makedirs(
        pasta,
        exist_ok=True
    )


    arquivo = os.path.join(
        pasta,
        f"{usuario}.json"
    )


    if os.path.exists(arquivo):

        try:

            with open(
                arquivo,
                "r",
                encoding="utf-8"
            ) as f:

                historico = json.load(f)

        except (
            json.JSONDecodeError,
            OSError
        ):

            historico = {}

    else:

        historico = {}


    historico.setdefault(
        "conversas",
        []
    )


    historico["conversas"].append({

        "usuario": mensagem,

        "ia": resposta

    })


    with open(
        arquivo,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            historico,
            f,
            indent=4,
            ensure_ascii=False
        )


    return jsonify({

        "resposta": resposta

    })


# ============================================================
# TESTE
# ============================================================

@app.route(
    "/api/status",
    methods=["GET"]
)
def status():

    return jsonify({

        "online": True,

        "projeto": "ROCHA AI V2",

        "servidor": "Flask"

    })


# ============================================================
# INICIALIZAÇÃO
# ============================================================

if __name__ == "__main__":

    print()
    print("======================================")
    print("          ROCHA AI V2")
    print("======================================")
    print()
    print("Servidor iniciado.")
    print("http://127.0.0.1:5000")
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
