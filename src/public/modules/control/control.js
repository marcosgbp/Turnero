const socket = io();
window.addEventListener('load', function(){
  socket.emit("cliente:UltimoTurno");
});
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
//Cada vez que se actualiza el navegador retorno el último numéro atendido
socket.on("servidor:UltimoTurno", (datos_turno) => {
  document.querySelector(".turno_actual").innerHTML=datos_turno.ultimo_turno;
});
//Turno Actual, cada vez que llamo un turno, actualizo en mi vista del control el turno que llamo
socket.on("servidor:llamarTurnoControl", (datos_cli)=>{
  document.querySelector(".turno_actual").innerHTML=datos_cli.turno;
});
//Pendientes
socket.on("servidor:enviarPendientes",(pendientes)=>{
  document.querySelector(".pendientes").innerHTML=pendientes;
})