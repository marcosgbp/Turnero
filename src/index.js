import express from "express";
import { Server as WebSocketServer } from "socket.io";
import http from "http";
const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server);
const mysql = require("mysql");
const cors = require('cors');
const path = require('path');
const escpos = require('escpos');
// install escpos-usb adapter module manually
escpos.USB = require('escpos-usb');


/**
 * Establecemos la conexiòn a la base de datos
 */
var conexion = mysql.createConnection({
  host: "localhost",
  database: "turnero",
  user: "root",
  password: "",
});

conexion.connect(function (err) {
  if (err) {
    console.error("Error de conexion: " + err.stack);
    return;
  } else {
    console.log("Conectado con el identificador " + conexion.threadId);
  }
});

app.use(express.static(__dirname + "/public"));

//Valido los cors para el api
app.use(cors({
  origin: '*'
}));

app.get('/getTurno/:turno', cors(),function (req, res, next) {
  let turno = req.params.turno;
  let usuario = req.query.usuario;
  conexion.query(`SELECT * FROM turnos WHERE turno = ${turno} AND DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") ORDER BY id_turno DESC LIMIT 1`,(error, results, fields) =>{
    if(error){
      console.log("Error al solicitar turno");
    }else{
      if(results.length>0){
        results[0].msg="Ok";
        let id_turno = results[0].id_turno;
          conexion.query(`UPDATE turnos SET estado = "Atendido", fecha_hora_atendido = current_timestamp, usuario = '${usuario}' WHERE id_turno = ${id_turno}`,(error, results, fields) => {
            if (error) {
              console.log("Error al actualizar el estado");
            } else {
              console.log("Todo un exito en la actualización del estado");
            }
          }
        );
        res.json(results);
      }else{
        res.json({msg:"NO"});
      }
    }
  });
});
   

//Rutas
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/modules/pulsador/pulsador.html");
});
app.get("/panel", (req, res) => {
  res.sendFile(__dirname + "/public/modules/panel/panel.html");
});
app.get("/control", (req, res) => {
  res.sendFile(__dirname + "/public/modules/control/control.html");
});

