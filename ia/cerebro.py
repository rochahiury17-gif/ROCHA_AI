import requests
from ia.memoria_auto import detectar_memoria

from config import API_KEY, MODELO
from ia.personalidade import PERSONALIDADE
from ia.memoria import carregar_memoria, adicionar_memoria



def verificar_memoria(pergunta):

    texto = pergunta.lower()


    if "meu nome é" in texto:

        nome = pergunta.lower().split("meu nome é")[-1].strip()

        adicionar_memoria(
            "usuario_nome",
            nome
        )

        return f"Prazer, {nome}! Vou lembrar do seu nome."


    if "lembre que" in texto:

        info = pergunta.split("lembre que")[-1].strip()

        adicionar_memoria(
            "informacoes",
            info
        )

        return "Entendido. Guardei essa informação."


    if "eu nasci" in texto or "minha criação" in texto:

        adicionar_memoria(
            "identidade_rocha",
            pergunta
        )

        return "Informação da minha identidade registrada."


    return None



def responder(pergunta):

    texto = pergunta.lower()


    if "quem é você" in texto or "quem é a rocha" in texto:

        memoria = carregar_memoria()

        rocha = memoria.get("rocha_ai", {})


        return f"""
Eu sou {rocha.get('nome', 'ROCHA AI')}.

Fui criada em {rocha.get('criacao', '26/07/2026')}.

Minha origem é {rocha.get('origem', 'Porto Alegre - Rio Grande do Sul')}.

Meu criador é {rocha.get('criador', 'Hiury Rocha')}.

Estou aqui para ajudar, conversar e evoluir junto com meu criador.
"""

    detectar_memoria(pergunta)

    memoria = carregar_memoria()


    memoria_texto = str(memoria)



    memoria_resposta = verificar_memoria(pergunta)


    if memoria_resposta:

        return memoria_resposta



    prompt = f"""
{PERSONALIDADE}


Você é a ROCHA AI.

Memória permanente:

{memoria_texto}


Use essa memória quando for útil.


Usuário:

{pergunta}


Responda em português do Brasil.
"""



    url = "https://api.groq.com/openai/v1/chat/completions"



    headers = {

        "Authorization": f"Bearer {API_KEY}",

        "Content-Type": "application/json"

    }



    dados = {

        "model": MODELO,

        "messages": [

            {

                "role": "system",

                "content": prompt

            }

        ],

        "temperature": 0.7

    }



    resposta = requests.post(

        url,

        headers=headers,

        json=dados

    )



if resposta.status_code == 200:

    return resposta.json()["choices"][0]["message"]["content"]


return f"Erro Groq: {resposta.status_code} - {resposta.text}"
