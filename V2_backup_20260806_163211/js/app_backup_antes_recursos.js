// ============================================================
// ROCHA AI V2 - APP.JS
// CHAT + NOVO CHAT + HISTÓRICO
// ============================================================

const input = document.getElementById("mensagem");
const button = document.getElementById("enviar-mensagem");
const chatBox = document.getElementById("chat-box");
const novoChatButton = document.getElementById("novo-chat");
const listaChats = document.getElementById("lista-chats");

let chatAtual = null;


// ============================================================
// USUÁRIO
// ============================================================

function obterUsuario() {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) {
        return null;
    }

    try {
        return JSON.parse(salvo);
    } catch (erro) {
        console.error("Erro ao ler usuário:", erro);
        return null;
    }
}


// ============================================================
// MENSAGENS
// ============================================================

function adicionarMensagem(texto, classe) {

    if (!chatBox) {
        return;
    }

    const div = document.createElement("div");

    div.className = classe;
    div.innerText = texto;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}


function limparChat() {

    if (!chatBox) {
        return;
    }

    chatBox.innerHTML = "";
}


function mensagemInicial() {

    limparChat();

    adicionarMensagem(
        "🤖 Olá! Eu sou a ROCHA AI.\nComo posso ajudar?",
        "bot-message"
    );
}


// ============================================================
// MOSTRAR HISTÓRICO
// ============================================================

function mostrarHistorico(mensagens) {

    limparChat();

    if (!Array.isArray(mensagens) || mensagens.length === 0) {

        adicionarMensagem(
            "🤖 Olá! Como posso ajudar?",
            "bot-message"
        );

        return;
    }

    mensagens.forEach(function(mensagem) {

        if (mensagem.usuario) {

            adicionarMensagem(
                "👤 " + mensagem.usuario,
                "user-message"
            );
        }

        if (mensagem.ia) {

            adicionarMensagem(
                "🤖 " + mensagem.ia,
                "bot-message"
            );
        }

    });
}


// ============================================================
// CARREGAR LISTA DE CHATS
// ============================================================

async function carregarChats() {

    if (!listaChats) {
        return;
    }

    const usuario = obterUsuario();

    if (!usuario || !usuario.id) {
        return;
    }

    try {

        const resposta = await fetch(
            "/api/chats",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario: usuario.id
                })
            }
        );

        if (!resposta.ok) {
            console.error("Erro ao carregar chats:", resposta.status);
            return;
        }

        const chats = await resposta.json();

        listaChats.innerHTML = "";

        const titulo = document.createElement("div");
        titulo.className = "lista-chats-titulo";
        titulo.innerText = "Conversas";

        listaChats.appendChild(titulo);

        if (!Array.isArray(chats) || chats.length === 0) {

            const vazio = document.createElement("div");
            vazio.className = "chat-vazio";
            vazio.innerText = "Nenhuma conversa ainda.";

            listaChats.appendChild(vazio);

            return;
        }

        // Chats fixados primeiro
        chats.sort(function(a, b) {

            if (Boolean(a.fixado) !== Boolean(b.fixado)) {
                return a.fixado ? -1 : 1;
            }

            return String(b.atualizado_em || "")
                .localeCompare(String(a.atualizado_em || ""));
        });

        chats.forEach(function(chat) {

            const item = document.createElement("div");
            item.className = "chat-item";

            if (chat.id === chatAtual) {
                item.classList.add("chat-item-ativo");
            }

            // ------------------------------------------------
            // CONTEÚDO
            // ------------------------------------------------

            const nome = document.createElement("span");

            nome.className = "chat-item-nome";

            nome.innerText =
                (chat.fixado ? "📌 " : "") +
                (chat.titulo || "Novo chat");

            item.appendChild(nome);

            // ------------------------------------------------
            // BOTÃO DE OPÇÕES
            // ------------------------------------------------

            const opcoes = document.createElement("button");

            opcoes.className = "chat-opcoes";
            opcoes.type = "button";
            opcoes.innerText = "⋮";
            opcoes.title = "Opções";

            opcoes.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    mostrarOpcoesChat(
                        chat,
                        item
                    );
                }
            );

            item.appendChild(opcoes);

            // ------------------------------------------------
            // ABRIR CHAT
            // ------------------------------------------------

            item.addEventListener(
                "click",
                function() {
                    abrirChat(chat.id);
                }
            );

            listaChats.appendChild(item);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar chats:",
            erro
        );
    }
}


