import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

MODELO = "llama-3.3-70b-versatile"

NOME_ASSISTENTE = "ROCHA AI"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
