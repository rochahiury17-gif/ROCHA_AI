import os
import uuid

from huggingface_hub import InferenceClient


def gerar_imagem(prompt):
    """
    Gera uma imagem usando a API do Hugging Face.
    Retorna:
        (url/caminho, erro)
    """

    token = os.getenv("HUGGINGFACE_TOKEN")

    if not token:
        return None, "Token do Hugging Face não configurado."

    prompt = prompt.strip()

    if not prompt:
        return None, "Prompt vazio."

    try:

        cliente = InferenceClient(
            provider="hf-inference",
            api_key=token
        )

        imagem = cliente.text_to_image(
            prompt,
            model="black-forest-labs/FLUX.1-schnell"
        )

        pasta = os.path.join(
            "V2",
            "imagens_geradas"
        )

        os.makedirs(
            pasta,
            exist_ok=True
        )

        nome = (
            f"imagem_{uuid.uuid4().hex}.png"
        )

        caminho = os.path.join(
            pasta,
            nome
        )

        imagem.save(caminho)

        return (
            f"/V2/imagens_geradas/{nome}",
            None
        )

    except Exception as erro:

        return (
            None,
            f"Erro ao gerar imagem: {erro}"
        )