// ============================================================
// MENU DE OPÇÕES DO CHAT
// ============================================================

function mostrarOpcoesChat(chat, item) {

    // Remove menus anteriores
    document
        .querySelectorAll(".chat-menu")
        .forEach(function(menu) {
            menu.remove();
        });

    const menu = document.createElement("div");

    menu.className = "chat-menu";

    // --------------------------------------------------------
    // FIXAR
    // --------------------------------------------------------

    const fixar = document.createElement("button");

    fixar.type = "button";

    fixar.innerText =
        chat.fixado
            ? "📌 Desafixar"
            : "📌 Fixar";

    fixar.addEventListener(
        "click",
        async function() {

            menu.remove();

            await executarAcaoChat(
                "/api/chat/fixar",
                chat.id
            );
        }
    );

    menu.appendChild(fixar);

    // --------------------------------------------------------
    // RENOMEAR
    // --------------------------------------------------------

    const renomear = document.createElement("button");

    renomear.type = "button";
    renomear.innerText = "✏️ Renomear";

    renomear.addEventListener(
        "click",
        async function() {

            menu.remove();

            const novoTitulo = window.prompt(
                "Novo nome da conversa:",
                chat.titulo || "Novo chat"
            );

            if (!novoTitulo || !novoTitulo.trim()) {
                return;
            }

            try {

                const resposta = await fetch(
                    "/api/chat/renomear",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            usuario:
                                obterUsuario().id,

                            chat_id:
                                chat.id,

                            titulo:
                                novoTitulo.trim()
                        })
                    }
                );

                const dados =
                    await resposta.json();

                if (!resposta.ok || !dados.sucesso) {

                    alert(
                        dados.erro ||
                        "Não foi possível renomear."
                    );

                    return;
                }

                await carregarChats();

            } catch (erro) {

                console.error(
                    "Erro ao renomear:",
                    erro
                );

                alert(
                    "Erro ao conectar com o servidor."
                );
            }
        }
    );

    menu.appendChild(renomear);

    // --------------------------------------------------------
    // EXCLUIR
    // --------------------------------------------------------

    const excluir = document.createElement("button");

    excluir.type = "button";
    excluir.className = "chat-menu-excluir";
    excluir.innerText = "🗑️ Excluir";

    excluir.addEventListener(
        "click",
        async function() {

            menu.remove();

            const confirmar =
                window.confirm(
                    "Excluir esta conversa?\n\nEssa ação não pode ser desfeita."
                );

            if (!confirmar) {
                return;
            }

            try {

                const resposta = await fetch(
                    "/api/chat/excluir",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            usuario:
                                obterUsuario().id,

                            chat_id:
                                chat.id
                        })
                    }
                );

                const dados =
                    await resposta.json();

                if (!resposta.ok || !dados.sucesso) {

                    alert(
                        dados.erro ||
                        "Não foi possível excluir."
                    );

                    return;
                }

                if (chatAtual === chat.id) {

                    chatAtual = null;

                    limparChat();

                    mensagemInicial();
                }

                await carregarChats();

            } catch (erro) {

                console.error(
                    "Erro ao excluir:",
                    erro
                );

                alert(
                    "Erro ao conectar com o servidor."
                );
            }
        }
    );

    menu.appendChild(excluir);

    document.body.appendChild(menu);

    const rect = item.getBoundingClientRect();

    menu.style.position = "fixed";
    menu.style.zIndex = "99999";

    let top = rect.bottom - 5;
    let left = rect.right - 175;

    if (left < 10) {
        left = 10;
    }

    if (top + 160 > window.innerHeight) {
        top = rect.top - 155;
    }

    if (top < 10) {
        top = 10;
    }

    menu.style.top = top + "px";
    menu.style.left = left + "px";

    setTimeout(function() {

        document.addEventListener(
            "click",
            function fecharMenu(event) {

                if (!menu.contains(event.target) &&
                    event.target !== opcoes) {

                    menu.remove();

                    document.removeEventListener(
                        "click",
                        fecharMenu
                    );
                }

            },
            { once: true }
        );

    }, 0);
}


