
/*
    Reproducción de audio de turno
*/
export const playAudio = (turno) => {
    try {
        const audioTurno = new Audio("./assets/audios/turno.wav");
        const audioNumero = new Audio("./assets/audios/" + turno + ".wav");
        setTimeout(function(){audioTurno.play()}, 1000);
        setTimeout(function(){audioNumero.play()}, 2000);
      } catch (error) {
        console.log(error);
      }
}