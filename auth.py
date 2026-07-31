import json
import os
import uuid
import hashlib

ARQUIVO_USUARIOS = "dados/usuarios.json"


def _garantir_arquivo():
    os.makedirs("dados", exist_ok=True)

    if not os.path.exists(ARQUIVO_USUARIOS):
        with open(ARQUIVO_USUARIOS, "w", encoding="utf-8") as f:
            json.dump([], f, indent=4, ensure_ascii=False)


def carregar_usuarios():
    _garantir_arquivo()

    with open(ARQUIVO_USUARIOS, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_usuarios(usuarios):
    with open(ARQUIVO_USUARIOS, "w", encoding="utf-8") as f:
        json.dump(usuarios, f, indent=4, ensure_ascii=False)


def hash_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()


def registrar(nome, email, senha):
    usuarios = carregar_usuarios()

    for usuario in usuarios:
        if usuario["email"].lower() == email.lower():
            return False, "E-mail já cadastrado."

    novo = {
        "id": str(uuid.uuid4()),
        "nome": nome,
        "email": email,
        "senha": hash_senha(senha)
    }

    usuarios.append(novo)
    salvar_usuarios(usuarios)

    return True, novo


def login(email, senha):
    usuarios = carregar_usuarios()

    senha_hash = hash_senha(senha)

    for usuario in usuarios:
        if (
            usuario["email"].lower() == email.lower()
            and usuario["senha"] == senha_hash
        ):
            return True, usuario

    return False, "E-mail ou senha inválidos."