// ============================================================
// EXECUTAR AÇÃO DO CHAT
// ============================================================

async function executarAcaoChat(endpoint, chatId) {

    const usuario = obterUsuario();

    if (!usuario || !usuario.id || !chatId) {
        return;
    }

    try {

        const resposta = await fetch(
            endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    usuario: usuario.id,
                    chat_id: chatId
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok || !dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível realizar a ação."
            );

            return;
        }

        await carregarChats();

    } catch (erro) {

        console.error(
            "Erro na ação do chat:",
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );
    }
}


// ============================================================
// ABRIR CHAT
// ============================================================

async function abrirChat(chatId) {

    const usuario = obterUsuario();

    if (!usuario || !usuario.id || !chatId) {
        return;
    }

    try {

        const resposta = await fetch(
            "/api/chat/historico",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    usuario: usuario.id,
                    chat: chatId
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


        const mensagens = await resposta.json();

        chatAtual = chatId;

        mostrarHistorico(mensagens);

        await carregarChats();

    } catch (erro) {

        console.error(
            "Erro ao abrir chat:",
            erro
        );
    }
}


// ============================================================
// NOVO CHAT
// ============================================================

async function criarNovoChat() {

    const usuario = obterUsuario();

    if (!usuario || !usuario.id) {

        alert(
            "Faça login para criar um novo chat."
        );

        return;
    }


    try {

        const resposta = await fetch(
            "/api/chat/novo",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    usuario: usuario.id
                })
            }
        );


        if (!resposta.ok) {

            console.error(
                "Erro ao criar chat:",
                resposta.status
            );

            alert(
                "Não foi possível criar o novo chat."
            );

            return;
        }


        const dados = await resposta.json();


        if (!dados.sucesso || !dados.chat) {

            alert(
                dados.erro ||
                "Não foi possível criar o novo chat."
            );

            return;
        }


        // Define o novo chat como atual
        chatAtual = dados.chat.id;


        // Limpa a conversa
        limparChat();


        // Mensagem inicial
        adicionarMensagem(
            "🤖 Olá! Como posso ajudar?",
            "bot-message"
        );


        // Atualiza lista
        await carregarChats();


        // Volta para o topo da conversa
        chatBox.scrollTop = 0;

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
// DETECTOR AUTOMÁTICO DE IMAGEM
// ============================================================

function pedidoDeImagem(texto) {

    if (!texto) {
        return false;
    }

    const frase = texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const padroes = [
        "gere uma imagem",
        "gera uma imagem",
        "gerar uma imagem",
        "crie uma imagem",
        "cria uma imagem",
        "criar uma imagem",
        "faca uma imagem",
        "faz uma imagem",
        "fazer uma imagem",
        "desenhe uma imagem",
        "desenha uma imagem",
        "desenhar uma imagem",
        "crie uma foto",
        "criar uma foto",
        "gere uma foto",
        "gerar uma foto",
        "faca uma foto",
        "fazer uma foto",
        "imagem de ",
        "foto de "
    ];

    return padroes.some(function (padrao) {
        return frase.includes(padrao);
    });
}


