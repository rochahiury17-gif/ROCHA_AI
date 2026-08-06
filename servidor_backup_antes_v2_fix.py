from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from dotenv import load_dotenv
from voz.falar import falar as gerar_audio

import json
import os
import uuid
import requests


# ============================================================
# CARREGAR VARIÁVEIS DO .ENV
# ============================================================

load_dotenv(
    "/data/data/com.termux/files/home/ROCHA_AI/.env"
)

# ============================================================
# IMPORTS QUE DEPENDEM DO .ENV
# ============================================================

from auth import registrar, login
from ia.cerebro import responder

# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

app = Flask(
    __name__,
    static_folder=BASE_DIR
)

CORS(app)


@app.route("/css/<path:arquivo>")
def css(arquivo):
    return send_from_directory(
        os.path.join(BASE_DIR, "css"),
        arquivo
    )


@app.route("/js/<path:arquivo>")
def js(arquivo):
    return send_from_directory(
        os.path.join(BASE_DIR, "js"),
        arquivo
    )


@app.route("/assets/<path:arquivo>")
def assets(arquivo):
    return send_from_directory(
        os.path.join(BASE_DIR, "assets"),
        arquivo
    )

# ============================================================
# ARQUIVOS DOS USUÁRIOS
# ============================================================

def caminho_usuario(usuario):

    pasta = os.path.join(
        BASE_DIR,
        "dados",
        "usuarios"
    )

    os.makedirs(
        pasta,
        exist_ok=True
    )

    return os.path.join(
        pasta,
        f"{usuario}.json"
    )


def carregar_usuario(usuario):

    arquivo = caminho_usuario(
        usuario
    )

    if not os.path.exists(arquivo):

        return {}


    try:

        with open(
            arquivo,
            "r",
            encoding="utf-8"
        ) as f:

            dados = json.load(f)


        if isinstance(dados, dict):

            return dados


    except (
        json.JSONDecodeError,
        OSError
    ):

        pass


    return {}


