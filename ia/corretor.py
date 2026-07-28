def corrigir(texto):

    texto = texto.lower()

    substituicoes = [
        ("hola", "rocha"),
        ("horsham", "rocha"),
        ("house", "rocha"),
        ("horsman", "rocha")
    ]

    for errado, certo in substituicoes:
        texto = texto.replace(errado, certo)

    return texto
