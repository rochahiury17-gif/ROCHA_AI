def ativar(texto):

    texto = texto.lower()

    palavras = [
        "rocha",
        "roxa",
        "porsche",
        "harsha",
        "horsham",
        "horsman",
        "house",
        "hola",
        "portia rocha",
        "rocha ai"
    ]

    for palavra in palavras:
        if palavra in texto:
            return True

    return False