// Extrai o pedido que será enviado ao gerador
function extrairPromptImagem(texto) {

    let prompt = texto.trim();

    const remover = [
        /^gere uma imagem\s*(de)?\s*/i,
        /^gera uma imagem\s*(de)?\s*/i,
        /^gerar uma imagem\s*(de)?\s*/i,
        /^crie uma imagem\s*(de)?\s*/i,
        /^cria uma imagem\s*(de)?\s*/i,
        /^criar uma imagem\s*(de)?\s*/i,
        /^faca uma imagem\s*(de)?\s*/i,
        /^faz uma imagem\s*(de)?\s*/i,
        /^fazer uma imagem\s*(de)?\s*/i,
        /^desenhe uma imagem\s*(de)?\s*/i,
        /^desenha uma imagem\s*(de)?\s*/i,
        /^desenhar uma imagem\s*(de)?\s*/i,
        /^gere uma foto\s*(de)?\s*/i,
        /^gerar uma foto\s*(de)?\s*/i,
        /^crie uma foto\s*(de)?\s*/i,
        /^criar uma foto\s*(de)?\s*/i,
        /^faca uma foto\s*(de)?\s*/i
    ];

    remover.forEach(function (regex) {
        prompt = prompt.replace(regex, "");
    });

    return prompt.trim() || texto.trim();
}



// ============================================================
// FORMATADOR DE RESPOSTAS — ROCHA AI
// ============================================================

