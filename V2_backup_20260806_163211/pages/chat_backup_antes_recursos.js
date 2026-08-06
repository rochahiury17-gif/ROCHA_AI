<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>ROCHA AI Chat</title>

<link rel="stylesheet" href="../css/style.css">

</head>

<body>

<!-- =========================================================
     OVERLAY MOBILE
========================================================= -->

<div
    id="sidebar-overlay"
    class="sidebar-overlay">
</div>


<!-- =========================================================
     SIDEBAR
========================================================= -->

<aside
    id="sidebar"
    class="sidebar">

    <div class="sidebar-header">

        <div class="sidebar-brand">

            <img
                src="../assets/logo_v2.png"
                alt="ROCHA AI">

            <div>

                <strong>ROCHA AI</strong>

                <span>Seu histórico</span>

            </div>

        </div>

        <button
            id="fechar-sidebar"
            class="sidebar-close"
            type="button">
            ×
        </button>

    </div>


    <!-- NOVO CHAT -->

    <button
        id="novo-chat"
        class="sidebar-new-chat"
        type="button">

        <span>＋</span>

        <span>Novo chat</span>

    </button>


    <!-- BUSCA -->

    <div class="sidebar-search">

        <span>⌕</span>

        <input
            id="buscar-chat"
            type="text"
            placeholder="Buscar conversa..."
            autocomplete="off">

    </div>


    <!-- HISTÓRICO -->

    <div
        id="lista-chats"
        class="lista-chats">

        <div class="lista-chats-titulo">
            Conversas
        </div>

    </div>


    <div class="sidebar-footer">

        <span>ROCHA AI V2</span>

    </div>

</aside>


<!-- =========================================================
     CHAT
========================================================= -->

<main class="chat-container">


    <!-- CABEÇALHO -->

    <header class="chat-header">

        <button
            id="abrir-sidebar-header"
            class="header-menu"
            type="button">
            ☰
        </button>


        <img
            src="../assets/logo_v2.png"
            alt="ROCHA AI">


        <div class="chat-header-info">

            <h1>ROCHA AI</h1>

            <span>● Online</span>

        </div>


        <button
            id="novo-chat-top"
            class="novo-chat"
            type="button">

            ＋

        </button>

    </header>


    <!-- CONVERSA -->

    <div
        class="chat-box"
        id="chat-box">

        <div class="bot-message">

            🤖 Olá! Eu sou a ROCHA AI.
            <br>
            Como posso ajudar?

        </div>

    </div>


    <!-- CAMPO -->

    <div class="chat-input">

        <button
            id="gerar-imagem"
            type="button"
            title="Gerar imagem">

            🖼️

        </button>


        <input
            id="mensagem"
            type="text"
            placeholder="Digite sua mensagem..."
            autocomplete="off">


        <button
            id="enviar-mensagem"
            type="button">

            ➤

        </button>

    </div>

</main>


<script src="../js/app.js"></script>


<script>

/* =========================================================
   SIDEBAR
========================================================= */

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("sidebar-overlay");

const abrir =
    document.getElementById("abrir-sidebar");

const abrirHeader =
    document.getElementById("abrir-sidebar-header");

const fechar =
    document.getElementById("fechar-sidebar");


function abrirSidebar() {

    sidebar.classList.add("sidebar-aberta");

    overlay.classList.add("overlay-visivel");

}


function fecharSidebar() {

    sidebar.classList.remove("sidebar-aberta");

    overlay.classList.remove("overlay-visivel");

}


if (abrir) {

    abrir.addEventListener(
        "click",
        abrirSidebar
    );

}


if (abrirHeader) {

    abrirHeader.addEventListener(
        "click",
        abrirSidebar
    );

}


if (fechar) {

    fechar.addEventListener(
        "click",
        fecharSidebar
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        fecharSidebar
    );

}


/* =========================================================
   NOVO CHAT DO TOPO
========================================================= */

const novoChatTop =
    document.getElementById("novo-chat-top");


if (novoChatTop) {

    novoChatTop.addEventListener(
        "click",
        function() {

            const botao =
                document.getElementById("novo-chat");

            if (botao) {

                botao.click();

            }

        }
    );

}


/* =========================================================
   BUSCA DE CONVERSAS
========================================================= */

const busca =
    document.getElementById("buscar-chat");


if (busca) {

    busca.addEventListener(
        "input",
        function() {

            const termo =
                this.value
                    .toLowerCase()
                    .trim();

            document
                .querySelectorAll(
                    "#lista-chats .chat-item"
                )
                .forEach(function(item) {

                    const texto =
                        item.innerText
                            .toLowerCase();

                    item.style.display =
                        !termo ||
                        texto.includes(termo)
                            ? ""
                            : "none";

                });

        }
    );

}


/* =========================================================
   FECHAR SIDEBAR AO ABRIR CHAT NO CELULAR
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.closest(".chat-item")
        ) {

            if (
                window.innerWidth <= 700
            ) {

                fecharSidebar();

            }

        }

    }
);

</script>

</body>

</html>
