import requests

from ia.memoria_auto import detectar_memoria

from ia.memoria_usuario import (
    carregar_memoria_usuario,
    adicionar_memoria_usuario
)

from config import API_KEY, MODELO
from ia.personalidade import PERSONALIDADE
from ia.memoria import carregar_memoria, adicionar_memoria


# ============================================================
# MEMÓRIA ESPECÍFICA DA FRASE
# ============================================================

def verificar_memoria(pergunta, usuario_id=None):

    texto = pergunta.lower()

    # --------------------------------------------------------
    # NOME DO USUÁRIO
    # --------------------------------------------------------

    if "meu nome é" in texto:

        nome = (
            pergunta
            .split("meu nome é", 1)[-1]
            .strip()
        )

        if usuario_id:

            adicionar_memoria_usuario(
                usuario_id,
                "nome",
                nome
            )

        return (
            f"Prazer, {nome}! "
            "Vou lembrar do seu nome."
        )


    # --------------------------------------------------------
    # ANIMAIS FAVORITOS
    # --------------------------------------------------------

    perguntas_animais = (
        "qual meu animal favorito",
        "qual é meu animal favorito",
        "quais meus animais favoritos",
        "quais são meus animais favoritos",
    )

    if any(
        frase in texto
        for frase in perguntas_animais
    ):

        animais = []

        if usuario_id:

            memoria = carregar_memoria_usuario(
                usuario_id
            )

            if isinstance(memoria, dict):

                animais = memoria.get(
                    "animais_favoritos",
                    []
                )

        if not isinstance(animais, list):

            animais = [animais]

        animais = [
            str(animal).strip()
            for animal in animais
            if str(animal).strip()
        ]

        animais = list(
            dict.fromkeys(animais)
        )

        if len(animais) == 1:

            return (
                f"Seu animal favorito é "
                f"{animais[0]}."
            )

        if len(animais) == 2:

            return (
                f"Seus animais favoritos "
                f"são {animais[0]} e "
                f"{animais[1]}."
            )

        if len(animais) > 2:

            return (
                "Seus animais favoritos são "
                + ", ".join(animais[:-1])
                + " e "
                + animais[-1]
                + "."
            )

        return (
            "Ainda não tenho seus animais "
            "favoritos registrados na sua "
            "memória pessoal."
        )


    # --------------------------------------------------------
    # LEMBRETE
    # --------------------------------------------------------

    if "lembre que" in texto:

        info = (
            pergunta
            .split("lembre que", 1)[-1]
            .strip()
        )

        if usuario_id:

            adicionar_memoria_usuario(
                usuario_id,
                "informacoes",
                info
            )

        return "Entendido. Guardei essa informação."


    # --------------------------------------------------------
    # IDENTIDADE DA ROCHA
    # --------------------------------------------------------

    if (
        "eu nasci" in texto
        or "minha criação" in texto
    ):

        if usuario_id:

            adicionar_memoria_usuario(
                usuario_id,
                "informacoes",
                pergunta
            )

        return (
            "Informação registrada "
            "na minha memória."
        )


    return None


# ============================================================
# HISTÓRICO RECENTE
# ============================================================

def carregar_historico_recente(
    usuario_id,
    limite=5
):

    if not usuario_id:

        return []


    arquivo = (
        f"dados/usuarios/"
        f"{usuario_id}.json"
    )


    try:

        with open(
            arquivo,
            "r",
            encoding="utf-8"
        ) as f:

            historico = __import__(
                "json"
            ).load(f)

    except (
        FileNotFoundError,
        ValueError,
        OSError
    ):

        return []


    conversas = historico.get(
        "conversas",
        []
    )


    return conversas[-limite:]


# ============================================================
# CONVERTER HISTÓRICO EM TEXTO
# ============================================================

def formatar_historico(
    conversas
):

    if not conversas:

        return "Nenhuma conversa anterior."


    linhas = []


    for conversa in conversas:

        usuario = conversa.get(
            "usuario",
            ""
        )

        ia = conversa.get(
            "ia",
            ""
        )


        if usuario:

            linhas.append(
                f"Usuário: {usuario}"
            )


        if ia:

            linhas.append(
                f"ROCHA AI: {ia}"
            )


    return "\n".join(linhas)


# ============================================================
# OBTER NOME DO USUÁRIO ATUAL
# ============================================================

def obter_nome_usuario(
    memoria_usuario
):

    if not isinstance(
        memoria_usuario,
        dict
    ):

        return ""


    # --------------------------------------------------------
    # Formato direto
    # --------------------------------------------------------

    nome = memoria_usuario.get(
        "nome",
        ""
    )


    if isinstance(nome, str) and nome.strip():

        return nome.strip()


    # --------------------------------------------------------
    # Formato dentro de "memorias"
    # --------------------------------------------------------

    memorias = memoria_usuario.get(
        "memorias",
        {}
    )


    if isinstance(
        memorias,
        dict
    ):

        nome = memorias.get(
            "nome",
            ""
        )

        if (
            isinstance(nome, str)
            and nome.strip()
        ):

            return nome.strip()


    # --------------------------------------------------------
    # Formato dentro de "memoria"
    # --------------------------------------------------------

    memoria = memoria_usuario.get(
        "memoria",
        {}
    )


    if isinstance(
        memoria,
        dict
    ):

        nome = memoria.get(
            "nome",
            ""
        )

        if (
            isinstance(nome, str)
            and nome.strip()
        ):

            return nome.strip()


    return ""


