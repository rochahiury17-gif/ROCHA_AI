import requests

from config import API_KEY, MODELO
from ia.personalidade import PERSONALIDADE
from ia.memoria import carregar_memoria, adicionar_memoria


def verificar_memoria(pergunta):

    texto = pergunta.lower()

    if "meu nome é" in texto:

        nome = pergunta.split("é")[-1].strip()

        adicionar_memoria("nome", nome)

        return f"Prazer, {nome}! Vou lembrar do seu nome."


    if "lembre que" in texto:

        info = pergunta.split("lembre que")[-1].strip()

        adicionar_memoria("informacao", info)

        return "Entendido. Guardei essa informação."


    return None



def responder(pergunta):

    memoria = carregar_memoria()


    memoria_resumo = str(memoria)


    memoria_resposta = verificar_memoria(pergunta)


    if memoria_resposta:

        return memoria_resposta



    prompt = f"""
{PERSONALIDADE}

Memória do usuário:
{memoria_resumo}

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


    return "Tive um problema ao acessar meu cérebro."
