

function mostrarPensandoChat(){

    if(typeof adicionarMensagem !== "function"){
        return;
    }

    adicionarMensagem(
        "🤖 ROCHA AI\n\nPensando... (Carregando) ⏳",
        "bot-message pensando-rocha"
    );

}


function formatarRespostaRocha(texto){

    return `
<div class="rocha-resposta">

<div class="rocha-titulo">
🤖 ROCHA AI
</div>

<div class="rocha-linha"></div>

<div class="rocha-texto">
${texto}
</div>

</div>
`;

}

// ============================================================
// ROCHA AI V2 - APP.JS
// ============================================================


// ============================================================
// ELEMENTOS
// ============================================================

const input = document.getElementById("mensagem");
const button = document.getElementById("enviar-mensagem");
const chatBox = document.getElementById("chat-box");

const novoChatButton =
    document.getElementById("novo-chat");

const listaChats =
    document.getElementById("lista-chats");


// ============================================================
// ESTADO
// ============================================================

let chatAtual = null;


// ============================================================
// USUÁRIO
// ============================================================

function obterUsuario() {

    const usuarioSalvo =
        localStorage.getItem("usuario");

    if (!usuarioSalvo) {
        return null;
    }

    try {

        return JSON.parse(usuarioSalvo);

    } catch (erro) {

        console.error(
            "Erro ao ler usuário:",
            erro
        );

        return null;
    }
}


// ============================================================
// MENSAGENS NA TELA
// ============================================================

function adicionarMensagem(
    texto,
    classe
) {

    if (!chatBox) {
        return;
    }

    const div =
        document.createElement("div");

    div.className = classe;

    div.innerText = texto;

    chatBox.appendChild(div);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// ============================================================
// LIMPAR CONVERSA
// ============================================================

function limparChat() {

    if (!chatBox) {
        return;
    }

    chatBox.innerHTML = "";
}


// ============================================================
// MENSAGEM INICIAL
// ============================================================

function mensagemInicial() {

    if (!chatBox) {
        return;
    }

    limparChat();

    adicionarMensagem(
        "🤖 Olá! Eu sou a ROCHA AI.\nComo posso ajudar?",
        "bot-message"
    );
}


// ============================================================
// MOSTRAR HISTÓRICO
// ============================================================

function mostrarHistorico(
    mensagens
) {

    limparChat();

    if (
        !Array.isArray(mensagens) ||
        mensagens.length === 0
    ) {

        adicionarMensagem(
            "🤖 Olá! Como posso ajudar?",
            "bot-message"
        );

        return;
    }


    mensagens.forEach(
        function(mensagem) {

            if (mensagem.usuario) {

                adicionarMensagem(
                    "👤 " +
                    mensagem.usuario,
                    "user-message"
                );

            }


            if (mensagem.ia) {

                adicionarMensagem(
                    "🤖 " +
                    mensagem.ia,
                    "bot-message"
                );

            }

        }
    );
}


// ============================================================
// CARREGAR LISTA DE CHATS
// ============================================================

async function carregarChats() {

    if (!listaChats) {
        return;
    }

    const usuario =
        obterUsuario();

    if (!usuario) {
        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/chats",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        usuario: usuario.id
                    })
                }
            );


        if (!resposta.ok) {

            console.error(
                "Erro ao carregar chats:",
                resposta.status
            );

            return;
        }


        const chats =
            await resposta.json();


        listaChats.innerHTML = "";


        const titulo =
            document.createElement("div");

        titulo.className =
            "lista-chats-titulo";

        titulo.innerText =
            "Conversas";

        listaChats.appendChild(
            titulo
        );


        if (
            !Array.isArray(chats) ||
            chats.length === 0
        ) {

            const vazio =
                document.createElement("div");

            vazio.className =
                "chat-vazio";

            vazio.innerText =
                "Nenhuma conversa ainda.";

            listaChats.appendChild(
                vazio
            );

            return;
        }


        chats.forEach(
            function(chat) {

                const item =
                    document.createElement("div");

                item.className =
                    "chat-item";


                if (
                    chat.id === chatAtual
                ) {

                    item.classList.add(
                        "chat-item-ativo"
                    );

                }


                item.innerText =
                    chat.titulo ||
                    "Novo chat";


                item.addEventListener(
                    "click",
                    function() {

                        abrirChat(
                            chat.id
                        );

                    }
                );


                listaChats.appendChild(
                    item
                );

            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar lista de chats:",
            erro
        );

    }
}


// ============================================================
// ABRIR CHAT
// ============================================================

