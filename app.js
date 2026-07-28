let chatAtual = "Geral";

const chat = document.getElementById("chat");
const pergunta = document.getElementById("pergunta");
const listaChats = document.getElementById("listaChats");


function adicionar(texto, tipo){

    const div = document.createElement("div");

    div.className = "msg " + tipo;

    div.innerText = texto;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


function limparChat(){

    chat.innerHTML = "";

}


// carregar lista de chats

async function carregarChats(){

    const resposta = await fetch("/listar_chats");

    const chats = await resposta.json();


    listaChats.innerHTML = "";


    chats.forEach(nome => {


        const botao = document.createElement("button");

        botao.innerText = nome;


        botao.onclick = () => {

            abrirChat(nome);

        };


        listaChats.appendChild(botao);


    });

}


// criar novo chat

async function novoChat(){

    const nome = prompt("Nome do chat:");

    if(!nome) return;


    await fetch("/novo_chat",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            nome:nome

        })

    });


    chatAtual = nome;


    limparChat();


    carregarChats();


    fecharMenu();

    adicionar("🤖 Novo chat criado: " + nome,"bot");

}



// abrir histórico

async function abrirChat(nome){

    chatAtual = nome;

    limparChat();


    fecharMenu();

    const resposta = await fetch("/historico",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            chat:nome

        })

    });


    const historico = await resposta.json();



    historico.forEach(item=>{


        adicionar(
            "👤 " + item.usuario,
            "user"
        );


        adicionar(
            "🤖 " + item.rocha,
            "bot"
        );


    });


}



// enviar mensagem

async function enviar(){


    const texto = pergunta.value.trim();


    if(texto==="") return;



    adicionar(
        "👤 " + texto,
        "user"
    );


const pensando = document.createElement("div");

pensando.className = "msg bot pensando";

pensando.innerHTML = `
🤖 ROCHA AI 
<span class="pontos">
<span>.</span>
<span>.</span>
<span>.</span>
</span>
`;

chat.appendChild(pensando);

chat.scrollTop = chat.scrollHeight;

    pergunta.value="";



    const resposta = await fetch("/chat",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },


        body:JSON.stringify({

            mensagem:texto,

            chat:chatAtual

        })


    });


pensando.remove();

    const dados = await resposta.json();



    adicionar(
        "🤖 " + dados.resposta,
        "bot"
    );

}



// Enter envia

pergunta.addEventListener("keydown", function(e){

    if(e.key==="Enter"){

        enviar();

    }

});


// iniciar

carregarChats();

function abrirMenu(){

    const menu = document.getElementById("menu");

    menu.classList.toggle("ativo");

}

function fecharMenu(){

    const menu = document.getElementById("menu");

    menu.classList.remove("ativo");

}
