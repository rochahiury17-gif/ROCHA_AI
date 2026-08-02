import psycopg
import os


# ============================================================
# BANCO
# ============================================================

DATABASE_URL = os.environ.get("DATABASE_URL")


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
# TABELA DE MEMÓRIA
# ============================================================

def garantir_tabela():

    with conectar_banco() as conn:

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

def carregar_memoria_usuario(usuario_id):

    garantir_tabela()

    with conectar_banco() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT memoria
                FROM memorias_usuario
                WHERE usuario_id = %s
                LIMIT 1
            """, (
                usuario_id,
            ))

            registro = cur.fetchone()


    if not registro:

        return {}


    return registro[0]


# ============================================================
# SALVAR MEMÓRIA
# ============================================================

def salvar_memoria_usuario(
    usuario_id,
    memoria
):

    garantir_tabela()

    with conectar_banco() as conn:

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

                usuario_id,

                psycopg.types.json.Jsonb(
                    memoria
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


    if not isinstance(
        memoria,
        dict
    ):

        memoria = {}


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
