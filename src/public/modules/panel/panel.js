const socket = io()

socket.on("servidor:enviarPendientes", (pendientes) => {
    document.querySelector("#pendientes").innerHTML=pendientes;
});

//Cuando se inicializa el programa o se actualiza la ventana, busco el ultimo número atendido en el día
socket.emit("cliente:UltimoTurno");
socket.on("servidor:UltimoTurno", (ultimo_turno)=> {
  document.querySelector("#turno_actual").innerHTML = ultimo_turno;
});

//Recibo el turno a llamado para mostrar en el panel
socket.on("servidor:llamarTurno", (turno) => {
    if(turno != null){
      document.querySelector("#turno_actual").innerHTML=turno;
      document.querySelector("#turno_actual").style.color = "black";
      let mensaje = new SpeechSynthesisUtterance();
      let voz = window.speechSynthesis.getVoices();
      mensaje.voice = voz[2];
      mensaje.voiceURI = "Microsoft Pablo - Spanish (Spain)";
      mensaje.lang = "es-Es";
      mensaje.text = `Turno, ${turno}`;
      speechSynthesis.speak(mensaje);
    }
        /*Swal.fire({
            html: `
            <div class="container">
                <h2 class="alert alert-warning" role="alert">No hay Turnos para llamar</h2>
            </div>`,
            showClass: {
              popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            },
            timer: 3000
          });*/
});

//Recibo el turno repedido para mostrar en el panel
socket.on("servidor:RepetirTurno", turnoRepetido => {
  console.log(turnoRepetido);
    if(turnoRepetido!=null){
      document.querySelector("#turno_actual").innerHTML = turnoRepetido;
      document.querySelector("#turno_actual").style.color = "red";
      let mensaje = new SpeechSynthesisUtterance();
      let voz = window.speechSynthesis.getVoices();
      mensaje.voice = voz[2];
      mensaje.voiceURI = "Microsoft Pablo - Spanish (Spain)";
      mensaje.lang = "es-Es";
      mensaje.text = `Turno, ${turnoRepetido}`;
      speechSynthesis.speak(mensaje);
    }
})
