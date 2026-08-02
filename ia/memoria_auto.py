from ia.memoria_usuario import adicionar_memoria_usuario


def detectar_memoria(texto, usuario_id=None):

    if not texto:
        return True

    frase = texto.lower().strip()

    # ========================================================
    # NOME
    # ========================================================

    if "meu nome é" in frase:

        valor = (
            texto.split("meu nome é", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "nome",
                valor
            )


    # ========================================================
    # PROJETOS
    # ========================================================

    if "estou criando" in frase:

        valor = (
            texto.split("estou criando", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "projetos",
                valor
            )


    if "meu projeto é" in frase:

        valor = (
            texto.split("meu projeto é", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "projetos",
                valor
            )


    # ========================================================
    # PREFERÊNCIAS
    # ========================================================

    if "eu gosto de" in frase:

        valor = (
            texto.split("eu gosto de", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "preferencias",
                valor
            )


    if "eu prefiro" in frase:

        valor = (
            texto.split("eu prefiro", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "preferencias",
                valor
            )


    # ========================================================
    # ANIMAIS FAVORITOS
    # ========================================================

    marcadores_animais = [
        "meu animal favorito é",
        "meus animais favoritos são",
        "meus animais favorito são",
    ]

    for marcador in marcadores_animais:

        if marcador in frase:

            posicao = frase.find(marcador)

            valor = texto[posicao + len(marcador):].strip()

            animais = _separar_lista(valor)

            for animal in animais:

                animal = animal.strip(" .,!?:;")

                if usuario_id and animal:

                    adicionar_memoria_usuario(
                        usuario_id,
                        "animais_favoritos",
                        animal
                    )

            break


    # ========================================================
    # ADICIONAR ANIMAL FAVORITO
    # ========================================================

    if (
        "adicionar" in frase
        and (
            "animal favorito" in frase
            or "animais favorito" in frase
            or "animais favoritos" in frase
        )
    ):

        valor = frase

        marcadores = [
            "adicionar também",
            "adicionar",
        ]

        for marcador in marcadores:

            if marcador in valor:

                valor = valor.split(
                    marcador,
                    1
                )[-1].strip()

                break

        remover = [
            "aos meus animais favoritos",
            "ao meu animal favorito",
            "nos meus animais favoritos",
            "meus animais favoritos",
            "animal favorito",
            "animais favoritos",
            "animal favorito",
            "animais favorito",
        ]

        for trecho in remover:

            valor = valor.replace(
                trecho,
                ""
            )

        animais = _separar_lista(
            valor
        )

        for animal in animais:

            if usuario_id and animal:

                adicionar_memoria_usuario(
                    usuario_id,
                    "animais_favoritos",
                    animal
                )


    # ========================================================
    # OBJETIVOS
    # ========================================================

    if "minha meta é" in frase:

        valor = (
            texto.split("minha meta é", 1)[-1]
            .strip()
        )

        if usuario_id and valor:

            adicionar_memoria_usuario(
                usuario_id,
                "objetivos",
                valor
            )


    return True


def _separar_lista(valor):

    valor = valor.strip()

    for separador in [
        " e ",
        ",",
        ";"
    ]:

        valor = valor.replace(
            separador,
            ","
        )

    resultado = []

    for item in valor.split(","):

        item = item.strip()

        if item:

            resultado.append(item)

    return resultado
