let chatAtual = null;

let usuario = localStorage.getItem("usuario");
let nomeUsuario = localStorage.getItem("nomeUsuario");

const chat = document.getElementById("chat");
const pergunta = document.getElementById("pergunta");
const listaChats = document.getElementById("listaChats");

window.onload = function () {
    if (usuario) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("registroScreen").style.display = "none";
        document.getElementById("chatScreen").style.display = "flex";
        carregarChats();
    }
};

let loginProcessando = false;

async function fazerLogin() {

    if (loginProcessando) return;
    loginProcessando = true;
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    const resposta = await fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, senha})
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
        usuario = dados.usuario.id;
        nomeUsuario = dados.usuario.nome;

        localStorage.setItem("usuario", usuario);
        localStorage.setItem("nomeUsuario", nomeUsuario);

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("registroScreen").style.display = "none";
        document.getElementById("chatScreen").style.display = "flex";

        carregarChats();
    } else {
        alert(dados.erro || "Erro ao entrar.");
    }

    loginProcessando = false;
}

function mostrarRegistro() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registroScreen").style.display = "flex";
}

function voltarLogin() {
    document.getElementById("registroScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
}

async function registrarUsuario() {
    const nome = document.getElementById("registroNome").value.trim();
    const email = document.getElementById("registroEmail").value.trim();
    const senha = document.getElementById("registroSenha").value;

    const resposta = await fetch("/api/registro", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({nome, email, senha})
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
        alert("Conta criada com sucesso!");
        voltarLogin();
    } else {
        alert(dados.erro || "Erro ao criar conta.");
    }
}

function adicionar(texto, tipo) {
    const div = document.createElement("div");
    div.className = "msg " + tipo;
    div.innerText = texto;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function limparChat() {
    chat.innerHTML = "";
}

async function carregarChats() {
    if (!usuario) return;

    try {
        const resposta = await fetch("/api/chats", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({usuario})
        });

        const chats = await resposta.json();

        listaChats.innerHTML = "";

        if (!Array.isArray(chats) || chats.length === 0) {
            listaChats.innerHTML =
                '<div class="sem-chats">Nenhuma conversa ainda.</div>';
            return;
        }

        chats.sort((a, b) => {
            if (Boolean(a.fixado) !== Boolean(b.fixado)) {
                return a.fixado ? -1 : 1;
            }

            const dataA = new Date(
                a.atualizado_em || a.criado_em || 0
            ).getTime();

            const dataB = new Date(
                b.atualizado_em || b.criado_em || 0
            ).getTime();

            return dataB - dataA;
        });

        chats.forEach(item => {
            const linha = document.createElement("div");
            linha.className = "chat-item";

            if (item.id === chatAtual) {
                linha.classList.add("ativo");
            }

            const botao = document.createElement("button");
            botao.className = "chat-titulo";
            botao.type = "button";

            botao.innerHTML =
                (item.fixado ? "📌 " : "") +
                escapeHtml(item.titulo || "Novo chat");

            botao.onclick = () => abrirChat(item.id);

            const acoes = document.createElement("div");
            acoes.className = "chat-acoes";

            const btnFixar = document.createElement("button");
            btnFixar.className = "acao-chat";
            btnFixar.type = "button";
            btnFixar.title = item.fixado ? "Desafixar" : "Fixar";
            btnFixar.innerText = item.fixado ? "📌" : "📍";

            btnFixar.onclick = e => {
                e.stopPropagation();
                alternarFixado(item.id);
            };

            const btnRenomear = document.createElement("button");
            btnRenomear.className = "acao-chat";
            btnRenomear.type = "button";
            btnRenomear.title = "Renomear";
            btnRenomear.innerText = "✏️";

            btnRenomear.onclick = e => {
                e.stopPropagation();
                renomearChat(item.id, item.titulo);
            };

            const btnExcluir = document.createElement("button");
            btnExcluir.className = "acao-chat excluir";
            btnExcluir.type = "button";
            btnExcluir.title = "Excluir";
            btnExcluir.innerText = "🗑️";

            btnExcluir.onclick = e => {
                e.stopPropagation();
                excluirChat(item.id, item.titulo);
            };

            acoes.appendChild(btnFixar);
            acoes.appendChild(btnRenomear);
            acoes.appendChild(btnExcluir);

            linha.appendChild(botao);
            linha.appendChild(acoes);

            listaChats.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar chats:", erro);
    }
}

async function novoChat() {
    if (!usuario) return;

    try {
        const resposta = await fetch("/api/chat/novo", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({usuario})
        });

        const dados = await resposta.json();

        if (!dados.sucesso) {
            alert(dados.erro || "Não foi possível criar o chat.");
            return;
        }

        chatAtual = dados.chat.id;

        limparChat();

        await carregarChats();

        fecharMenu();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao criar nova conversa.");
    }
}

async function abrirChat(chatId) {
    if (!usuario || !chatId) return;

    chatAtual = chatId;

    limparChat();

    try {
        const resposta = await fetch("/api/chat/historico", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                usuario,
                chat: chatId
            })
        });

        const historico = await resposta.json();

        if (Array.isArray(historico)) {
            historico.forEach(item => {
                if (item.usuario) {
                    adicionar("👤 " + item.usuario, "user");
                }

                if (item.ia) {
                    adicionar("🤖 " + item.ia, "bot");
                }
            });
        }

        await carregarChats();
        fecharMenu();

    } catch (erro) {
        console.error("Erro ao abrir histórico:", erro);
    }
}

