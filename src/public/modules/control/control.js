const socket = io();
let btn_llamar = document.querySelector("#btn-llamar");
let btn_repetir = document.querySelector("#btn-repetir");
let btn_anterior = document.querySelector("#btn-anterior");

//Llama al turno correspondiente
btn_llamar.addEventListener("click", ()=>{
    socket.emit("cliente:LlamarTurno");
});

//Repetir turno
btn_repetir.addEventListener("click", ()=>{
    socket.emit("cliente:RepetirTurno");
});
socket.on("servidor:NoTurnoPendiente", ()=>{
    Swal.fire({
        title: 'No hay Turnos para llamar',
        icon: 'warning',
        timer: 2000,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      })
})