io.on("connection", (socket) => {
  //Cada vez que se actualiza panel.html le devuelvo el ultimo número que atendí
  socket.on("cliente:UltimoTurno", () => {
    conexion.query(
      'SELECT id_turno, turno as ultimo_turno, repeticion FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Atendido" ORDER BY id_turno desc limit 1',
      (error, results, fields) => {
        if (error) throw error;
        let resultado =
          results.length >= 1 ? parseInt(results[0].ultimo_turno) : 0;
        let id_turno = results.length >= 1 ? parseInt(results[0].id_turno) : 0;
        let repeticion =
          results.length >= 1 ? parseInt(results[0].repeticion) : 0;
        let datos_turno = {
          id_turno: id_turno,
          ultimo_turno: resultado,
          repeticion: repeticion,
        };
        socket.emit("servidor:UltimoTurno", datos_turno);
      }
    );
    //Cuento cuanto pendientes hay por el estado y por la fecha
    conexion.query(
      'SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"',
      (error, results, fields) => {
        if (error) throw error;
        let pendientes = parseInt(results[0].pendientes);
        socket.emit("servidor:enviarPendientes", pendientes);
      }
    );
  });
  socket.on("cliente:buscarUltTurno", (input_ci) => {
    conexion.query(
      "SELECT id_turno, turno as ultimo_turno FROM turnos WHERE DATE_FORMAT(fecha_hora, '%Y-%m-%d') = DATE_FORMAT(NOW(), '%Y-%m-%d') order by id_turno desc limit 1",
      (error, results, fields) => {
        if (error) throw error;
        let ultTurno = results.length >= 1 ? results[0].ultimo_turno : 0;
        //Acá valido por si la base de datos no tiene valor va devolver null entonces el turno empieza de 1 y
        let turno = isNaN(ultTurno + 1) || ultTurno + 1 > 99 ? 1 : ultTurno + 1;
        conexion.query('SELECT cod_cli, ci_ruc, nombre, tipo_doc FROM clientes WHERE ci_ruc LIKE "%' +input_ci +'%"',
          (error, results, fields) => {
            if (error) {
              console.log("Error en la busqueda del cliente");
            } else {
              if (results.length == 0) {
                var cod_cli = "C000001";
                var ci_ruc = "X";
                var nombre = "SIN NOMBRE";
                var tipo_doc = "C.I.";
              } else {
                var cod_cli = results[0].cod_cli;
                var ci_ruc = results[0].ci_ruc;
                var nombre = results[0].nombre;
                var tipo_doc = results[0].tipo_doc;
              }
             
              //Inserto el turno
              conexion.query("INSERT INTO turnos (turno, cod_cli, nombre_cli, ci_ruc, tipo_doc) VALUES ("+turno +", '" +cod_cli +"', '" +nombre +"', '" +ci_ruc +"','"+tipo_doc+"')",(error, results, fields) => {
                  if (error) {
                    console.log("No se pudo insertar en la bd el turno " + error);
                  } else {
                    let hoy = new Date();
                    let datos_cli = {
                      turno: turno,
                      nombre: nombre,
                      ci_ruc: ci_ruc,
                      fecha: getFecha(),
                    };
                    socket.emit("servidor:enviarTurno", datos_cli);
                    Imprimir(datos_cli);
                  }
                }
              );
            }
            //Cuento cuanto pendientes hay por el estado y por la fecha
            conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"', (error, results, fields) => {
                if (error) {
                  console.log("No se pudo insertar en la bd el turno " + error);
                } else {
                  let pendientes = parseInt(results[0].pendientes);
                  socket.broadcast.emit("servidor:enviarPendientes",pendientes);
                }
              }
            );
          }
        );
      }
    );
  });
  //Llamo el turno menor del día con estado pendiente
  socket.on("cliente:LlamarTurno", () => {
    conexion.query('SELECT id_turno, MIN(turno) as turno, repeticion FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d" ) = DATE_FORMAT(NOW(), "%Y-%m-%d" ) AND estado = "Pendiente"', (error, results, fields) => {
        if (error) {
          console.log("No encontre ningun dato pendiente para llamar");
        } else {
          if (results[0].id_turno != null) {
            let id_turno = results[0].id_turno;
            let turno = results[0].turno;
            let repeticion = parseInt(results[0].repeticion) + 1;
            let datos_cli = {
              id_turno: id_turno,
              turno: turno,
              repeticion: repeticion,
            };
            socket.broadcast.emit("servidor:llamarTurno", datos_cli);
            socket.broadcast.emit("servidor:LlamarVozTurno", turno);
            conexion.query('UPDATE turnos SET estado = "Atendido", repeticion = ' +repeticion +", fecha_hora_llamada = current_timestamp WHERE id_turno =" +id_turno,(error, results, fields) => {
                if (error) {
                  console.log("Error al actualizar la repetición");
                } else {
                  console.log(
                    "Todo un exito en la actualización de la repetición"
                  );
                }
              }
            );

            //Cuento cuanto pendientes hay por el estado y por la fecha
            conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"',(error, results, fields) => {
                //console.log(results[0].pendientes)
                if (error) {
                  console.log("Error en la lectura de pendientes " + error);
                } else {
                  let pendientes = parseInt(results[0].pendientes);
                  socket.broadcast.emit("servidor:enviarPendientes",pendientes);
                }
              }
            );
          } else {
            socket.emit("servidor:NoTurnoPendiente");
          }
        }
      }
    );
  });
  //Repetir Turno
  socket.on("cliente:RepetirTurno", () => {
    conexion.query(
      `SELECT id_turno, turno, repeticion FROM turnos WHERE estado = 'Atendido' AND DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") ORDER BY id_turno DESC LIMIT 1`,
      (error, results, fields) => {
        if (error) {
          console.log("Error al querer repetir turno");
        } else {
          if (results.length > 0) {
            let repeticion = parseInt(results[0].repeticion) + 1;
            conexion.query(
              `UPDATE turnos SET repeticion = ${repeticion} WHERE id_turno = ${results[0].id_turno}`
            );
            //Reproducir audio
            socket.broadcast.emit("servidor:LlamarVozTurno", results[0].turno);
          }
        }
      }
    );
  });

  //Busco el cliente
  socket.on("cliente:BuscarCliente", (input_ci) => {
    conexion.query(
      'SELECT ci_ruc, nombre FROM clientes WHERE ci_ruc LIKE "%' +
        input_ci +
        '%"',
      (error, results, fields) => {
        if (error) {
          console.log("Error en la busqueda del cliente");
        } else {
          socket.emit("servidor:MostrarCliente", results);
        }
      }
    );
  });
});
function Imprimir(datos_cli){ 
    // Select the adapter based on your printer type
    const device  = new escpos.USB();
    // const device  = new escpos.Network('localhost');
    // const device  = new escpos.Serial('/dev/usb/lp0');
    let codigo_bar = datos_cli.turno.toString();
    let options = {
      width: 5,
      height: 150,
      includeParity: false,
      position: "OFF",
      font:"B"
    }
    //const options = { encoding: "GB18030" /* default */ }
    const tux = path.join(__dirname, '/public/assets/img/logo_ticket.png');
    const printer = new escpos.Printer(device, options);
    escpos.Image.load(tux, function(image){
    device.open(function(error){
      printer.align('CT')
      .image(image, 's8')

      .then(() => { 
         printer.font('A')
         printer.align('CT')
         printer.size(1, 2)
         printer.text("\n");
         printer.text("...Bienvenido...");
         printer.text("\n");
         printer.text(cortarNombre(datos_cli.nombre));
         printer.text(cortarApellido(datos_cli.nombre));
         printer.size(1, 1)
         printer.text("Ingreso al local");
         printer.text(datos_cli.fecha)
         printer.text("\n");
         printer.size(1, 2)
         printer.text("Su turno es:");
         printer.text("\n");
         printer.text(datos_cli.turno);
         printer.size(1, 1);
         printer.barcode(datos_cli.turno, 'CODE39', options)
         printer.text("\n\n\n");
         printer.cut().close();
      });
    });
  });
}
function cortarNombre(nombre){
  let nombre_aux = nombre.split(' ');
  if(nombre[0]===undefined || nombre[0]===null || nombre[0]===""){
    nombre[0]=" ";
  }
  if(nombre[1]===undefined || nombre[1]===null || nombre[1]===""){
    nombre[1]=" "
  }
  return nombre_aux[0]+" "+nombre_aux[1];
}
function cortarApellido(nombre){
  let nombre_aux = nombre.split(' ');
  if(nombre[2]===undefined || nombre[2]===null || nombre[2]===""){
    nombre[2]=" ";
  }
  if(nombre[3]===undefined || nombre[3]===null || nombre[3]===""){
    nombre[3]=" "
  }
  return nombre_aux[2]+" "+nombre_aux[3];
}
function getFecha() {
  let fechaImprimible = "";
  let momentoActual = new Date(); 
  let dia = momentoActual.getDate();
  let mes = (momentoActual.getMonth() + 1);
  let anho = momentoActual.getFullYear();
  let hora = momentoActual.getHours() ;
  let minuto = momentoActual.getMinutes() ;
  let segundo = momentoActual.getSeconds() ;
 if (minuto < 10) {
   minuto = "0"+minuto;
 }
 if (segundo < 10) {
   segundo = "0"+segundo;
 } 

  fechaImprimible = dia+"/"+mes+"/"+anho+"  "+hora+":"+minuto+":"+segundo
  return fechaImprimible;
}
server.listen(3000);
console.log("Servidor corriendo en el puerto", 3000);
