import json
import os
import uuid
import hashlib


# ============================================================
# CONFIGURAÇÃO
# ============================================================

ARQUIVO_USUARIOS = "dados/usuarios.json"
PASTA_MEMORIAS = "dados/memorias"


# ============================================================
# GARANTIR ESTRUTURA
# ============================================================

def _garantir_estrutura():

    os.makedirs("dados", exist_ok=True)
    os.makedirs(PASTA_MEMORIAS, exist_ok=True)

    if not os.path.exists(ARQUIVO_USUARIOS):

        with open(
            ARQUIVO_USUARIOS,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                [],
                f,
                indent=4,
                ensure_ascii=False
            )


# ============================================================
# USUÁRIOS
# ============================================================

def carregar_usuarios():

    _garantir_estrutura()

    try:

        with open(
            ARQUIVO_USUARIOS,
            "r",
            encoding="utf-8"
        ) as f:

            dados = json.load(f)

            if isinstance(dados, list):
                return dados

    except (
        json.JSONDecodeError,
        OSError
    ):

        pass

    return []


def salvar_usuarios(usuarios):

    _garantir_estrutura()

    with open(
        ARQUIVO_USUARIOS,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            usuarios,
            f,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# SENHA
# ============================================================

def hash_senha(senha):

    return hashlib.sha256(
        senha.encode()
    ).hexdigest()


# ============================================================
# MEMÓRIA PESSOAL
# ============================================================

def criar_memoria_usuario(
    usuario_id,
    nome
):

    os.makedirs(
        PASTA_MEMORIAS,
        exist_ok=True
    )

    arquivo = os.path.join(
        PASTA_MEMORIAS,
        f"{usuario_id}.json"
    )

    memoria = {

        "nome": [
            nome
        ],

        "informacoes": [],

        "preferencias": [],

        "projetos": [],

        "observacoes": []

    }

    try:

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

    except OSError:

        pass


# ============================================================
# REGISTRO
# ============================================================

def registrar(
    nome,
    email,
    senha
):

    usuarios = carregar_usuarios()

    nome = str(nome).strip()
    email = str(email).strip()

    if not nome:

        return False, "Digite seu nome."

    if not email:

        return False, "Digite seu e-mail."

    if not senha:

        return False, "Digite sua senha."


    # --------------------------------------------------------
    # VERIFICAR E-MAIL EXISTENTE
    # --------------------------------------------------------

    for usuario in usuarios:

        if (
            usuario.get("email", "").lower()
            == email.lower()
        ):

            return False, "E-mail já cadastrado."


    # --------------------------------------------------------
    # CRIAR USUÁRIO
    # --------------------------------------------------------

    novo = {

        "id": str(uuid.uuid4()),

        "nome": nome,

        "email": email,

        "senha": hash_senha(senha)

    }


    usuarios.append(
        novo
    )


    salvar_usuarios(
        usuarios
    )


    # --------------------------------------------------------
    # CRIAR MEMÓRIA PESSOAL
    # --------------------------------------------------------

    criar_memoria_usuario(
        novo["id"],
        nome
    )


    return True, novo


# ============================================================
# LOGIN
# ============================================================

def login(
    email,
    senha
):

    usuarios = carregar_usuarios()

    email = str(email).strip()

    senha_hash = hash_senha(
        senha
    )


    for usuario in usuarios:

        if (

            usuario.get(
                "email",
                ""
            ).lower()

            == email.lower()

            and

            usuario.get(
                "senha",
                ""
            )

            == senha_hash

        ):

            # ------------------------------------------------
            # GARANTIR MEMÓRIA DO USUÁRIO
            # ------------------------------------------------

            arquivo_memoria = os.path.join(

                PASTA_MEMORIAS,

                f"{usuario['id']}.json"

            )


            if not os.path.exists(
                arquivo_memoria
            ):

                criar_memoria_usuario(

                    usuario["id"],

                    usuario.get(
                        "nome",
                        ""
                    )

                )


            return True, usuario


    return False, "E-mail ou senha inválidos."
