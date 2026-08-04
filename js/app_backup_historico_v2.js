let chatAtual = null;

let usuario = localStorage.getItem("usuario");
let nomeUsuario = localStorage.getItem("nomeUsuario");

const chat = document.getElementById("chat");
const pergunta = document.getElementById("pergunta");
const listaChats = document.getElementById("listaChats");


// ============================================================
// INICIALIZAÇÃO
// ============================================================

window.onload = function () {

    if (usuario) {

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("registroScreen").style.display = "none";
        document.getElementById("chatScreen").style.display = "flex";

        carregarChats();
    }

};


// ============================================================
// LOGIN
// ============================================================

async function fazerLogin() {

    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

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

            alert(dados.erro || "Não foi possível entrar.");

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro de conexão com o servidor.");

    }

}


// ============================================================
// REGISTRO
// ============================================================

function mostrarRegistro() {

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registroScreen").style.display = "block";

}


function voltarLogin() {

    document.getElementById("registroScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "block";

}


async function registrarUsuario() {

    const nome = document.getElementById("registroNome").value.trim();
    const email = document.getElementById("registroEmail").value.trim();
    const senha = document.getElementById("registroSenha").value;

    try {

        const resposta = await fetch("/api/registro", {

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

        const dados = await resposta.json();

        if (dados.sucesso) {

            alert("Conta criada com sucesso!");
            voltarLogin();

        } else {

            alert(dados.erro || "Não foi possível criar a conta.");

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro de conexão com o servidor.");

    }

}


// ============================================================
// MENSAGENS
// ============================================================

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


// ============================================================
// CARREGAR LISTA DE CHATS
// ============================================================

async function carregarChats() {

    if (!usuario) return;

    try {

        const resposta = await fetch("/api/chats", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usuario: usuario
            })

        });

        const chats = await resposta.json();

        listaChats.innerHTML = "";

        if (!Array.isArray(chats) || chats.length === 0) {

            listaChats.innerHTML = `
                <div class="sem-chats">
                    Nenhuma conversa ainda.
                </div>
            `;

            return;
        }


        // Fixados primeiro.
        // Depois os mais recentemente atualizados.

        chats.sort(function (a, b) {

            if (Boolean(a.fixado) !== Boolean(b.fixado)) {

                return Boolean(b.fixado) - Boolean(a.fixado);

            }

            const dataA = a.atualizado_em
                ? new Date(a.atualizado_em).getTime()
                : 0;

            const dataB = b.atualizado_em
                ? new Date(b.atualizado_em).getTime()
                : 0;

            return dataB - dataA;

        });


        chats.forEach(function (item) {

            criarItemChat(item);

        });

    } catch (erro) {

        console.error("Erro ao carregar chats:", erro);

    }

}


// ============================================================
// ITEM DO CHAT
// ============================================================

function criarItemChat(item) {

    const container = document.createElement("div");

    container.className = "chat-item";

    if (item.id === chatAtual) {

        container.classList.add("ativo");

    }


    const principal = document.createElement("button");

    principal.className = "chat-principal";

    principal.type = "button";


    const icone = document.createElement("span");

    icone.className = "chat-icone";

    icone.innerText = item.fixado ? "📌" : "💬";


    const titulo = document.createElement("span");

    titulo.className = "chat-titulo";

    titulo.innerText = item.titulo || "Novo chat";


    principal.appendChild(icone);
    principal.appendChild(titulo);


    principal.onclick = function () {

        abrirChat(item.id);

    };


    const opcoes = document.createElement("button");

    opcoes.className = "chat-opcoes";

    opcoes.type = "button";

    opcoes.innerText = "⋮";


    opcoes.onclick = function (evento) {

        evento.stopPropagation();

        mostrarMenuChat(
            item,
            opcoes
        );

    };


    container.appendChild(principal);
    container.appendChild(opcoes);

    listaChats.appendChild(container);

}


// ============================================================
// MENU DE OPÇÕES DO CHAT
// ============================================================

function mostrarMenuChat(item, botao) {

    fecharMenusChat();


    const menu = document.createElement("div");

    menu.className = "chat-menu";


    const fixar = document.createElement("button");

    fixar.innerText = item.fixado
        ? "📌 Desafixar"
        : "📌 Fixar";

    fixar.onclick = function () {

        fecharMenusChat();
        alternarFixado(item.id);

    };


    const renomear = document.createElement("button");

    renomear.innerText = "✏️ Renomear";

    renomear.onclick = function () {

        fecharMenusChat();
        renomearChat(item.id, item.titulo);

    };


    const excluir = document.createElement("button");

    excluir.innerText = "🗑️ Excluir";

    excluir.className = "perigo";

    excluir.onclick = function () {

        fecharMenusChat();
        excluirChat(item.id);

    };


    menu.appendChild(fixar);
    menu.appendChild(renomear);
    menu.appendChild(excluir);


    botao.parentElement.appendChild(menu);

}


function fecharMenusChat() {

    document.querySelectorAll(".chat-menu").forEach(
        function (menu) {
            menu.remove();
        }
    );

}


// ============================================================
// NOVO CHAT
// ============================================================

async function novoChat() {

    if (!usuario) return;

    try {

        const resposta = await fetch("/api/chat/novo", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usuario: usuario
            })

        });

        const dados = await resposta.json();

        if (!dados.sucesso) {

            alert(dados.erro || "Não foi possível criar o chat.");
            return;

        }


        chatAtual = dados.chat.id;

        limparChat();

        fecharMenu();

        await carregarChats();

        adicionar(
            "🤖 Novo chat criado. Como posso ajudar?",
            "bot"
        );


        if (pergunta) {

            pergunta.focus();

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao criar conversa.");

    }

}


