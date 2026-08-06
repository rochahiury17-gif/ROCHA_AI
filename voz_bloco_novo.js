(function ROCHA_VOZ() {

    const botao =
        document.getElementById("botao-conversa-voz");

    const campo =
        document.getElementById("mensagem");

    if (!botao || !campo) {
        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "ROCHA AI: reconhecimento de voz não disponível."
        );

        botao.disabled = true;
        botao.title =
            "Reconhecimento de voz não disponível";

        return;
    }


    let ativo = false;
    let ouvindo = false;
    let falando = false;
    let reconhecimento = null;


    // ========================================================
    // TTS
    // ========================================================

    function falar(texto) {

        return new Promise(function(resolve) {

            if (!window.speechSynthesis) {

                resolve();
                return;

            }


            texto = String(texto || "")
                .replace(/```[\s\S]*?```/g, "")
                .replace(/[*_#>`]/g, "")
                .replace(/\n+/g, ". ")
                .trim();


            if (!texto) {

                resolve();
                return;

            }


            window.speechSynthesis.cancel();


            const fala =
                new SpeechSynthesisUtterance(texto);


            fala.lang = "pt-BR";
            fala.rate = 1;
            fala.pitch = 1;
            fala.volume = 1;


            const vozes =
                window.speechSynthesis.getVoices();


            const voz =
                vozes.find(function(v) {

                    return (
                        v.lang &&
                        v.lang
                            .toLowerCase()
                            .startsWith("pt-br")
                    );

                });


            if (voz) {
                fala.voice = voz;
            }


            falando = true;

            atualizarBotao();


            fala.onend =
                function() {

                    falando = false;

                    atualizarBotao();

                    resolve();

                };


            fala.onerror =
                function(erro) {

                    console.error(
                        "ROCHA AI TTS:",
                        erro
                    );

                    falando = false;

                    atualizarBotao();

                    resolve();

                };


            window.speechSynthesis.speak(
                fala
            );

        });

    }


    window.ROCHA_FALAR = falar;


    // ========================================================
    // BOTÃO
    // ========================================================

    function atualizarBotao() {

        if (!ativo) {

            botao.innerText = "🗣️";
            botao.classList.remove("ativo");
            botao.classList.remove("ouvindo");

            return;

        }


        botao.classList.add("ativo");


        if (falando) {

            botao.innerText = "🔊";
            botao.classList.remove("ouvindo");

        } else if (ouvindo) {

            botao.innerText = "🔴";
            botao.classList.add("ouvindo");

        } else {

            botao.innerText = "🗣️";

        }

    }


    // ========================================================
    // INICIAR RECONHECIMENTO
    // ========================================================

    function iniciarEscuta() {

        if (!ativo || falando || ouvindo) {
            return;
        }


        reconhecimento =
            new SpeechRecognition();


        reconhecimento.lang =
            "pt-BR";


        reconhecimento.continuous =
            false;


        reconhecimento.interimResults =
            false;


        reconhecimento.maxAlternatives =
            1;


        reconhecimento.onstart =
            function() {

                ouvindo = true;

                atualizarBotao();

                console.log(
                    "🎙️ ROCHA AI: ouvindo..."
                );

            };


        reconhecimento.onresult =
            async function(evento) {

                const texto =
                    evento.results[0][0].transcript
                        .trim();


                ouvindo = false;

                atualizarBotao();


                if (!texto) {

                    if (ativo) {
                        iniciarEscuta();
                    }

                    return;

                }


                console.log(
                    "👤 Voz:",
                    texto
                );


                // Coloca a fala no campo
                campo.value = texto;


                // Mostra o que foi reconhecido
                if (
                    typeof adicionarMensagem ===
                    "function"
                ) {

                    adicionarMensagem(
                        "👤 " + texto,
                        "user-message"
                    );

                }


                // Limpa o campo
                campo.value = "";


                // =================================================
                // ENVIA PARA A ROCHA AI
                // =================================================

                const usuario =
                    typeof obterUsuario ===
                    "function"
                        ? obterUsuario()
                        : null;


                if (!usuario || !usuario.id) {

                    if (
                        typeof adicionarMensagem ===
                        "function"
                    ) {

                        adicionarMensagem(
                            "🤖 Faça login para conversar com a ROCHA AI.",
                            "bot-message"
                        );

                    }

                    ativo = false;
                    atualizarBotao();

                    return;

                }


                try {

                    const resposta =
                        await fetch(
                            "/api/chat",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    mensagem:
                                        texto,

                                    usuario:
                                        usuario.id,

                                    chat_id:
                                        typeof chatAtual !==
                                        "undefined"
                                            ? chatAtual
                                            : null

                                })

                            }
                        );


                    if (!resposta.ok) {

                        throw new Error(
                            "Servidor retornou HTTP " +
                            resposta.status
                        );

                    }


                    const dados =
                        await resposta.json();


                    if (dados.chat_id) {

                        if (
                            typeof chatAtual !==
                            "undefined"
                        ) {

                            chatAtual =
                                dados.chat_id;

                        }

                    }


                    const respostaTexto =
                        dados.resposta ||
                        "Não consegui responder.";


                    // =================================================
                    // MOSTRAR RESPOSTA
                    // =================================================

                    if (
                        typeof adicionarMensagem ===
                        "function"
                    ) {

                        adicionarMensagem(
                            "🤖 " + respostaTexto,
                            "bot-message"
                        );

                    }


                    // =================================================
                    // FALAR RESPOSTA
                    // =================================================

                    if (ativo) {

                        await falar(
                            respostaTexto
                        );

                    }


                } catch (erro) {

                    console.error(
                        "ROCHA AI — erro na conversa por voz:",
                        erro
                    );


                    if (
                        typeof adicionarMensagem ===
                        "function"
                    ) {

                        adicionarMensagem(
                            "🤖 Não foi possível conectar ao servidor.",
                            "bot-message"
                        );

                    }

                }


                // =================================================
                // VOLTA A ESCUTAR
                // =================================================

                if (ativo) {

                    setTimeout(
                        function() {

                            iniciarEscuta();

                        },
                        500
                    );

                }

            };


        reconhecimento.onerror =
            function(erro) {

                console.error(
                    "ROCHA AI — reconhecimento:",
                    erro
                );


                ouvindo = false;

                atualizarBotao();


                if (
                    !ativo
                ) {
                    return;
                }


                // Permissão negada
                if (
                    erro.error ===
                    "not-allowed"
                ) {

                    adicionarMensagem(
                        "🤖 Permita o acesso ao microfone para usar a conversa por voz.",
                        "bot-message"
                    );

                    ativo = false;

                    atualizarBotao();

                    return;

                }


                if (
                    erro.error ===
                    "no-speech"
                ) {

                    setTimeout(
                        iniciarEscuta,
                        400
                    );

                    return;

                }


                setTimeout(
                    iniciarEscuta,
                    600
                );

            };


        reconhecimento.onend =
            function() {

                ouvindo = false;

                atualizarBotao();


                if (
                    ativo &&
                    !falando
                ) {

                    setTimeout(
                        iniciarEscuta,
                        300
                    );

                }

            };


        try {

            reconhecimento.start();

        } catch (erro) {

            console.log(
                "ROCHA AI: reconhecimento já iniciado."
            );

        }

    }


    // ========================================================
    // ATIVAR / DESATIVAR
    // ========================================================

    botao.addEventListener(
        "click",
        function() {

            ativo =
                !ativo;


            if (!ativo) {

                if (reconhecimento) {

                    try {
                        reconhecimento.stop();
                    } catch (erro) {}

                }


                if (
                    window.speechSynthesis
                ) {

                    window.speechSynthesis.cancel();

                }


                ouvindo = false;
                falando = false;

                atualizarBotao();


                console.log(
                    "🛑 ROCHA AI: conversa por voz encerrada."
                );

                return;

            }


            console.log(
                "🗣️ ROCHA AI: conversa por voz iniciada."
            );


            atualizarBotao();


            iniciarEscuta();

        }
    );


    atualizarBotao();


})();

