// =====================================
// ROCHA AI V2 - APP.JS
// =====================================


// =====================================
// CHAT
// =====================================

const input = document.getElementById("mensagem");
const button = document.querySelector(".chat-input button");
const chatBox = document.getElementById("chat-box");


function adicionarMensagem(texto, classe) {

    if (!chatBox) return;

    const div = document.createElement("div");

    div.className = classe;
    div.innerText = texto;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}


async function enviarMensagem() {

    if (!input) return;

    const mensagem = input.value.trim();

    if (!mensagem) return;


    adicionarMensagem(
        "👤 " + mensagem,
        "user-message"
    );


    input.value = "";


    adicionarMensagem(
        "🤖 Digitando...",
        "bot-message"
    );


    try {

        const usuarioSalvo =
            localStorage.getItem("usuario");

        const usuario =
            usuarioSalvo
                ? JSON.parse(usuarioSalvo)
                : null;


        const resposta = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    mensagem: mensagem,

usuario: usuario
    ? usuario.id
    : "usuario"

                })
            }
        );


        const dados =
            await resposta.json();


        const mensagemBot =
            document.querySelector(
                ".bot-message:last-child"
            );


        if (mensagemBot) {

            mensagemBot.innerText =
                "🤖 " +
                (dados.resposta ||
                 "Não consegui responder.");

        }


    } catch (erro) {

        const mensagemBot =
            document.querySelector(
                ".bot-message:last-child"
            );


        if (mensagemBot) {

            mensagemBot.innerText =
                "🤖 Erro ao conectar com a IA.";

        }

        console.error(erro);

    }

}


if (button) {

    button.addEventListener(
        "click",
        enviarMensagem
    );

}


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


// =====================================
// REGISTRO
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botaoRegistro =
            document.querySelector("#criar-conta");


        if (botaoRegistro) {

            botaoRegistro.addEventListener(
                "click",
                async function() {

                    const nome =
                        document.querySelector("#nome")?.value.trim();

                    const email =
                        document.querySelector("#email")?.value.trim();

                    const senha =
                        document.querySelector("#senha")?.value;


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

                        console.error(erro);

                        alert(
                            "Erro ao conectar com o servidor."
                        );

                    }

                }
            );

        }

    }
);


// =====================================
// LOGIN
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const botaoLogin =
            document.querySelector("#entrar");


        if (!botaoLogin) return;


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

                    console.error(erro);

                    alert(
                        "Erro ao conectar com o servidor."
                    );

                }

            }
        );

    }
);


// =====================================
// USUÁRIO LOGADO
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const elemento =
            document.querySelector(
                "#usuario-nome"
            );


        if (!elemento) return;


        const usuarioSalvo =
            localStorage.getItem("usuario");


        if (!usuarioSalvo) return;


        try {

            const usuario =
                JSON.parse(usuarioSalvo);


            if (usuario.nome) {

                elemento.innerText =
                    "Olá, " +
                    usuario.nome +
                    " 👋";

            }

        } catch (erro) {

            console.error(
                "Erro ao carregar usuário:",
                erro
            );

        }

    }
);

