document.addEventListener("DOMContentLoaded",()=>{

const b=document.getElementById("botao-conversa-voz");

console.log("TESTE BOTAO:",b);

if(b){

b.style.border="3px solid red";

b.onclick=()=>{

alert("BOTÃO DA ROCHA AI FUNCIONOU");

console.log("CLIQUE OK");

};

}

});