async function abrirChat(
    chatId
) {

    const usuario =
        obterUsuario();

    if (!usuario || !chatId) {
        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/chat/historico",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        usuario:
                            usuario.id,

                        chat:
                            chatId

                    })
                }
            );


        if (!resposta.ok) {

            console.error(
                "Erro ao abrir chat:",
                resposta.status
            );

            return;
        }


        const mensagens =
            await resposta.json();


        chatAtual =
            chatId;


        mostrarHistorico(
            mensagens
        );


        await carregarChats();


    } catch (erro) {

        console.error(
            "Erro ao abrir chat:",
            erro
        );

    }
}


// ============================================================
// CRIAR NOVO CHAT
// ============================================================

async function criarNovoChat() {

    const usuario =
        obterUsuario();

    if (!usuario) {

        alert(
            "Faça login para criar um chat."
        );

        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/chat/novo",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        usuario:
                            usuario.id

                    })
                }
            );


        if (!resposta.ok) {

            const texto =
                await resposta.text();

            console.error(
                "Erro ao criar novo chat:",
                resposta.status,
                texto
            );

            alert(
                "Não foi possível criar o novo chat."
            );

            return;
        }


        const dados =
            await resposta.json();


        if (
            !dados.sucesso ||
            !dados.chat
        ) {

            alert(
                dados.erro ||
                "Não foi possível criar o novo chat."
            );

            return;
        }


        chatAtual =
            dados.chat.id;


        limparChat();


        adicionarMensagem(
            "🤖 Olá! Como posso ajudar?",
            "bot-message"
        );


        await carregarChats();


    } catch (erro) {

        console.error(
            "Erro ao criar novo chat:",
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );

    }
}


// ============================================================
// ENVIAR MENSAGEM
// ============================================================

async function enviarMensagem() {

    if (!input) {
        return;
    }


    const mensagem =
        input.value.trim();


    if (!mensagem) {
        return;
    }


    const usuario =
        obterUsuario();


    if (!usuario) {

        adicionarMensagem(
            "🤖 Faça login para conversar com a ROCHA AI.",
            "bot-message"
        );

        return;
    }


    adicionarMensagem(
        "👤 " + mensagem,
        "user-message"
    );


    input.value = "";


    const carregando =
        document.createElement("div");

    carregando.className =
        "bot-message";

    carregando.innerText =
        "🤖 Digitando...";

    chatBox.appendChild(
        carregando
    );

    chatBox.scrollTop =
        chatBox.scrollHeight;


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
                            mensagem,

                        usuario:
                            usuario.id,

                        chat_id:
                            chatAtual

                    })
                }
            );


        if (!resposta.ok) {

            const erroTexto =
                await resposta.text();

            console.error(
                "Erro HTTP:",
                resposta.status,
                erroTexto
            );

            carregando.innerText =
                "🤖 Erro ao enviar mensagem.";

            return;
        }


        const dados =
            await resposta.json();


        carregando.innerText =
            "🤖 " +
            (
                dados.resposta ||
                "Não consegui responder."
            );


        if (dados.chat_id) {

            chatAtual =
                dados.chat_id;

        }


        await carregarChats();


    } catch (erro) {

        console.error(
            "Erro ao enviar mensagem:",
            erro
        );

        carregando.innerText =
            "🤖 Erro ao conectar com a IA.";

    }

}


// ============================================================
// REGISTRO
// ============================================================

async function registrarUsuario() {

    const nome =
        document.querySelector(
            "#nome"
        )?.value.trim();


    const email =
        document.querySelector(
            "#email"
        )?.value.trim();


    const senha =
        document.querySelector(
            "#senha"
        )?.value;


    if (!nome || !email || !senha) {

        alert(
            "Preencha todos os campos."
        );

        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/registro",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        nome:
                            nome,

                        email:
                            email,

                        senha:
                            senha

                    })
                }
            );


        const dados =
            await resposta.json();


        if (dados.sucesso) {

            alert(
                "Conta criada com sucesso!"
            );


            window.location.href =
                "../index.html";


        } else {

            alert(
                dados.erro ||
                "Não foi possível criar a conta."
            );

        }


    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );

    }

}


// ============================================================
// LOGIN
// ============================================================

async function fazerLogin() {

    const email =
        document.querySelector(
            "#login-email"
        )?.value.trim();


    const senha =
        document.querySelector(
            "#login-senha"
        )?.value;


    if (!email || !senha) {

        alert(
            "Digite seu e-mail e sua senha."
        );

        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            email,

                        senha:
                            senha

                    })
                }
            );


        const dados =
            await resposta.json();


        if (dados.sucesso) {

            localStorage.setItem(
                "usuario",
                JSON.stringify(
                    dados.usuario
                )
            );


            alert(
                "Login realizado com sucesso!"
            );


            window.location.href =
                "pages/chat.html";


        } else {

            alert(
                dados.erro ||
                "E-mail ou senha inválidos."
            );

        }


    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );

    }

}


