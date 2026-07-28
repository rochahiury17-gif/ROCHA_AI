from ia.memoria import adicionar_memoria


def detectar_memoria(texto):

    frase = texto.lower()


    if "meu nome é" in frase:

        valor = texto.split("é")[-1].strip()

        adicionar_memoria(
            "nome",
            valor
        )


    if "estou criando" in frase:

        valor = texto.split("estou criando")[-1].strip()

        adicionar_memoria(
            "projetos",
            valor
        )


    if "eu gosto de" in frase:

        valor = texto.split("eu gosto de")[-1].strip()

        adicionar_memoria(
            "preferencias",
            valor
        )


    return True