async function enviar() {
    const texto = pergunta.value.trim();

    if (!texto || !usuario) return;

    adicionar("👤 " + texto, "user");

    pergunta.value = "";

    if (!chatAtual) {
        const respostaNovo = await fetch("/api/chat/novo", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({usuario})
        });

        const novo = await respostaNovo.json();

        if (!novo.sucesso) {
            adicionar("🤖 Não foi possível criar a conversa.", "bot");
            return;
        }

        chatAtual = novo.chat.id;
    }

    try {
        const resposta = await fetch("/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                usuario,
                nome: nomeUsuario,
                mensagem: texto,
                chat_id: chatAtual
            })
        });

        const dados = await resposta.json();

        adicionar(
            "🤖 " + (dados.resposta || "Não recebi uma resposta válida."),
            "bot"
        );

        await carregarChats();

    } catch (erro) {
        console.error(erro);
        adicionar("🤖 Erro ao comunicar com o servidor.", "bot");
    }
}

async function renomearChat(chatId, tituloAtual) {
    const novoTitulo = prompt(
        "Novo nome da conversa:",
        tituloAtual || ""
    );

    if (!novoTitulo || !novoTitulo.trim()) return;

    try {
        const resposta = await fetch("/api/chat/renomear", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                usuario,
                chat_id: chatId,
                titulo: novoTitulo.trim()
            })
        });

        const dados = await resposta.json();

        if (!dados.sucesso) {
            alert(dados.erro || "Não foi possível renomear.");
            return;
        }

        await carregarChats();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao renomear conversa.");
    }
}

async function alternarFixado(chatId) {
    try {
        const resposta = await fetch("/api/chat/fixar", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                usuario,
                chat_id: chatId
            })
        });

        const dados = await resposta.json();

        if (!dados.sucesso) {
            alert(dados.erro || "Não foi possível alterar o chat.");
            return;
        }

        await carregarChats();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao fixar conversa.");
    }
}

async function excluirChat(chatId, titulo) {
    const confirmar = confirm(
        'Excluir a conversa "' +
        (titulo || "Novo chat") +
        '"?'
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch("/api/chat/excluir", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                usuario,
                chat_id: chatId
            })
        });

        const dados = await resposta.json();

        if (!dados.sucesso) {
            alert(dados.erro || "Não foi possível excluir.");
            return;
        }

        if (chatAtual === chatId) {
            chatAtual = null;
            limparChat();
        }

        await carregarChats();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir conversa.");
    }
}

function escapeHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

pergunta.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviar();
    }
});

function abrirMenu() {
    document.getElementById("menu").classList.toggle("ativo");
}

function fecharMenu() {
    document.getElementById("menu").classList.remove("ativo");
}