function escaparHTML(texto) {

    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function formatarResposta(texto) {

    if (!texto) {
        return "";
    }

    let resposta = escaparHTML(String(texto));

    // Blocos de código
    resposta = resposta.replace(
        /```([\s\S]*?)```/g,
        '<pre class="codigo-bloco"><code>$1</code></pre>'
    );

    // Código inline
    resposta = resposta.replace(
        /`([^`]+)`/g,
        '<code class="codigo-inline">$1</code>'
    );

    // Negrito
    resposta = resposta.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Títulos simples
    resposta = resposta.replace(
        /^### (.*?)$/gm,
        '<h4 class="resposta-titulo">$1</h4>'
    );

    resposta = resposta.replace(
        /^## (.*?)$/gm,
        '<h3 class="resposta-titulo">$1</h3>'
    );

    resposta = resposta.replace(
        /^# (.*?)$/gm,
        '<h2 class="resposta-titulo">$1</h2>'
    );

    // Listas
    resposta = resposta.replace(
        /^\s*[-*]\s+(.*?)$/gm,
        '<li>$1</li>'
    );

    resposta = resposta.replace(
        /(<li>.*?<\/li>)(?:\s*<li>)/gs,
        "$1<li>"
    );

    // Quebras de linha
    resposta = resposta.replace(/\n/g, "<br>");

    return resposta;
}


// ============================================================
// ENVIAR MENSAGEM

// ============================================================

async function enviarMensagem() {

    if (!input || !chatBox) {
        return;
    }

    const mensagem = input.value.trim();

    if (!mensagem) {
        return;
    }

    const usuario = obterUsuario();

    if (!usuario || !usuario.id) {

        adicionarMensagem(
            "🤖 Faça login para conversar com a ROCHA AI.",
            "bot-message"
        );

        return;
    }


    // ========================================================
    // DETECÇÃO AUTOMÁTICA DE IMAGEM
    // ========================================================

    if (pedidoDeImagem(mensagem)) {

        adicionarMensagem(
            "👤 " + mensagem,
            "user-message"
        );

        input.value = "";

        await gerarImagemAutomaticamente(
            extrairPromptImagem(mensagem)
        );

        return;
    }


    // ========================================================
    // CHAT NORMAL
    // ========================================================

    adicionarMensagem(
        "👤 " + mensagem,
        "user-message"
    );

    input.value = "";


    const carregando = document.createElement("div");

    carregando.className = "bot-message digitando";

    carregando.innerHTML = `
        <span class="digitando-logo">🤖</span>
        <span class="digitando-texto">
            ROCHA AI está digitando
        </span>
        <span class="pontos">
            <span>.</span>
            <span>.</span>
            <span>.</span>
        </span>
    `;

    chatBox.appendChild(carregando);

    chatBox.scrollTop = chatBox.scrollHeight;


    try {

        const resposta = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    mensagem: mensagem,

                    usuario: usuario.id,

                    chat_id: chatAtual

                })
            }
        );


        if (!resposta.ok) {

            carregando.innerText =
                "🤖 Erro ao comunicar com o servidor.";

            console.error(
                "Erro /api/chat:",
                resposta.status
            );

            return;
        }


        const dados = await resposta.json();


        carregando.remove();


        if (dados.chat_id) {

            chatAtual =
                dados.chat_id;
        }


        const respostaFormatada =
            formatarResposta(
                dados.resposta ||
                "Não consegui responder."
            );

        const mensagemBot =
            document.createElement("div");

        mensagemBot.className =
            "bot-message";

        const conteudoResposta =
            document.createElement("div");

        conteudoResposta.className =
            "resposta-conteudo";

        conteudoResposta.innerHTML =
            "🤖 " + respostaFormatada;

        mensagemBot.appendChild(
            conteudoResposta
        );


        const botaoCopiar =
            document.createElement("button");

        botaoCopiar.type =
            "button";

        botaoCopiar.className =
            "botao-copiar";

        botaoCopiar.title =
            "Copiar resposta";

        botaoCopiar.innerText =
            "📋 Copiar";


        botaoCopiar.addEventListener(
            "click",
            async function () {

                try {

                    await navigator.clipboard.writeText(
                        dados.resposta || ""
                    );

                    botaoCopiar.innerText =
                        "Copiado";

                    botaoCopiar.classList.add(
                        "copiado"
                    );

                    setTimeout(
                        function () {

                            botaoCopiar.innerText =
                                "Copiar";

                            botaoCopiar.classList.remove(
                                "copiado"
                            );

                        },
                        1800
                    );

                } catch (erro) {

                    console.error(
                        "Erro ao copiar:",
                        erro
                    );

                    botaoCopiar.innerText =
                        "❌ Erro ao copiar";

                    setTimeout(
                        function () {

                            botaoCopiar.innerText =
                                "📋 Copiar";

                        },
                        1800
                    );
                }
            }
        );


        mensagemBot.appendChild(
            botaoCopiar
        );


        const botaoRegenerar =
            document.createElement("button");

        botaoRegenerar.type =
            "button";

        botaoRegenerar.className =
            "botao-regenerar";

        botaoRegenerar.title =
            "Gerar outra resposta";

        botaoRegenerar.innerText =
            "Regenerar";


        botaoRegenerar.addEventListener(
            "click",
            async function () {

                if (
                    botaoRegenerar.disabled
                ) {
                    return;
                }


                botaoRegenerar.disabled =
                    true;

                botaoRegenerar.innerText =
                    "Gerando...";


                try {

                    const respostaNova =
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
                                        chatAtual,

                                    regenerar:
                                        true

                                })
                            }
                        );


                    if (!respostaNova.ok) {

                        throw new Error(
                            "Erro ao regenerar"
                        );

                    }


                    const novaDados =
                        await respostaNova.json();


                    const novoTexto =
                        novaDados.resposta ||
                        "Não consegui gerar uma nova resposta.";


                    const novoFormatado =
                        typeof formatarResposta ===
                        "function"
                            ? formatarResposta(
                                novoTexto
                            )
                            : novoTexto
                                .replace(
                                    /\n/g,
                                    "<br>"
                                );


                    const conteudo =
                        mensagemBot.querySelector(
                            ".resposta-conteudo"
                        );


                    if (conteudo) {

                        conteudo.innerHTML =
                            "🤖 " +
                            novoFormatado;

                    }


                    botaoRegenerar.innerText =
                        "Regenerar";


                } catch (erro) {

                    console.error(
                        "Erro ao regenerar resposta:",
                        erro
                    );


                    botaoRegenerar.innerText =
                        "Erro";


                    setTimeout(
                        function () {

                            botaoRegenerar.innerText =
                                "Regenerar";

                        },
                        1500
                    );

                }


                botaoRegenerar.disabled =
                    false;

            }
        );


        mensagemBot.appendChild(
            botaoRegenerar
        );


        chatBox.appendChild(
            mensagemBot
        );

        chatBox.scrollTop =
            chatBox.scrollHeight;


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
// GERAR IMAGEM AUTOMATICAMENTE
// ============================================================

async function gerarImagemAutomaticamente(prompt) {

    if (!prompt || !prompt.trim()) {

        adicionarMensagem(
            "🤖 Descreva qual imagem você quer gerar.",
            "bot-message"
        );

        return;
    }


    const carregando =
        document.createElement("div");

    carregando.className =
        "bot-message";

    carregando.innerText =
        "🤖 Criando sua imagem...";

    chatBox.appendChild(carregando);

    chatBox.scrollTop =
        chatBox.scrollHeight;


    try {

        const resposta =
            await fetch(
                "/api/gerar-imagem",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        prompt: prompt.trim()
                    })
                }
            );


        const dados =
            await resposta.json();


        carregando.remove();


        if (
            !resposta.ok ||
            !dados.sucesso
        ) {

            adicionarMensagem(
                "❌ " +
                (
                    dados.erro ||
                    "Não foi possível gerar a imagem."
                ),
                "bot-message"
            );

            console.error(
                "Erro no gerador:",
                dados
            );

            return;
        }


        // ====================================================
        // CONTAINER DA IMAGEM
        // ====================================================

        const container =
            document.createElement("div");

        container.className =
            "bot-message";


        // ====================================================
        // TEXTO
        // ====================================================

        const texto =
            document.createElement("div");

        texto.className =
            "imagem-prompt";

        texto.innerText =
            "🤖 Imagem gerada";

        container.appendChild(
            texto
        );


        // ====================================================
        // IMAGEM
        // ====================================================

        const imagem =
            document.createElement("img");

        imagem.className =
            "imagem-gerada";

        imagem.src =
            dados.imagem;

        imagem.alt =
            prompt;

        imagem.loading =
            "lazy";


        container.appendChild(
            imagem
        );


        chatBox.appendChild(
            container
        );

        chatBox.scrollTop =
            chatBox.scrollHeight;


    } catch (erro) {

        console.error(
            "Erro ao gerar imagem:",
            erro
        );


        if (carregando) {
            carregando.remove();
        }


        adicionarMensagem(
            "❌ Erro ao conectar com o gerador de imagens.",
            "bot-message"
        );
    }
}


// ============================================================
// BOTÃO ENVIAR
// ============================================================

if (button) {

    button.addEventListener(
        "click",
        enviarMensagem
    );
}


// ============================================================
// ENTER
// ============================================================

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                enviarMensagem();
            }
        }
    );
}


// ============================================================
// BOTÃO NOVO CHAT
// ============================================================

if (novoChatButton) {

    novoChatButton.addEventListener(
        "click",
        criarNovoChat
    );
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        const usuario = obterUsuario();


        if (!usuario || !usuario.id) {

            mensagemInicial();

            return;
        }


        await carregarChats();


        // Busca lista novamente para pegar primeiro chat
        try {

            const resposta = await fetch(
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


            const chats = await resposta.json();


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
                "Erro ao iniciar chat:",
                erro
            );

            mensagemInicial();
        }

    }
);


// ============================================================
// AUTENTICAÇÃO - LOGIN E CADASTRO
// ============================================================

async function fazerLogin() {

    const emailInput =
        document.getElementById("login-email");

    const senhaInput =
        document.getElementById("login-senha");

    if (!emailInput || !senhaInput) {
        return;
    }

    const email =
        emailInput.value.trim();

    const senha =
        senhaInput.value;

    if (!email || !senha) {
        alert("Preencha o e-mail e a senha.");
        return;
    }

    try {

        const resposta =
            await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            alert(
                dados.mensagem ||
                dados.erro ||
                "E-mail ou senha inválidos."
            );

            return;
        }

        const usuario =
            dados.usuario ||
            dados;

        localStorage.setItem(
            "usuario",
            JSON.stringify(usuario)
        );

        window.location.href =
            "/?v=999";

    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );

        alert(
            "Não foi possível conectar ao servidor."
        );
    }
}


// ============================================================
// CADASTRO
// ============================================================

async function criarConta() {

    const nomeInput =
        document.getElementById("nome");

    const emailInput =
        document.getElementById("email");

    const senhaInput =
        document.getElementById("senha");

    if (
        !nomeInput ||
        !emailInput ||
        !senhaInput
    ) {
        return;
    }

    const nome =
        nomeInput.value.trim();

    const email =
        emailInput.value.trim();

    const senha =
        senhaInput.value;

    const confirmacao =
        document.querySelector(
            'input[placeholder="Confirmar senha"]'
        );

    const senhaConfirmacao =
        confirmacao
            ? confirmacao.value
            : "";

    if (!nome || !email || !senha) {

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    if (senha !== senhaConfirmacao) {

        alert(
            "As senhas não coincidem."
        );

        return;
    }

    try {

        const resposta =
            await fetch("/api/registro", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    senha: senha
                })
            });

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            alert(
                dados.mensagem ||
                dados.erro ||
                "Não foi possível criar a conta."
            );

            return;
        }

        alert(
            "Conta criada com sucesso! 🎉"
        );

        window.location.href =
            "/V2/";

    } catch (erro) {

        console.error(
            "Erro no cadastro:",
            erro
        );

        alert(
            "Não foi possível conectar ao servidor."
        );
    }
}


// ============================================================
// ATIVAR BOTÕES
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const entrar =
            document.getElementById("entrar");

        if (entrar) {

            entrar.addEventListener(
                "click",
                fazerLogin
            );

        }


        const criar =
            document.getElementById("criar-conta");

        if (criar) {

            criar.addEventListener(
                "click",
                criarConta
            );

        }

    }
);


// ============================================================
// LOGIN
// ============================================================

const botaoEntrar = document.getElementById("entrar");

if (botaoEntrar) {

    botaoEntrar.addEventListener("click", async function () {

        const email =
            document.getElementById("login-email")?.value.trim();

        const senha =
            document.getElementById("login-senha")?.value;

        if (!email || !senha) {
            alert("Digite seu e-mail e sua senha.");
            return;
        }

        botaoEntrar.disabled = true;
        botaoEntrar.innerText = "Entrando...";

        try {

            const resposta = await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    senha: senha
                })

            });

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {

                alert(
                    dados.erro ||
                    "E-mail ou senha incorretos."
                );

                return;
            }

            // Salva o usuário para o sistema de chats
            localStorage.setItem(
                "usuario",
                JSON.stringify(dados.usuario)
            );

            // Vai para o chat V2
            window.location.href =
                "/?v=999";

        } catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );

            alert(
                "Não foi possível conectar ao servidor."
            );

        } finally {

            botaoEntrar.disabled = false;
            botaoEntrar.innerText = "Entrar";

        }

    });

}


// ============================================================
// REGISTRO
// ============================================================

const botaoCriarConta =
    document.getElementById("criar-conta");

if (botaoCriarConta) {

    botaoCriarConta.addEventListener(
        "click",
        async function () {

            const nome =
                document.getElementById("nome")?.value.trim();

            const email =
                document.getElementById("email")?.value.trim();

            const senha =
                document.getElementById("senha")?.value;

            const confirmarSenha =
                document.getElementById(
                    "confirmar-senha"
                )?.value;


            if (!nome) {

                alert("Digite seu nome.");
                return;

            }


            if (!email) {

                alert("Digite seu e-mail.");
                return;

            }


            if (!senha) {

                alert("Digite sua senha.");
                return;

            }


            if (senha !== confirmarSenha) {

                alert("As senhas não coincidem.");
                return;

            }


            if (senha.length < 4) {

                alert(
                    "A senha precisa ter pelo menos 4 caracteres."
                );

                return;

            }


            botaoCriarConta.disabled = true;
            botaoCriarConta.innerText =
                "Criando conta...";


            try {

                const resposta =
                    await fetch("/api/registro", {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            nome: nome,
                            email: email,
                            senha: senha

                        })

                    });


                const dados =
                    await resposta.json();


                if (!resposta.ok || !dados.sucesso) {

                    alert(
                        dados.erro ||
                        "Não foi possível criar a conta."
                    );

                    return;

                }


                // Login automático após cadastro
                localStorage.setItem(
                    "usuario",
                    JSON.stringify(dados.usuario)
                );


                alert(
                    "Conta criada com sucesso! 🚀"
                );


                window.location.href =
                    "/?v=999";


            } catch (erro) {

                console.error(
                    "Erro no cadastro:",
                    erro
                );

                alert(
                    "Não foi possível conectar ao servidor."
                );

            } finally {

                botaoCriarConta.disabled = false;

                botaoCriarConta.innerText =
                    "Criar conta";

            }

        }
    );

}

// ============================================================
// GERADOR DE IMAGENS - CLOUDFLARE
// ============================================================

async function gerarImagem() {

    const botao = document.getElementById("gerar-imagem");

    if (!botao) {
        return;
    }

    const prompt = window.prompt(
        "Descreva a imagem que você quer gerar:"
    );

    if (!prompt || !prompt.trim()) {
        return;
    }

    botao.disabled = true;
    botao.innerText = "⏳ Gerando...";

    adicionarMensagem(
        "🖼️ Gerando imagem:\n" + prompt,
        "user-message"
    );

    const carregando = document.createElement("div");

    carregando.className = "bot-message";
    carregando.innerText = "🤖 Criando sua imagem...";

    chatBox.appendChild(carregando);

    chatBox.scrollTop = chatBox.scrollHeight;

    try {

        const resposta = await fetch(
            "/api/gerar-imagem",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: prompt.trim()
                })
            }
        );

        const dados = await resposta.json();

        carregando.remove();

        if (!resposta.ok || !dados.sucesso) {

            adicionarMensagem(
                "❌ " +
                (
                    dados.erro ||
                    "Não foi possível gerar a imagem."
                ),
                "bot-message"
            );

            console.error(
                "Erro ao gerar imagem:",
                dados
            );

            return;
        }

        // ----------------------------------------------------
        // CRIAR CONTAINER DA IMAGEM
        // ----------------------------------------------------

        const container =
            document.createElement("div");

        container.className =
            "bot-message";

        // ----------------------------------------------------
        // TEXTO
        // ----------------------------------------------------

        const texto =
            document.createElement("div");

        texto.className =
            "imagem-prompt";

        texto.innerText =
            "🤖 Imagem gerada";

        container.appendChild(texto);

        // ----------------------------------------------------
        // IMAGEM
        // ----------------------------------------------------

        const imagem =
            document.createElement("img");

        imagem.className =
            "imagem-gerada";

        imagem.src =
            dados.imagem;

        imagem.alt =
            prompt;

        imagem.loading =
            "lazy";

        container.appendChild(imagem);

        // ----------------------------------------------------
        // ADICIONAR AO CHAT
        // ----------------------------------------------------

        chatBox.appendChild(container);

        chatBox.scrollTop =
            chatBox.scrollHeight;

    } catch (erro) {

        console.error(
            "Erro no gerador:",
            erro
        );

        if (carregando) {
            carregando.remove();
        }

        adicionarMensagem(
            "❌ Erro ao conectar com o gerador de imagens.",
            "bot-message"
        );

    } finally {

        botao.disabled = false;

        botao.innerText =
            "🖼️ Gerar imagem";
    }
}


// ============================================================
// BOTÃO GERAR IMAGEM
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botao =
            document.getElementById(
                "gerar-imagem"
            );

        if (!botao) {
            return;
        }

        botao.addEventListener(
            "click",
            gerarImagem
        );

    }
);

/* ============================================================
   BUSCA DE CONVERSAS
   ============================================================ */

document.addEventListener("DOMContentLoaded", function() {

    const busca =
        document.getElementById("buscar-chats");

    const novoSecundario =
        document.getElementById("novo-chat-secundario");

    if (novoSecundario) {

        novoSecundario.addEventListener(
            "click",
            criarNovoChat
        );

    }

    if (!busca) return;

    busca.addEventListener(
        "input",
        function() {

            const termo =
                busca.value
                    .trim()
                    .toLowerCase();

            document
                .querySelectorAll(".chat-item")
                .forEach(function(item) {

                    const texto =
                        item.innerText
                            .toLowerCase();

                    item.style.display =
                        !termo ||
                        texto.includes(termo)
                            ? "flex"
                            : "none";

                });

        }
    );

});

