import os
import json
import psycopg


# ============================================================
# CONFIGURAÇÃO
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")


# ============================================================
# CONEXÃO
# ============================================================

def conectar():

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL não configurada."
        )

    return psycopg.connect(
        DATABASE_URL
    )


# ============================================================
# GARANTIR TABELA
# ============================================================

def garantir_tabela():

    with conectar() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS memorias_usuario (

                    usuario_id TEXT PRIMARY KEY,

                    memoria JSONB NOT NULL DEFAULT '{}'::jsonb

                )
            """)

        conn.commit()


# ============================================================
# CARREGAR MEMÓRIA
# ============================================================

def carregar_memoria_usuario(
    usuario_id
):

    garantir_tabela()

    with conectar() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT memoria
                FROM memorias_usuario
                WHERE usuario_id = %s
            """, (
                str(usuario_id),
            ))

            resultado = cur.fetchone()


    if not resultado:

        return {}


    memoria = resultado[0]

    if isinstance(memoria, dict):

        return memoria


    try:

        return json.loads(memoria)

    except Exception:

        return {}


# ============================================================
# SALVAR MEMÓRIA
# ============================================================

def salvar_memoria_usuario(
    usuario_id,
    memoria
):

    garantir_tabela()

    with conectar() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                INSERT INTO memorias_usuario (
                    usuario_id,
                    memoria
                )

                VALUES (
                    %s,
                    %s
                )

                ON CONFLICT (usuario_id)

                DO UPDATE SET
                    memoria = EXCLUDED.memoria
            """, (
                str(usuario_id),
                json.dumps(
                    memoria,
                    ensure_ascii=False
                )
            ))

        conn.commit()


# ============================================================
# ADICIONAR MEMÓRIA
# ============================================================

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


# ============================================================
# OBTER MEMÓRIA
# ============================================================

def obter_memoria_usuario(
    usuario_id
):

    return carregar_memoria_usuario(
        usuario_id
    )
