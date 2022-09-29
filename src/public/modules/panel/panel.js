const API_MARIJOA_PRO = "http://sistema.marijoa/marijoa/utils/turnero/RestControllerTurno.php?action=";


const socket = io();
window.addEventListener('load', function(){
  setInterval(function(){getHora()},1000);
  //Cuando se inicializa el programa o se actualiza la ventana, busco el ultimo número atendido en el día
  socket.emit("cliente:UltimoTurno");
  setCotizacionesPanel();
});
socket.on("servidor:enviarPendientes", (pendientes) => {
  document.querySelector("#pendientes").innerHTML = pendientes;
});


socket.on("servidor:UltimoTurno", (ultimo_turno) => {
  document.querySelector("#turno_actual").innerHTML = ultimo_turno;
});

//Recibo el turno a llamado para mostrar en el panel
socket.on("servidor:llamarTurno", (turno) => {
  if (turno != null) {
    document.querySelector("#turno_actual").innerHTML = turno;
    document.querySelector("#turno_actual").style.color = "black";
    playAudio(turno);
    /*let mensaje = new SpeechSynthesisUtterance();
      let voz = window.speechSynthesis.getVoices();
      mensaje.voice = voz[2];
      mensaje.voiceURI = "Microsoft Pablo - Spanish (Spain)";
      mensaje.lang = "es-Es";
      mensaje.text = `Turno, ${turno}`;
      speechSynthesis.speak(mensaje);*/
  }
});

//Recibo el turno repedido para mostrar en el panel
socket.on("servidor:RepetirTurno", (turnoRepetido) => {
  console.log(turnoRepetido);
  if (turnoRepetido != null) {
    document.querySelector("#turno_actual").innerHTML = turnoRepetido;
    document.querySelector(".turno_actual").style.color = "red";
    playAudio(turnoRepetido);
    /*let mensaje = new SpeechSynthesisUtterance();
    let voz = window.speechSynthesis.getVoices();
    mensaje.voice = voz[2];
    mensaje.voiceURI = "Microsoft Pablo - Spanish (Spain)";
    mensaje.lang = "es-Es";
    mensaje.text = `Turno, ${turnoRepetido}`;
    speechSynthesis.speak(mensaje);*/
  }
});

//Recibe el número y ejecuta el audio dependiendo el turno recibido
function playAudio(turno) {
  try {
    const audioTurno = new Audio("./assets/audios/turno.wav");
    const audioNumero = new Audio("./assets/audios/" + turno + ".wav");
    setTimeout(function(){audioTurno.play()}, 1000);
    setTimeout(function(){audioNumero.play()}, 2000);
  } catch (error) {
    console.log(error);
  }
}

//Formateo y mustro la hora
function getHora() {
  let momentoActual = new Date(); 
  let hora = momentoActual.getHours() ;
  let minuto = momentoActual.getMinutes() ;
  let segundo = momentoActual.getSeconds() ;
 if (minuto < 10) {
   minuto = "0"+minuto;
 }
 if (segundo < 10) {
   segundo = "0"+segundo;
 }  
  horaImprimible = hora + " : " + minuto + " : " + segundo; 
  document.querySelector(".hora").innerHTML = horaImprimible;
}

//Muesto las cotizaciones en el panel
async function setCotizacionesPanel(){
  let cotizaciones = await getCotizaciones();
  for(let cotizacion of cotizaciones){
    let moneda = cotizacion.moneda.substring(1, cotizacion.moneda - 1);
    let precio_venta = milesSeparator(parseInt(cotizacion.venta), '.')
    document.querySelector(`#${moneda}`).innerHTML = precio_venta
  }

}
//Solicito cotizaciones a MarijoaPRO
async function getCotizaciones(){
  try {
      const response  = await fetch(`${API_MARIJOA_PRO}getCotizaciones`);
      const result = await response.json();
      return result
  } catch (error) {
    console.log("error "+error);
    return null;
  }
}

//Formatea el número para mostrar con separador de miles
function milesSeparator(val,sep) {
  var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})'),
  sValue=val+'';
  if (sep === undefined) {sep=',';}
  while(sRegExp.test(sValue)) {
      sValue = sValue.replace(sRegExp, '$1'+sep+'$2');
  }
  return sValue;
}