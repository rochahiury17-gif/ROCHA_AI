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
            console.error(
                "Erro ao carregar chats:",
                resposta.status
            );
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


        chats.forEach(function(chat) {

            const item = document.createElement("div");

            item.className = "chat-item";

            if (chat.id === chatAtual) {
                item.classList.add("chat-item-ativo");
            }

            item.innerText =
                chat.titulo || "Novo chat";


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


    // Mostra mensagem do usuário
    adicionarMensagem(
        "👤 " + mensagem,
        "user-message"
    );


    input.value = "";


    // Indicador
    const carregando = document.createElement("div");

    carregando.className = "bot-message";
    carregando.innerText = "🤖 Digitando...";

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


        // Remove "Digitando..."
        carregando.remove();


        // Guarda chat atual
        if (dados.chat_id) {

            chatAtual =
                dados.chat_id;
        }


        // Resposta da IA
        adicionarMensagem(
            "🤖 " +
            (
                dados.resposta ||
                "Não consegui responder."
            ),
            "bot-message"
        );


        // Atualiza lista
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
