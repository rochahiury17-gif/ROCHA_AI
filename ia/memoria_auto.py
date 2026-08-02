from ia.memoria import adicionar_memoria


def detectar_memoria(texto):

    frase = texto.lower().strip()


    # ========================================================
    # NOME DO USUÁRIO
    # ========================================================

    if "meu nome é" in frase:

        valor = texto.split("meu nome é", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "nome",
                valor
            )


    # ========================================================
    # PROJETOS
    # ========================================================

    if "estou criando" in frase:

        valor = texto.split("estou criando", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "projetos",
                valor
            )


    if "meu projeto é" in frase:

        valor = texto.split("meu projeto é", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "projetos",
                valor
            )


    # ========================================================
    # PREFERÊNCIAS
    # ========================================================

    if "eu gosto de" in frase:

        valor = texto.split("eu gosto de", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "preferencias",
                valor
            )


    if "eu prefiro" in frase:

        valor = texto.split("eu prefiro", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "preferencias",
                valor
            )


    # ========================================================
    # ANIMAIS FAVORITOS
    # ========================================================

    animais = [
        "cachorro",
        "cachorros",
        "cão",
        "cães",
        "hamster",
        "hamsters",
        "gato",
        "gatos",
        "coelho",
        "coelhos",
        "papagaio",
        "papagaios",
        "passarinho",
        "passarinhos",
        "calopsita",
        "calopsitas",
        "peixe",
        "peixes",
        "tartaruga",
        "tartarugas"
    ]


    frases_animal_favorito = [
        "meu animal favorito é",
        "meus animais favoritos são",
        "meus animais favorito são",
        "meus favoritos são",
        "são meus favoritos",
        "animal favorito",
        "animais favoritos"
    ]


    fala_sobre_favorito = any(
        trecho in frase
        for trecho in frases_animal_favorito
    )


    if fala_sobre_favorito:

        encontrados = []

        for animal in animais:

            if animal in frase:

                animal_normalizado = animal

                if animal_normalizado not in encontrados:
                    encontrados.append(
                        animal_normalizado
                    )


        for animal in encontrados:

            adicionar_memoria(
                "animais_favoritos",
                animal
            )


    # ========================================================
    # ANIMAIS FAVORITOS COM "GOSTO DE"
    # ========================================================

    if (
        "gosto de" in frase
        or "adoro" in frase
        or "amo" in frase
    ):

        encontrados = []

        for animal in animais:

            if animal in frase:

                if animal not in encontrados:
                    encontrados.append(animal)


        for animal in encontrados:

            adicionar_memoria(
                "animais_favoritos",
                animal
            )


    # ========================================================
    # OBJETIVOS
    # ========================================================

    if "minha meta é" in frase:

        valor = texto.split("minha meta é", 1)[-1].strip()

        if valor:
            adicionar_memoria(
                "objetivos",
                valor
            )


    return True
