const socket = io();
//let btn_pulsador = document.querySelector("#btn-pulsador");
let btn_numbers = document.querySelectorAll(".btn-number");
let btn_borrar = document.querySelector("#btn-borrar");
let btn_enviar = document.querySelector("#btn-enviar");

//Escucho el evento click para preguntar el ultimo numero a mi servidor
btn_enviar.addEventListener("click", ()=>{
    let input_ci = document.querySelector("#ci").value;
    if(input_ci.length>=5){
      socket.emit("cliente:buscarUltTurno", input_ci);
    }else{
      Swal.fire(
        '¡Atención!',
        'La longitud del número de documento ingresado es muy corto',
        'warning'
      )
    }
    
});

//Recibo el turno que corresponde
socket.on("servidor:enviarTurno", (datos_cli) => {
  console.table(datos_cli)
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
                <h2 class="display-4">${datos_cli.nombre}</h2>
              </div>
              <div class="col-12">
                <h2 class="display-5"><b>Tu turno es ${datos_cli.turno}</b></h2>
              </div>
          </div>
        </div>
    </div>`,
    width: 1000,
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    timer: 3000
  });
});


//Capturo los valores de botones númericos
btn_numbers.forEach(btn =>{
  btn.addEventListener('click', (e)=>{
    document.querySelector("#ci").value += e.target.id;
  });
});

//Borro los datos del visor
btn_borrar.addEventListener("click",()=>{
  let input_ci = document.querySelector("#ci").value;
  let new_input_ci = input_ci.substring(0,input_ci.length - 1);
  document.querySelector("#ci").value = new_input_ci;
});

