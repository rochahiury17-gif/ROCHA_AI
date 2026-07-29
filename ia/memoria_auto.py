from ia.memoria import adicionar_memoria


def detectar_memoria(texto):

    frase = texto.lower()


    # Nome do usuário
    if "meu nome é" in frase:

        valor = texto.lower().split("meu nome é")[-1].strip()

        adicionar_memoria(
            "nome",
            valor
        )


    # Projetos
    if "estou criando" in frase:

        valor = texto.lower().split("estou criando")[-1].strip()

        adicionar_memoria(
            "projetos",
            valor
        )


    if "meu projeto é" in frase:

        valor = texto.lower().split("meu projeto é")[-1].strip()

        adicionar_memoria(
            "projetos",
            valor
        )


    # Preferências
    if "eu gosto de" in frase:

        valor = texto.lower().split("eu gosto de")[-1].strip()

        adicionar_memoria(
            "preferencias",
            valor
        )


    if "eu prefiro" in frase:

        valor = texto.lower().split("eu prefiro")[-1].strip()

        adicionar_memoria(
            "preferencias",
            valor
        )


    # Objetivos
    if "minha meta é" in frase:

        valor = texto.lower().split("minha meta é")[-1].strip()

        adicionar_memoria(
            "objetivos",
            valor
        )


    return True
