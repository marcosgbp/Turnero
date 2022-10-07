const socket = io();
//let btn_pulsador = document.querySelector("#btn-pulsador");
let btn_numbers = document.querySelectorAll(".btn-number");
let btn_borrar = document.querySelector("#btn-borrar");
let btn_enviar = document.querySelector("#btn-enviar");

//Escucho el evento click para preguntar el ultimo numero a mi servidor
btn_enviar.addEventListener("click", () => {
  let input_ci = document.querySelector("#ci").value;
  if (input_ci.length >= 5) {
    socket.emit("cliente:buscarUltTurno", input_ci);
  } else {
    if(input_ci ==="000"){
      input_ci = "X";
      socket.emit("cliente:buscarUltTurno", input_ci);
    }
    else {
      Swal.fire({
      title: "¡Atención!",
      text: "¡Ingrese un número de documento valido!",
      icon: "warning",
      timer: 3000,
    });
  }
  }
});

//Recibo el turno que corresponde
socket.on("servidor:enviarTurno", (datos_cli) => {
  document.querySelector("#ci").value =""
  Swal.fire({
    html: `
    <div class="container">
        <div class="border border-dark p-2 mb-2">
          <div class="row">
            <img src="./assets/img/logo.png" class="img-fluid" alt="Marijoa">
          </div>
          <div class="alert alert-primary mt-2" role="alert">
            <div class="row">
              <div class="col-12">
                <h1 class="display-2">Bienvenido/a</h1>
              </div>
              <div class="col-12">
                <h3 class="display-6">${datos_cli.nombre}</h3>
              </div>
              <div class="col-12">
                <h3 class="display-4"><bold>Tu turno es ${datos_cli.turno}</bold></h3>
                <h5>No olvides de retirar tu ticket</h5>
                <img src="./assets/img/ticket.png" class="img-fluid" alt="Ticket">
              </div>

          </div>
        </div>
    </div>`,
    width: 1000,
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
    timer: 6000,
  });
});

//Capturo los valores de botones númericos
btn_numbers.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelector("#ci").value += e.target.id;
  });
});

//Borro los datos del visor
btn_borrar.addEventListener("click", () => {
  let input_ci = document.querySelector("#ci").value;
  let new_input_ci = input_ci.substring(0, input_ci.length - 1);
  document.querySelector("#ci").value = new_input_ci;
});

socket.on("servidor:LlamarVozTurno", (turno) => {
  playAudio(turno);
});
//Recibe el número y ejecuta el audio dependiendo el turno recibido
function playAudio(turno) {
  try {
    const audioTurno = new Audio("./assets/audios/turno.wav");
    const audioNumero = new Audio("./assets/audios/" + turno + ".wav");
    setTimeout(function () {
      audioTurno.play();
    }, 1000);
    setTimeout(function () {
      audioNumero.play(turno);
    }, 2000);
  } catch (error) {
    console.log(error);
  }
}