def salvar_usuario(usuario, dados):

    arquivo = caminho_usuario(
        usuario
    )

    with open(
        arquivo,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            dados,
            f,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# COMPATIBILIDADE COM O SISTEMA ANTIGO
# ============================================================

def carregar_chats(usuario):

    dados = carregar_usuario(
        usuario
    )

    chats = dados.get(
        "chats",
        {}
    )

    if not isinstance(chats, dict):

        chats = {}


    return chats


def salvar_chats(usuario, chats):

    dados = carregar_usuario(
        usuario
    )

    dados["chats"] = chats

    salvar_usuario(
        usuario,
        dados
    )


# ============================================================
# PÁGINAS DA V2
# ============================================================

@app.route("/")
def inicio():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


@app.route("/V2/")
def v2_inicio():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


@app.route("/V2/tts/<path:arquivo>")
def arquivos_tts(arquivo):

    return send_from_directory(

        os.path.join(
            BASE_DIR,
            "V2",
            "tts"
        ),

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
# CRIAR NOVO CHAT
# ============================================================

@app.route(
    "/api/chat/novo",
    methods=["POST"]
)
def novo_chat():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    if not usuario:

        return jsonify({
            "sucesso": False,
            "erro": "Usuário não informado."
        }), 400

    chats = carregar_chats(usuario)

    chat_id = str(uuid.uuid4())

    agora = __import__("datetime").datetime.now().isoformat()

    chats[chat_id] = {

        "titulo": "Novo chat",

        "fixado": False,

        "criado_em": agora,

        "atualizado_em": agora,

        "mensagens": []

    }

    salvar_chats(
        usuario,
        chats
    )

    return jsonify({

        "sucesso": True,

        "chat": {

            "id": chat_id,

            "titulo": "Novo chat",

            "fixado": False,

            "criado_em": agora,

            "atualizado_em": agora,

            "mensagens": []

        }

    })


# ============================================================
# LISTAR CHATS DO USUÁRIO
# ============================================================

@app.route(
    "/api/chats",
    methods=["POST"]
)
def api_listar_chats():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    if not usuario:

        return jsonify([])

    chats = carregar_chats(usuario)

    resultado = []

    for chat_id, chat in chats.items():

        if not isinstance(chat, dict):
            continue

        resultado.append({

            "id": chat_id,

            "titulo": chat.get(
                "titulo",
                "Novo chat"
            ),

            "fixado": bool(
                chat.get(
                    "fixado",
                    False
                )
            ),

            "criado_em": chat.get(
                "criado_em",
                ""
            ),

            "atualizado_em": chat.get(
                "atualizado_em",
                ""
            ),

            "mensagens": len(
                chat.get(
                    "mensagens",
                    []
                )
            )

        })

    # Chats fixados primeiro.
    # Dentro de cada grupo, os mais recentes primeiro.

    resultado.sort(
        key=lambda x: (
            not x["fixado"],
            x["atualizado_em"]
        ),
        reverse=True
    )

    return jsonify(resultado)


# ============================================================
# HISTÓRICO DE UM CHAT
# ============================================================

@app.route(
    "/api/chat/historico",
    methods=["POST"]
)
def api_historico_chat():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    chat_id = str(
        dados.get(
            "chat_id",
            dados.get("chat", "")
        )
    ).strip()

    if not usuario or not chat_id:

        return jsonify([])

    chats = carregar_chats(usuario)

    chat = chats.get(
        chat_id,
        {}
    )

    if not isinstance(chat, dict):

        return jsonify([])

    return jsonify(
        chat.get(
            "mensagens",
            []
        )
    )


# ============================================================
# RENOMEAR CHAT
# ============================================================

@app.route(
    "/api/chat/renomear",
    methods=["POST"]
)
def renomear_chat():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    chat_id = str(
        dados.get("chat_id", "")
    ).strip()

    titulo = str(
        dados.get("titulo", "")
    ).strip()

    if not usuario or not chat_id or not titulo:

        return jsonify({
            "sucesso": False,
            "erro": "Dados incompletos."
        }), 400

    chats = carregar_chats(usuario)

    if chat_id not in chats:

        return jsonify({
            "sucesso": False,
            "erro": "Chat não encontrado."
        }), 404

    agora = __import__("datetime").datetime.now().isoformat()

    chats[chat_id]["titulo"] = titulo[:80]

    chats[chat_id]["atualizado_em"] = agora

    salvar_chats(
        usuario,
        chats
    )

    return jsonify({
        "sucesso": True,
        "titulo": chats[chat_id]["titulo"]
    })


# ============================================================
# FIXAR / DESAFIXAR CHAT
# ============================================================

@app.route(
    "/api/chat/fixar",
    methods=["POST"]
)
def fixar_chat():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    chat_id = str(
        dados.get("chat_id", "")
    ).strip()

    if not usuario or not chat_id:

        return jsonify({
            "sucesso": False,
            "erro": "Dados incompletos."
        }), 400

    chats = carregar_chats(usuario)

    if chat_id not in chats:

        return jsonify({
            "sucesso": False,
            "erro": "Chat não encontrado."
        }), 404

    chat = chats[chat_id]

    chat["fixado"] = not bool(
        chat.get(
            "fixado",
            False
        )
    )

    chat["atualizado_em"] = (
        __import__("datetime")
        .datetime
        .now()
        .isoformat()
    )

    salvar_chats(
        usuario,
        chats
    )

    return jsonify({

        "sucesso": True,

        "fixado": chat["fixado"]

    })


# ============================================================
# EXCLUIR CHAT
# ============================================================

@app.route(
    "/api/chat/excluir",
    methods=["POST"]
)
def excluir_chat():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = str(
        dados.get("usuario", "")
    ).strip()

    chat_id = str(
        dados.get("chat_id", "")
    ).strip()

    if not usuario or not chat_id:

        return jsonify({
            "sucesso": False,
            "erro": "Dados incompletos."
        }), 400

    chats = carregar_chats(usuario)

    if chat_id not in chats:

        return jsonify({
            "sucesso": False,
            "erro": "Chat não encontrado."
        }), 404

    del chats[chat_id]

    salvar_chats(
        usuario,
        chats
    )

    return jsonify({
        "sucesso": True
    })


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


    chat_id = dados.get(
        "chat_id"
    )


    if not mensagem:

        return jsonify({
            "resposta": "Digite uma mensagem."
        })


    # --------------------------------------------------------
    # SE NÃO EXISTIR CHAT, CRIA UM AUTOMATICAMENTE
    # --------------------------------------------------------

    chats = carregar_chats(
        usuario
    )


    if not chat_id:

        chat_id = str(
            uuid.uuid4()
        )


        chats[chat_id] = {

            "titulo": mensagem[:40],

            "mensagens": []

        }


    if chat_id not in chats:

        chats[chat_id] = {

            "titulo": mensagem[:40],

            "mensagens": []

        }


    # --------------------------------------------------------
    # IA
    # --------------------------------------------------------

    resposta = responder(
        mensagem,
        usuario
    )


    audio = gerar_audio(
    resposta
    )

    # --------------------------------------------------------
    # SALVAR MENSAGEM
    # --------------------------------------------------------

    chat = chats[chat_id]


    chat.setdefault(
        "mensagens",
        []
    )


    chat["mensagens"].append({

        "usuario": mensagem,

        "ia": resposta

    })


    # --------------------------------------------------------
    # TÍTULO AUTOMÁTICO
    # --------------------------------------------------------

    if chat.get(
        "titulo"
    ) == "Novo chat":

        chat["titulo"] = mensagem[:40]


    # --------------------------------------------------------
    # SALVAR CHAT
    # --------------------------------------------------------

    salvar_chats(
        usuario,
        chats
    )


    return jsonify({
        "resposta": resposta,
        "audio": audio,
        "chat_id": chat_id,
        "titulo": chat.get(
            "titulo",
            "Novo chat"
        )
    })


    # --------------------------------------------------------
    # TOKEN HUGGING FACE
    # --------------------------------------------------------

    token = os.environ.get(
        "HUGGINGFACE_TOKEN"
    )

    if not token:

        return jsonify({
            "sucesso": False,
            "erro": "Token do Hugging Face não configurado."
        }), 500


# ============================================================
# GERADOR DE IMAGENS - CLOUDFLARE WORKERS AI
# ============================================================

@app.route(
    "/api/gerar-imagem",
    methods=["POST"]
)
def gerar_imagem():

    dados = request.get_json(
        silent=True
    ) or {}

    prompt = dados.get(
        "prompt",
        ""
    ).strip()

    if not prompt:

        return jsonify({
            "sucesso": False,
            "erro": "Digite uma descrição para a imagem."
        }), 400

    token = os.environ.get(
        "CLOUDFLARE_API_TOKEN"
    )

    account_id = os.environ.get(
        "CLOUDFLARE_ACCOUNT_ID"
    )

    if not token:

        return jsonify({
            "sucesso": False,
            "erro": "Token da Cloudflare não configurado."
        }), 500

    if not account_id:

        return jsonify({
            "sucesso": False,
            "erro": "Account ID da Cloudflare não configurado."
        }), 500

    try:

        # ----------------------------------------------------
        # CLOUDFLARE WORKERS AI
        # ----------------------------------------------------

        url = (
            "https://api.cloudflare.com/client/v4/accounts/"
            f"{account_id}"
            "/ai/run/@cf/black-forest-labs/flux-2-klein-4b"
        )

        resposta = requests.post(

            url,

            headers={
                "Authorization":
                    f"Bearer {token}"
            },

            files={
                "prompt":
                    (None, prompt),

                "width":
                    (None, "512"),

                "height":
                    (None, "512")
            },

            timeout=180
        )

        # ----------------------------------------------------
        # VERIFICAR RESPOSTA HTTP
        # ----------------------------------------------------

        if resposta.status_code != 200:

            try:

                detalhes = resposta.json()

            except ValueError:

                detalhes = resposta.text[:1000]

            return jsonify({

                "sucesso": False,

                "erro":
                    "Erro ao gerar imagem na Cloudflare.",

                "detalhes":
                    detalhes

            }), resposta.status_code

        # ----------------------------------------------------
        # JSON
        # ----------------------------------------------------

        try:

            dados_imagem = resposta.json()

        except ValueError:

            return jsonify({

                "sucesso": False,

                "erro":
                    "A Cloudflare retornou uma resposta inválida.",

                "detalhes":
                    resposta.text[:1000]

            }), 500

        # ----------------------------------------------------
        # VERIFICAR RESULTADO
        # ----------------------------------------------------

        if not dados_imagem.get("success", False):

            return jsonify({

                "sucesso": False,

                "erro":
                    "A Cloudflare não conseguiu gerar a imagem.",

                "detalhes":
                    dados_imagem.get(
                        "errors",
                        dados_imagem
                    )

            }), 500

        resultado = dados_imagem.get(
            "result"
        )

        if not resultado:

            return jsonify({

                "sucesso": False,

                "erro":
                    "A Cloudflare não retornou a imagem."

            }), 500

        imagem_base64 = resultado.get(
            "image"
        )

        if not imagem_base64:

            return jsonify({

                "sucesso": False,

                "erro":
                    "A resposta não contém a imagem."

            }), 500

        # ----------------------------------------------------
        # DECODIFICAR BASE64
        # ----------------------------------------------------

        import base64

        try:

            imagem_bytes = base64.b64decode(
                imagem_base64
            )

        except Exception as erro:

            return jsonify({

                "sucesso": False,

                "erro":
                    "Não foi possível decodificar a imagem.",

                "detalhes":
                    str(erro)

            }), 500

        # ----------------------------------------------------
        # PASTA DE IMAGENS
        # ----------------------------------------------------

        pasta = os.path.join(
            BASE_DIR,
            "V2",
            "imagens_geradas"
        )

        os.makedirs(
            pasta,
            exist_ok=True
        )

        # ----------------------------------------------------
        # NOME DO ARQUIVO
        # ----------------------------------------------------

        nome = (
            f"imagem_{uuid.uuid4().hex}.jpg"
        )

        caminho = os.path.join(
            pasta,
            nome
        )

        # ----------------------------------------------------
        # SALVAR
        # ----------------------------------------------------

        with open(
            caminho,
            "wb"
        ) as arquivo:

            arquivo.write(
                imagem_bytes
            )

        # ----------------------------------------------------
        # RESPOSTA
        # ----------------------------------------------------

        return jsonify({

            "sucesso": True,

            "imagem":
                f"/V2/imagens_geradas/{nome}",

            "prompt":
                prompt

        })

    except requests.RequestException as erro:

        return jsonify({

            "sucesso": False,

            "erro":
                "Erro de conexão com a Cloudflare.",

            "detalhes":
                str(erro)

        }), 500

    except Exception as erro:

        return jsonify({

            "sucesso": False,

            "erro":
                "Erro ao gerar imagem.",

            "detalhes":
                str(erro)

        }), 500



# ============================================================
# RECEBER IMAGEM DO CHAT
# ============================================================

@app.route(
    "/api/enviar-imagem",
    methods=["POST"]
)
def enviar_imagem():

    try:

        if "imagem" not in request.files:

            return jsonify({
                "sucesso": False,
                "erro": "Nenhuma imagem foi enviada."
            }), 400

        arquivo = request.files["imagem"]

        if not arquivo or not arquivo.filename:

            return jsonify({
                "sucesso": False,
                "erro": "Imagem inválida."
            }), 400

        tipo = arquivo.mimetype or ""

        if not tipo.startswith("image/"):

            return jsonify({
                "sucesso": False,
                "erro": "O arquivo enviado não é uma imagem."
            }), 400

        arquivo.seek(0, 2)

        tamanho = arquivo.tell()

        arquivo.seek(0)

        limite = 10 * 1024 * 1024

        if tamanho > limite:

            return jsonify({
                "sucesso": False,
                "erro": "A imagem é muito grande. Limite: 10 MB."
            }), 400

        pasta = os.path.join(
            BASE_DIR,
            "V2",
            "imagens_chat"
        )

        os.makedirs(
            pasta,
            exist_ok=True
        )

        extensao = os.path.splitext(
            arquivo.filename
        )[1].lower()

        if not extensao:
            extensao = ".jpg"

        nome = (
            f"chat_{uuid.uuid4().hex}"
            f"{extensao}"
        )

        caminho = os.path.join(
            pasta,
            nome
        )

        arquivo.save(caminho)

        print(
            "✅ Imagem recebida:",
            arquivo.filename,
            "->",
            caminho
        )

        return jsonify({

            "sucesso": True,

            "imagem":
                f"/V2/imagens_chat/{nome}",

            "nome":
                arquivo.filename,

            "tipo":
                tipo,

            "tamanho":
                tamanho

        }), 200

    except Exception as erro:

        print(
            "❌ Erro ao receber imagem:",
            erro
        )

        return jsonify({

            "sucesso": False,

            "erro":
                "Erro interno ao salvar a imagem.",

            "detalhes":
                str(erro)

        }), 500


# ============================================================
# CONTINUAR RESPOSTA
# ============================================================

@app.route(
    "/api/chat/continuar",
    methods=["POST"]
)
def continuar_resposta():

    dados = request.get_json(
        silent=True
    ) or {}

    usuario = dados.get(
        "usuario",
        "usuario"
    )

    chat_id = dados.get(
        "chat_id"
    )

    if not chat_id:

        return jsonify({
            "erro": "Chat não informado."
        }), 400


    chats = carregar_chats(
        usuario
    )


    if chat_id not in chats:

        return jsonify({
            "erro": "Conversa não encontrada."
        }), 404


    chat = chats[chat_id]

    mensagens = chat.get(
        "mensagens",
        []
    )


    if not mensagens:

        return jsonify({
            "erro": "Não existe resposta para continuar."
        }), 400


    ultima = mensagens[-1]

    resposta_anterior = (
        ultima.get("ia")
        or ""
    ).strip()


    if not resposta_anterior:

        return jsonify({
            "erro": "Resposta anterior vazia."
        }), 400


    # Pedido especial para a IA continuar
    pedido = (
        "Continue a resposta anterior de onde ela parou. "
        "Não repita o que já foi explicado. "
        "Continue diretamente o conteúdo.\n\n"
        "RESPOSTA ANTERIOR:\n"
        + resposta_anterior
    )


    try:

        nova_resposta = responder(
            pedido,
            usuario
        )

    except Exception as erro:

        print(
            "Erro ao continuar resposta:",
            erro
        )

        return jsonify({
            "erro": "Não foi possível continuar a resposta."
        }), 500


    if not nova_resposta:

        return jsonify({
            "erro": "A IA não retornou uma continuação."
        }), 500


    # Acrescenta a continuação à resposta anterior
    resposta_completa = (
        resposta_anterior
        + "\n\n"
        + str(nova_resposta)
    )


    # Atualiza a última resposta
    ultima["ia"] = resposta_completa


    salvar_chats(
        usuario,
        chats
    )


    return jsonify({

        "resposta": str(nova_resposta),

        "resposta_completa":
            resposta_completa,

        "chat_id":
            chat_id

    })



# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000
    )
