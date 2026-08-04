let chatAtual = "Geral";

let usuario = localStorage.getItem("usuario");
let nomeUsuario = localStorage.getItem("nomeUsuario");


const chat = document.getElementById("chat");
const pergunta = document.getElementById("pergunta");
const listaChats = document.getElementById("listaChats");


// verificar login

window.onload = function(){

    if(usuario){

        document.getElementById("loginScreen").style.display="none";

        document.getElementById("registroScreen").style.display="none";

        document.getElementById("chatScreen").style.display="flex";

        carregarChats();

    }

};



// LOGIN

async function fazerLogin(){

    let email = document.getElementById("loginEmail").value;

    let senha = document.getElementById("loginSenha").value;


    let resposta = await fetch("/login",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            email:email,
            senha:senha

        })

    });


    let dados = await resposta.json();


    if(dados.status==="ok"){


        usuario = dados.usuario.id;

        nomeUsuario = dados.usuario.nome;


        localStorage.setItem(
            "usuario",
            usuario
        );


        localStorage.setItem(
            "nomeUsuario",
            nomeUsuario
        );


        document.getElementById("loginScreen").style.display="none";

        document.getElementById("chatScreen").style.display="flex";


        carregarChats();


    }else{

        alert(dados.mensagem);

    }

}



// REGISTRO

function mostrarRegistro(){

    document.getElementById("loginScreen").style.display="none";

    document.getElementById("registroScreen").style.display="block";

}



function voltarLogin(){

    document.getElementById("registroScreen").style.display="none";

    document.getElementById("loginScreen").style.display="block";

}



async function registrarUsuario(){


    let nome = document.getElementById("registroNome").value;

    let email = document.getElementById("registroEmail").value;

    let senha = document.getElementById("registroSenha").value;



    let resposta = await fetch("/registro",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            nome:nome,
            email:email,
            senha:senha

        })

    });



    let dados = await resposta.json();



    if(dados.status==="ok"){

        alert("Conta criada com sucesso!");

        voltarLogin();


    }else{

        alert(dados.mensagem);

    }


}




function adicionar(texto,tipo){


    const div=document.createElement("div");

    div.className="msg "+tipo;

    div.innerText=texto;


    chat.appendChild(div);


    chat.scrollTop=chat.scrollHeight;

}



function limparChat(){

    chat.innerHTML="";

}



// carregar chats

async function carregarChats(){


const resposta = await fetch("/listar_chats",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

usuario:usuario

})

});


const chats = await resposta.json();


listaChats.innerHTML="";


chats.forEach(nome=>{


const botao=document.createElement("button");


botao.innerText=nome;


botao.onclick=()=>{

abrirChat(nome);

};


listaChats.appendChild(botao);


});


}



// novo chat

async function novoChat(){


const nome=prompt("Nome do chat:");

if(!nome)return;



await fetch("/novo_chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

usuario:usuario,

nome:nome

})


});



chatAtual=nome;


limparChat();


carregarChats();


fecharMenu();


adicionar(
"🤖 Novo chat criado: "+nome,
"bot"
);


}



// abrir histórico

async function abrirChat(nome){


chatAtual=nome;


limparChat();


fecharMenu();



const resposta=await fetch("/historico",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

usuario:usuario,

chat:nome

})

});



const historico=await resposta.json();



historico.forEach(item=>{


adicionar(
"👤 "+item.usuario,
"user"
);


adicionar(
"🤖 "+item.rocha,
"bot"
);


});


}




// enviar mensagem

async function enviar(){


const texto=pergunta.value.trim();


if(texto==="")return;



adicionar(
"👤 "+texto,
"user"
);



pergunta.value="";



const resposta=await fetch("/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

usuario:usuario,

nome:nomeUsuario,

mensagem:texto,

chat:chatAtual

})


});



const dados=await resposta.json();


adicionar(
"🤖 "+dados.resposta,
"bot"
);


}




pergunta.addEventListener("keydown",function(e){

if(e.key==="Enter"){

enviar();

}

});





function abrirMenu(){

const menu=document.getElementById("menu");

menu.classList.toggle("ativo");

}



function fecharMenu(){

const menu=document.getElementById("menu");

menu.classList.remove("ativo");

}
