```javascript
// ============================================================
// ROCHA AI V2 - APP.JS
// ============================================================


// ============================================================
// FUNÇÕES GERAIS
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


function obterUsuarioId() {

    const usuario = obterUsuario();

    if (!usuario) {
        return "usuario";
    }

    return usuario.id || "usuario";
}


// ============================================================
// CHAT
// ============================================================

const input = document.getElementById("mensagem");
const button = document.getElementById("enviar-mensagem");
const chatBox = document.getElementById("chat-box");
const listaChats = document.getElementById("lista-chats");
const novoChatButton = document.getElementById("novo-chat");

let chatAtual = null;


// ============================================================
// ADICIONAR MENSAGEM NA TELA
// ============================================================

function adicionarMensagem(texto, classe) {

    if (!chatBox) return;

    const div = document.createElement("div");

    div.className = classe;
    div.innerText = texto;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}


// ============================================================
// LIMPAR CONVERSA
// ============================================================

function limparChat() {

    if (!chatBox) return;

    chatBox.innerHTML = "";

}


// ============================================================
// MENSAGEM INICIAL
// ============================================================

function mensagemInicial() {

    if (!chatBox) return;

    limparChat();

    adicionarMensagem(
        "🤖 Olá! Eu sou a ROCHA AI.\nComo posso ajudar?",
        "bot-message"
    );
}


// ============================================================
// CARREGAR LISTA DE CHATS
// ============================================================

async function carregarChats() {

    if (!listaChats) return;

    const usuario = obterUsuarioId();

    if (usuario === "usuario") {
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
                    usuario: usuario
                })
            }
        );


        if (!resposta.ok) {
            throw new Error(
                "Erro ao carregar chats."
            );
        }


        const chats = await resposta.json();


        renderizarListaChats(chats);


    } catch (erro) {

        console.error(
            "Erro ao carregar chats:",
            erro
        );

    }

}


// ============================================================
// RENDERIZAR LISTA
// ============================================================

function renderizarListaChats(chats) {

    if (!listaChats) return;

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

        const item = document.createElement("button");

        item.className = "chat-item";

        item.type = "button";

        item.innerText =
            chat.titulo || "Novo chat";


        if (chat.id === chatAtual) {

            item.classList.add("chat-selecionado");

        }


        item.addEventListener(
            "click",
            function() {

                abrirChat(chat.id);

            }
        );


        listaChats.appendChild(item);

    });

}


// ============================================================
// NOVO CHAT
// ============================================================

async function criarNovoChat() {

    const usuario = obterUsuarioId();

    if (usuario === "usuario") {

        alert(
            "Faça login para criar um chat."
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
                    usuario: usuario
                })
            }
        );


        const dados = await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível criar o chat."
            );

            return;

        }


        chatAtual = dados.chat.id;


        mensagemInicial();


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
// ABRIR CHAT
// ============================================================

async function abrirChat(chatId) {

    const usuario = obterUsuarioId();

    if (usuario === "usuario") {
        return;
    }


    chatAtual = chatId;


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


        if (!resposta.ok) {
            throw new Error(
                "Erro ao carregar histórico."
            );
        }


        const mensagens =
            await resposta.json();


        limparChat();


        if (
            !Array.isArray(mensagens) ||
            mensagens.length === 0
        ) {

            mensagemInicial();

        } else {

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


        await carregarChats();


    } catch (erro) {

        console.error(
            "Erro ao abrir chat:",
            erro
        );

        alert(
            "Não foi possível carregar esta conversa."
        );

    }

}


// ============================================================
// ENVIAR MENSAGEM
// ============================================================

async function enviarMensagem() {

    if (!input) return;


    const mensagem =
        input.value.trim();


    if (!mensagem) return;


    const usuario =
        obterUsuarioId();


    if (usuario === "usuario") {

        alert(
            "Faça login para conversar com a ROCHA AI."
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

                        mensagem: mensagem,

                        usuario: usuario,

                        chat_id: chatAtual

                    })
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " +
                resposta.status
            );

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
// EVENTOS DO CHAT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botaoEnviar =
            document.getElementById(
                "enviar-mensagem"
            );

        const botaoNovoChat =
            document.getElementById(
                "novo-chat"
            );

        const campoMensagem =
            document.getElementById(
                "mensagem"
            );


        // --------------------------------------------------------
        // BOTÃO ENVIAR
        // --------------------------------------------------------

        if (botaoEnviar) {

            botaoEnviar.addEventListener(
                "click",
                function() {

                    enviarMensagem();

                }
            );

        }


        // --------------------------------------------------------
        // ENTER
        // --------------------------------------------------------

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

        if (botaoNovoChat) {

            botaoNovoChat.addEventListener(
                "click",
                function() {

                    criarNovoChat();

                }
            );

        }


        console.log(
            "ROCHA AI: eventos do chat carregados."
        );

    }
);
```


// ============================================================
// ENTER PARA ENVIAR
// ============================================================

if (input) {

    input.addEventListener(
        "keypress",
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
// INICIALIZAÇÃO DO CHAT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        if (!chatBox) {
            return;
        }


        const usuario =
            obterUsuario();


        if (!usuario) {

            mensagemInicial();

            return;

        }


        await carregarChats();


        const usuarioId =
            usuario.id;


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
                            usuario: usuarioId
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
);


// ============================================================
// REGISTRO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botaoRegistro =
            document.querySelector(
                "#criar-conta"
            );


        if (!botaoRegistro) {
            return;
        }


        botaoRegistro.addEventListener(
            "click",
            async function() {

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


                const confirmar =
                    document.querySelector(
                        'input[placeholder="Confirmar senha"]'
                    )?.value;


                if (
                    !nome ||
                    !email ||
                    !senha
                ) {

                    alert(
                        "Preencha todos os campos."
                    );

                    return;

                }


                if (
                    confirmar &&
                    senha !== confirmar
                ) {

                    alert(
                        "As senhas não são iguais."
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

                                    nome: nome,

                                    email: email,

                                    senha: senha

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
                        "Erro no registro:",
                        erro
                    );


                    alert(
                        "Erro ao conectar com o servidor."
                    );

                }

            }
        );

    }
);


// ============================================================
// LOGIN
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botaoLogin =
            document.querySelector(
                "#entrar"
            );


        if (!botaoLogin) {
            return;
        }


        botaoLogin.addEventListener(
            "click",
            async function() {

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

                                    email: email,

                                    senha: senha

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
                        "Erro no login:",
                        erro
                    );


                    alert(
                        "Erro ao conectar com o servidor."
                    );

                }

            }
        );

    }
);


// ============================================================
// MOSTRAR USUÁRIO LOGADO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const elemento =
            document.querySelector(
                "#usuario-nome"
            );


        if (!elemento) {
            return;
        }


        const usuario =
            obterUsuario();


        if (!usuario) {
            return;
        }


        if (usuario.nome) {

            elemento.innerText =
                "Olá, " +
                usuario.nome +
                " 👋";

        }

    }
);
```
