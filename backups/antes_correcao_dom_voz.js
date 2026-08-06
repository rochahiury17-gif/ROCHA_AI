document.body.insertAdjacentHTML("afterbegin","<div style="position:fixed;top:0;left:0;right:0;background:red;color:white;z-index:99999;padding:20px;font-size:20px">JS ROCHA CARREGOU</div>");
window.onerror=function(msg,src,line,col){alert('ERRO JS: '+msg+' linha '+line);};

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


        // ========================================================
        // BOTÃO CONTINUAR RESPOSTA
        // ========================================================

        const botaoContinuar =
            document.createElement("button");

        botaoContinuar.type =
            "button";

        botaoContinuar.className =
            "botao-continuar";

        botaoContinuar.title =
            "Continuar resposta";

        botaoContinuar.innerText =
            "↗ Continuar";


        botaoContinuar.addEventListener(
            "click",
            async function () {

                if (
                    botaoContinuar.disabled
                ) {
                    return;
                }


                botaoContinuar.disabled =
                    true;

                botaoContinuar.innerText =
                    "Continuando...";


                try {

                    const respostaContinuar =
                        await fetch(
                            "/api/chat/continuar",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    usuario:
                                        usuario.id,

                                    chat_id:
                                        chatAtual

                                })
                            }
                        );


                    if (!respostaContinuar.ok) {

                        throw new Error(
                            "Erro ao continuar resposta"
                        );

                    }


                    const dadosContinuar =
                        await respostaContinuar.json();


                    const textoContinuacao =
                        dadosContinuar.resposta ||
                        "";


                    if (!textoContinuacao.trim()) {

                        throw new Error(
                            "A IA não retornou continuação."
                        );

                    }


                    const formatadoContinuacao =
                        typeof formatarResposta ===
                        "function"
                            ? formatarResposta(
                                textoContinuacao
                            )
                            : textoContinuacao
                                .replace(
                                    /\n/g,
                                    "<br>"
                                );


                    const blocoContinuacao =
                        document.createElement(
                            "div"
                        );

                    blocoContinuacao.className =
                        "resposta-continuacao";


                    blocoContinuacao.innerHTML =
                        formatadoContinuacao;


                    conteudoResposta.appendChild(
                        document.createElement("br")
                    );


                    conteudoResposta.appendChild(
                        blocoContinuacao
                    );


                    botaoContinuar.innerText =
                        "✓ Continuado";


                    botaoContinuar.classList.add(
                        "continuado"
                    );


                    // Atualiza o botão Copiar
                    // para copiar também a continuação.

                    botaoCopiar.onclick =
                        async function () {

                            try {

                                const textoCompleto =
                                    dadosContinuar
                                        .resposta_completa ||
                                    textoContinuacao;


                                await navigator
                                    .clipboard
                                    .writeText(
                                        textoCompleto
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

                            }
                        };


                    rolarChatParaBaixo();


                } catch (erro) {

                    console.error(
                        "Erro ao continuar resposta:",
                        erro
                    );


                    botaoContinuar.innerText =
                        "↗ Tentar novamente";


                    botaoContinuar.disabled =
                        false;

                    return;

                }


                botaoContinuar.disabled =
                    true;

            }
        );


        mensagemBot.appendChild(
            botaoContinuar
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




// ===== LOGIN LIMPO ROCHA AI =====

document.addEventListener("DOMContentLoaded",()=>{

const entrar=document.getElementById("entrar");

if(entrar){

entrar.onclick=async()=>{

const email=document.getElementById("login-email").value.trim();
const senha=document.getElementById("login-senha").value;


if(!email || !senha){
alert("Digite email e senha");
return;
}


try{

const resposta=await fetch("/api/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:email,
senha:senha
})

});


const dados=await resposta.json();

console.log("LOGIN:",dados);


if(!resposta.ok){

alert(dados.erro || "Login inválido");
return;

}


localStorage.setItem(
"usuario",
JSON.stringify(dados.usuario || dados)
);


document.getElementById("loginScreen").style.display="none";

document.getElementById("registroScreen").style.display="none";

document.getElementById("chatScreen").style.display="flex";


if(typeof carregarChats==="function"){
carregarChats();
}


}catch(e){

console.error(e);
alert("Erro ao conectar");

}

};

}



const abrir=document.getElementById("abrirRegistro");

if(abrir){

abrir.onclick=()=>{

document.getElementById("loginScreen").style.display="none";

document.getElementById("registroScreen").style.display="block";

};

}



const voltar=document.getElementById("voltarLogin");

if(voltar){

voltar.onclick=()=>{

document.getElementById("registroScreen").style.display="none";

document.getElementById("loginScreen").style.display="block";

};

}



});

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarEnvio
        );

    } else {

        iniciarEnvio();

    }

})();


// ============================================================
// ROCHA AI — CONVERSA POR VOZ
// ============================================================

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



// ============================================================
// ROCHA AI — CONVERSA POR VOZ
// ============================================================

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

