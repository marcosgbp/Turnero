const socket = io();
let btn_llamar = document.querySelector("#btn-llamar");
let btn_repetir = document.querySelector("#btn-repetir");
let btn_anterior = document.querySelector("#btn-anterior");

//Llama al turno correspondiente
btn_llamar.addEventListener("click", ()=>{
    console.log("Llamar")
    socket.emit("cliente:LlamarTurno");
});

//Repetir turno
btn_repetir.addEventListener("click", ()=>{
    socket.emit("cliente:RepetirTurno");
})