# ============================================================
# RESPOSTA PRINCIPAL
# ============================================================

def responder(
    pergunta,
    usuario_id=None
):

    texto = pergunta.lower()


    # ========================================================
    # IDENTIDADE DA ROCHA AI
    # ========================================================

    if (
        "quem é você" in texto
        or "quem é a rocha" in texto
    ):

        memoria = carregar_memoria()

        rocha = memoria.get(
            "rocha_ai",
            {}
        )

        return f"""
Eu sou {rocha.get('nome', 'ROCHA AI')}.

Fui criada em {rocha.get('criacao', '26/07/2026')}.

Minha origem é {rocha.get('origem', 'Porto Alegre - Rio Grande do Sul')}.

Meu criador é {rocha.get('criador', 'Hiury Rocha')}.

Estou aqui para ajudar, conversar e evoluir junto com meu criador.
"""


    # ========================================================
    # DETECTAR MEMÓRIA
    # ========================================================

    detectar_memoria(pergunta, usuario_id)


    # ========================================================
    # MEMÓRIA GLOBAL DA ROCHA
    # ========================================================

    memoria_global = carregar_memoria()

    memoria_global_texto = str(
        memoria_global
    )[:2500]


    # ========================================================
    # MEMÓRIA INDIVIDUAL
    # ========================================================

    memoria_usuario = {}

    if usuario_id:

        memoria_usuario = (
            carregar_memoria_usuario(
                usuario_id
            )
        )


    memoria_usuario_texto = str(
        memoria_usuario
    )[:3000]


    # ========================================================
    # NOME DO USUÁRIO ATUAL
    # ========================================================

    nome_usuario = obter_nome_usuario(
        memoria_usuario
    )


    # ========================================================
    # MEMÓRIA ESPECÍFICA
    # ========================================================

    memoria_resposta = (
        verificar_memoria(
            pergunta,
            usuario_id
        )
    )


    if memoria_resposta:

        return memoria_resposta


    # ========================================================
    # HISTÓRICO RECENTE
    # ========================================================

    historico = (
        carregar_historico_recente(
            usuario_id,
            limite=5
        )
    )


    historico_texto = (
        formatar_historico(
            historico
        )
    )


    # ========================================================
    # IDENTIDADE DO USUÁRIO
    # ========================================================

    if nome_usuario:

        identidade_usuario = (
            f"O nome registrado do usuário "
            f"atual é: {nome_usuario}."
        )

    else:

        identidade_usuario = (
            "O usuário atual ainda não "
            "informou seu nome."
        )


    # ========================================================
    # PROMPT
    # ========================================================

    prompt = f"""
{PERSONALIDADE}

Você é a ROCHA AI.

Responda naturalmente como uma assistente pessoal.

Não use frases de abertura repetitivas.

Não repita sua identidade,
criador ou origem,
a menos que isso seja relevante
ou o usuário pergunte.

Use o contexto da conversa
para entender perguntas
que dependem de mensagens anteriores.

Não invente informações
que não estejam disponíveis.

Se houver conflito entre informações,
priorize a informação mais recente
da conversa.

Responda em português do Brasil.


============================================================
IDENTIDADE DO USUÁRIO ATUAL
============================================================

{identidade_usuario}

REGRAS IMPORTANTES SOBRE O USUÁRIO:

- O usuário atual é identificado pelo ID de usuário autenticado.
- Use somente as informações pertencentes a esse usuário.
- Nunca presuma que o usuário atual se chama Hiury.
- Hiury Rocha é o criador da ROCHA AI.
- O fato de Hiury Rocha ser o criador NÃO significa que o usuário
  atual seja Hiury.
- Se o nome do usuário atual não estiver informado, não invente.
- Nunca utilize a memória de outro usuário.


============================================================
MEMÓRIA GLOBAL DA ROCHA AI
============================================================

{memoria_global_texto}


============================================================
MEMÓRIA PESSOAL DO USUÁRIO
============================================================

{memoria_usuario_texto}


============================================================
CONVERSA RECENTE
============================================================

{historico_texto}


============================================================
NOVA MENSAGEM
============================================================

Usuário:

{pergunta}


Responda à nova mensagem considerando
a memória e o contexto acima.
"""


    # ========================================================
    # GROQ
    # ========================================================

    url = (
        "https://api.groq.com/openai/v1/"
        "chat/completions"
    )


    headers = {

        "Authorization":
            f"Bearer {API_KEY}",

        "Content-Type":
            "application/json"

    }


    dados = {

        "model": MODELO,

        "messages": [

            {

                "role": "system",

                "content": prompt

            }

        ],

        "temperature": 0.5

    }


    try:

        resposta = requests.post(
            url,
            headers=headers,
            json=dados,
            timeout=60
        )

    except requests.RequestException as erro:

        return (
            "Erro ao conectar com a IA: "
            f"{erro}"
        )


    # ========================================================
    # RESPOSTA
    # ========================================================

    if resposta.status_code == 200:

        try:

            return (
                resposta
                .json()
                ["choices"][0]
                ["message"]
                ["content"]
            )

        except (
            KeyError,
            IndexError,
            TypeError,
            ValueError
        ):

            return (
                "A IA retornou uma resposta "
                "em formato inesperado."
            )


    return (
        f"Erro Groq: "
        f"{resposta.status_code} - "
        f"{resposta.text}"
    )