// ============================================================
// MOSTRAR USUÁRIO LOGADO
// ============================================================

function mostrarUsuario() {

    const elemento =
        document.querySelector(
            "#usuario-nome"
        );


    if (!elemento) {
        return;
    }


    const usuario =
        obterUsuario();


    if (
        usuario &&
        usuario.nome
    ) {

        elemento.innerText =
            "Olá, " +
            usuario.nome +
            " 👋";

    }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "ROCHA AI: aplicativo carregado."
        );


        // --------------------------------------------------------
        // REGISTRO
        // --------------------------------------------------------

        const botaoRegistro =
            document.querySelector(
                "#criar-conta"
            );


        if (botaoRegistro) {

            botaoRegistro.addEventListener(
                "click",
                registrarUsuario
            );

        }


        // --------------------------------------------------------
        // LOGIN
        // --------------------------------------------------------

        const botaoLogin =
            document.querySelector(
                "#entrar"
            );


        if (botaoLogin) {

            botaoLogin.addEventListener(
                "click",
                fazerLogin
            );

        }


        // --------------------------------------------------------
        // USUÁRIO
        // --------------------------------------------------------

        mostrarUsuario();


        // --------------------------------------------------------
        // BOTÃO ENVIAR
        // --------------------------------------------------------

        const botaoEnviar =
            document.getElementById(
                "enviar-mensagem"
            );


        if (botaoEnviar) {

            botaoEnviar.addEventListener(
                "click",
                enviarMensagem
            );

        }


        // --------------------------------------------------------
        // ENTER
        // --------------------------------------------------------

        const campoMensagem =
            document.getElementById(
                "mensagem"
            );


        if (campoMensagem) {

            campoMensagem.addEventListener(
                "keydown",
                function(event) {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        enviarMensagem();

                    }

                }
            );

        }


        // --------------------------------------------------------
        // NOVO CHAT
        // --------------------------------------------------------

        const botaoNovoChat =
            document.getElementById(
                "novo-chat"
            );


        if (botaoNovoChat) {

            botaoNovoChat.addEventListener(
                "click",
                criarNovoChat
            );

        }


        // --------------------------------------------------------
        // CHAT
        // --------------------------------------------------------

        if (chatBox) {

            const usuario =
                obterUsuario();


            if (!usuario) {

                mensagemInicial();

                return;
            }


            await carregarChats();


            try {

                const resposta =
                    await fetch(
                        "/api/chats",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                usuario:
                                    usuario.id

                            })
                        }
                    );


                const chats =
                    await resposta.json();


                if (
                    Array.isArray(chats) &&
                    chats.length > 0
                ) {

                    await abrirChat(
                        chats[0].id
                    );

                } else {

                    mensagemInicial();

                }


            } catch (erro) {

                console.error(
                    "Erro ao inicializar chat:",
                    erro
                );

                mensagemInicial();

            }

        }

    }
);

// ========================================================
// LOADING FUTURISTA ROCHA AI
// ========================================================

function mostrarPensando(){

    if(document.getElementById("rocha-pensando")) return;

    const chatBox = document.getElementById("chat-box");
    if(!chatBox) return;

    const box = document.createElement("div");

    box.id = "rocha-pensando";
    box.className = "bot-message pensando-loading";

    box.innerHTML = `
        <div class="loading-bolha">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    // adiciona sempre no final da conversa
    chatBox.appendChild(box);

    // força ficar visível no final
    requestAnimationFrame(()=>{
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}


function esconderPensando(){

    const box =
        document.getElementById(
            "rocha-pensando"
        );

    if(box){
        box.remove();
    }

}


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

                    mostrarPensando();

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


                    setTimeout(
                        esconderPensando,
                        1000
                    );


                    // =================================================
                    // REPRODUZIR AUDIO DA ROCHA AI
                    // =================================================

                    if (dados.audio) {

                        const player =
                            new Audio(dados.audio);

                        player.play()
                            .catch(
                                erro => console.log(
                                    "Erro áudio:",
                                    erro
                                )
                            );

                    }


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

                        falar(
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
                );

                return;

            }



            atualizarBotao();


            iniciarEscuta();

        }
    );


    atualizarBotao();


})();

