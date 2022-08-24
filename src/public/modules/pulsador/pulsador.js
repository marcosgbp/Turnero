const socket = io();
let btn_pulsador = document.querySelector("#btn-pulsador");

//Escucho el evento click para preguntar el ultimo numero a mi servidor
btn_pulsador.addEventListener("click", ()=>{
    socket.emit("cliente:buscarUltTurno");
});
//Recibo el turno que corresponde
socket.on("servidor:enviarTurno", (turno) => {
    Swal.fire({
        title: 'Bienvenido a Marijoa',
        html: `
        <div class="container">
            <h2 class="alert alert-primary" role="alert">Tu turno es: ${turno}</h2>
        </div>`,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        timer: 3000
      })
})