// ============================================================
// ABRIR CHAT
// ============================================================

async function abrirChat(chatId) {

    if (!usuario || !chatId) return;

    chatAtual = chatId;

    limparChat();

    fecharMenu();

    fecharMenusChat();


    try {

        const resposta = await fetch(
            "/api/chat/historico",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    chat: chatId

                })

            }
        );


        const historico = await resposta.json();


        if (Array.isArray(historico)) {

            historico.forEach(function (item) {

                if (item.usuario) {

                    adicionar(
                        "👤 " + item.usuario,
                        "user"
                    );

                }

                if (item.ia) {

                    adicionar(
                        "🤖 " + item.ia,
                        "bot"
                    );

                }

            });

        }


        await carregarChats();

    } catch (erro) {

        console.error("Erro ao abrir chat:", erro);

        adicionar(
            "⚠️ Não foi possível carregar esta conversa.",
            "bot"
        );

    }

}


// ============================================================
// ENVIAR MENSAGEM
// ============================================================

async function enviar() {

    const texto = pergunta.value.trim();

    if (!texto) return;


    adicionar(
        "👤 " + texto,
        "user"
    );

    pergunta.value = "";


    if (!chatAtual) {

        try {

            const respostaNovo = await fetch(
                "/api/chat/novo",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        usuario: usuario
                    })

                }
            );


            const novo = await respostaNovo.json();

            if (!novo.sucesso) {

                adicionar(
                    "🤖 Não foi possível criar a conversa.",
                    "bot"
                );

                return;

            }

            chatAtual = novo.chat.id;

        } catch (erro) {

            console.error(erro);

            adicionar(
                "🤖 Erro ao criar a conversa.",
                "bot"
            );

            return;

        }

    }


    const pensando = document.createElement("div");

    pensando.className = "msg bot pensando";
    pensando.innerText = "🤖 Pensando...";

    chat.appendChild(pensando);

    chat.scrollTop = chat.scrollHeight;


    try {

        const resposta = await fetch(
            "/api/chat",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    nome: nomeUsuario,

                    mensagem: texto,

                    chat_id: chatAtual

                })

            }
        );


        const dados = await resposta.json();


        pensando.remove();


        if (dados.resposta) {

            adicionar(
                "🤖 " + dados.resposta,
                "bot"
            );

        } else {

            adicionar(
                "🤖 Não recebi uma resposta válida.",
                "bot"
            );

        }


        if (dados.chat_id) {

            chatAtual = dados.chat_id;

        }


        await carregarChats();

    } catch (erro) {

        console.error("Erro no envio:", erro);

        pensando.remove();

        adicionar(
            "🤖 Erro de conexão com o servidor.",
            "bot"
        );

    }

}


// ============================================================
// RENOMEAR
// ============================================================

async function renomearChat(chatId, tituloAtual) {

    const novoTitulo = prompt(
        "Novo nome da conversa:",
        tituloAtual || ""
    );


    if (!novoTitulo) return;


    const titulo = novoTitulo.trim();

    if (!titulo) return;


    try {

        const resposta = await fetch(
            "/api/chat/renomear",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    chat_id: chatId,

                    titulo: titulo

                })

            }
        );


        const dados = await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível renomear."
            );

            return;

        }


        await carregarChats();

    } catch (erro) {

        console.error(erro);
        alert("Erro ao renomear conversa.");

    }

}


// ============================================================
// FIXAR / DESAFIXAR
// ============================================================

async function alternarFixado(chatId) {

    try {

        const resposta = await fetch(
            "/api/chat/fixar",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    chat_id: chatId

                })

            }
        );


        const dados = await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível alterar o chat."
            );

            return;

        }


        await carregarChats();

    } catch (erro) {

        console.error(erro);
        alert("Erro ao fixar conversa.");

    }

}


// ============================================================
// EXCLUIR
// ============================================================

async function excluirChat(chatId) {

    const confirmar = confirm(
        "Excluir esta conversa?\n\n" +
        "Todas as mensagens desta conversa serão apagadas."
    );


    if (!confirmar) return;


    try {

        const resposta = await fetch(
            "/api/chat/excluir",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    chat_id: chatId

                })

            }
        );


        const dados = await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível excluir."
            );

            return;

        }


        if (chatAtual === chatId) {

            chatAtual = null;

            limparChat();

            adicionar(
                "🤖 Conversa excluída. Crie uma nova conversa para continuar.",
                "bot"
            );

        }


        await carregarChats();

    } catch (erro) {

        console.error(erro);
        alert("Erro ao excluir conversa.");

    }

}


// ============================================================
// MENU LATERAL
// ============================================================

function abrirMenu() {

    const menu = document.getElementById("menu");

    menu.classList.toggle("ativo");

}


function fecharMenu() {

    const menu = document.getElementById("menu");

    menu.classList.remove("ativo");

}


// ============================================================
// ENTER
// ============================================================

pergunta.addEventListener(
    "keydown",
    function (e) {

        if (e.key === "Enter" && !e.shiftKey) {

            e.preventDefault();

            enviar();

        }

    }
);
