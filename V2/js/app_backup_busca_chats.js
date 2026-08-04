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

    if (!listaChats) return;

    const usuario = obterUsuario();

    if (!usuario || !usuario.id) return;

    try {

        const resposta = await fetch("/api/chats", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario.id
            })
        });

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

            return 0;
        });

        chats.forEach(function(chat) {

            const item = document.createElement("div");

            item.className = "chat-item";

            if (chat.id === chatAtual) {
                item.classList.add("chat-item-ativo");
            }

            const conteudo = document.createElement("div");

            conteudo.className = "chat-item-conteudo";

            const nome = document.createElement("span");

            nome.className = "chat-item-nome";

            nome.innerText =
                (chat.fixado ? "📌 " : "") +
                (chat.titulo || "Novo chat");

            conteudo.appendChild(nome);

            const menu = document.createElement("button");

            menu.className = "chat-menu-btn";
            menu.type = "button";
            menu.innerText = "⋮";

            menu.addEventListener("click", function(event) {

                event.stopPropagation();

                abrirMenuChat(chat, menu);

            });

            item.appendChild(conteudo);
            item.appendChild(menu);

            item.addEventListener("click", function() {

                abrirChat(chat.id);

            });

            listaChats.appendChild(item);

        });

    } catch (erro) {

        console.error("Erro ao carregar chats:", erro);

    }
}


// ============================================================
// MENU DO CHAT
// ============================================================

function abrirMenuChat(chat, botao) {

    const antigo =
        document.querySelector(".chat-menu-popup");

    if (antigo) {
        antigo.remove();
    }

    const popup =
        document.createElement("div");

    popup.className =
        "chat-menu-popup";

    const renomear =
        document.createElement("button");

    renomear.innerText =
        "✏️ Renomear";

    renomear.onclick =
        function(event) {

            event.stopPropagation();

            popup.remove();

            renomearChat(chat);

        };


    const fixar =
        document.createElement("button");

    fixar.innerText =
        chat.fixado
            ? "📌 Desafixar"
            : "📌 Fixar";

    fixar.onclick =
        function(event) {

            event.stopPropagation();

            popup.remove();

            alternarFixarChat(chat);

        };


    const excluir =
        document.createElement("button");

    excluir.innerText =
        "🗑️ Excluir";

    excluir.className =
        "chat-menu-excluir";

    excluir.onclick =
        function(event) {

            event.stopPropagation();

            popup.remove();

            excluirChat(chat);

        };


    popup.appendChild(renomear);
    popup.appendChild(fixar);
    popup.appendChild(excluir);

    document.body.appendChild(popup);

    const rect =
        botao.getBoundingClientRect();

    popup.style.top =
        (rect.bottom + 5) + "px";

    popup.style.left =
        Math.max(
            8,
            rect.right - 170
        ) + "px";


    setTimeout(function() {

        document.addEventListener(
            "click",
            function fechar(event) {

                if (!popup.contains(event.target)) {

                    popup.remove();

                    document.removeEventListener(
                        "click",
                        fechar
                    );

                }

            }
        );

    }, 0);
}


// ============================================================
// RENOMEAR CHAT
// ============================================================

async function renomearChat(chat) {

    const novoNome =
        window.prompt(
            "Novo nome do chat:",
            chat.titulo || "Novo chat"
        );

    if (!novoNome || !novoNome.trim()) {
        return;
    }

    try {

        const resposta =
            await fetch(
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
                            novoNome.trim()

                    })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok || !dados.sucesso) {

            alert(
                dados.erro ||
                "Não foi possível renomear o chat."
            );

            return;
        }

        await carregarChats();

    } catch (erro) {

        console.error(
            "Erro ao renomear chat:",
            erro
        );

        alert(
            "Erro ao comunicar com o servidor."
        );

    }
}


// ============================================================
// FIXAR CHAT
// ============================================================

async function alternarFixarChat(chat) {

    try {

        const resposta =
            await fetch(
                "/api/chat/fixar",
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
                "Não foi possível alterar o chat."
            );

            return;
        }

        await carregarChats();

    } catch (erro) {

        console.error(
            "Erro ao fixar chat:",
            erro
        );

        alert(
            "Erro ao comunicar com o servidor."
        );

    }
}


// ============================================================
// EXCLUIR CHAT
// ============================================================

async function excluirChat(chat) {

    const confirmar =
        window.confirm(
            'Excluir o chat "' +
            (chat.titulo || "Novo chat") +
            '"?'
        );

    if (!confirmar) {
        return;
    }

    try {

        const resposta =
            await fetch(
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
                "Não foi possível excluir o chat."
            );

            return;
        }

        if (chatAtual === chat.id) {

            chatAtual = null;

            mensagemInicial();

        }

        await carregarChats();

    } catch (erro) {

        console.error(
            "Erro ao excluir chat:",
            erro
        );

        alert(
            "Erro ao comunicar com o servidor."
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
            "/V2/pages/chat.html";

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
                "/V2/pages/chat.html";

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
                    "/V2/pages/chat.html";


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
