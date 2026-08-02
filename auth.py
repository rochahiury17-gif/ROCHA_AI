import json
import os
import uuid
import hashlib

import psycopg


# ============================================================
# CONFIGURAÇÃO
# ============================================================

DATABASE_URL = os.environ.get("DATABASE_URL")

ARQUIVO_USUARIOS = "dados/usuarios.json"
PASTA_MEMORIAS = "dados/memorias"


# ============================================================
# CONEXÃO POSTGRESQL
# ============================================================

def conectar_banco():

    if not DATABASE_URL:

        raise RuntimeError(
            "DATABASE_URL não configurada."
        )

    return psycopg.connect(
        DATABASE_URL,
        connect_timeout=10
    )


# ============================================================
# CRIAR TABELA
# ============================================================

def garantir_banco():

    with conectar_banco() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id TEXT PRIMARY KEY,
                    nome TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    senha TEXT NOT NULL
                )
            """)

        conn.commit()


# ============================================================
# ESTRUTURA DE MEMÓRIAS
# ============================================================

def _garantir_estrutura():

    os.makedirs(
        "dados",
        exist_ok=True
    )

    os.makedirs(
        PASTA_MEMORIAS,
        exist_ok=True
    )


# ============================================================
# USUÁRIOS
# ============================================================

def carregar_usuarios():

    garantir_banco()

    with conectar_banco() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    id,
                    nome,
                    email,
                    senha
                FROM usuarios
                ORDER BY nome
            """)

            registros = cur.fetchall()

    usuarios = []

    for registro in registros:

        usuarios.append({

            "id": registro[0],

            "nome": registro[1],

            "email": registro[2],

            "senha": registro[3]

        })

    return usuarios


# ============================================================
# SALVAR USUÁRIOS
# ============================================================

def salvar_usuarios(usuarios):

    garantir_banco()

    with conectar_banco() as conn:

        with conn.cursor() as cur:

            for usuario in usuarios:

                cur.execute("""
                    INSERT INTO usuarios (
                        id,
                        nome,
                        email,
                        senha
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    ON CONFLICT (id)
                    DO UPDATE SET
                        nome = EXCLUDED.nome,
                        email = EXCLUDED.email,
                        senha = EXCLUDED.senha
                """, (

                    usuario["id"],

                    usuario["nome"],

                    usuario["email"],

                    usuario["senha"]

                ))

        conn.commit()


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

    _garantir_estrutura()

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

    nome = str(
        nome
    ).strip()

    email = str(
        email
    ).strip()

    if not nome:

        return False, "Digite seu nome."

    if not email:

        return False, "Digite seu e-mail."

    if not senha:

        return False, "Digite sua senha."


    garantir_banco()


    # --------------------------------------------------------
    # VERIFICAR E-MAIL
    # --------------------------------------------------------

    with conectar_banco() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT id
                FROM usuarios
                WHERE LOWER(email) = LOWER(%s)
                LIMIT 1
            """, (
                email,
            ))

            existente = cur.fetchone()


    if existente:

        return False, "E-mail já cadastrado."


    # --------------------------------------------------------
    # CRIAR USUÁRIO
    # --------------------------------------------------------

    novo = {

        "id": str(
            uuid.uuid4()
        ),

        "nome": nome,

        "email": email,

        "senha": hash_senha(
            senha
        )

    }


    # --------------------------------------------------------
    # SALVAR NO POSTGRESQL
    # --------------------------------------------------------

    try:

        with conectar_banco() as conn:

            with conn.cursor() as cur:

                cur.execute("""
                    INSERT INTO usuarios (
                        id,
                        nome,
                        email,
                        senha
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s
                    )
                """, (

                    novo["id"],

                    novo["nome"],

                    novo["email"],

                    novo["senha"]

                ))

            conn.commit()

    except psycopg.errors.UniqueViolation:

        return False, "E-mail já cadastrado."


    # --------------------------------------------------------
    # CRIAR MEMÓRIA
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

    email = str(
        email
    ).strip()

    senha_hash = hash_senha(
        senha
    )


    garantir_banco()


    with conectar_banco() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    id,
                    nome,
                    email,
                    senha
                FROM usuarios
                WHERE LOWER(email) = LOWER(%s)
                AND senha = %s
                LIMIT 1
            """, (

                email,

                senha_hash

            ))

            registro = cur.fetchone()


    if not registro:

        return False, "E-mail ou senha inválidos."


    usuario = {

        "id": registro[0],

        "nome": registro[1],

        "email": registro[2],

        "senha": registro[3]

    }


    # --------------------------------------------------------
    # GARANTIR MEMÓRIA
    # --------------------------------------------------------

    _garantir_estrutura()

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
