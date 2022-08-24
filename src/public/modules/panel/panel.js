const socket = io()

socket.on("servidor:enviarPendientes", (pendientes) => {
    console.log("ACA "+pendientes);
    document.querySelector("#pendientes").innerHTML=pendientes;
});

//Recibo el turno a llamado para mostrar en el panel
socket.on("servidor:llamarTurno", (turno) => {
    if(turno === null){
        Swal.fire({
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
          })
    }else{
        document.querySelector("#turno_actual").innerHTML=turno;
    }
});

//Recibo el turno repedido para mostrar en el panel
socket.on("servidor:RepetirTurno", turnoRepetido => {
  console.log(turnoRepetido);
    if(turnoRepetido!=null){
      document.querySelector("#turno_actual").innerHTML = turnoRepetido;
      document.querySelector("#turno_actual").style.color = "red";
    }
})
