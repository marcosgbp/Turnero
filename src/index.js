import express from "express";
import { Server as WebSocketServer } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server);
const mysql = require("mysql");

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
    conexion.query('SELECT id_turno, turno as ultimo_turno FROM turnos WHERE estado = "Atendido" ORDER BY id_turno desc limit 1', (error, results, fields) => {
        if (error) throw error;
        let resultado = results.length >= 1 ? parseInt(results[0].ultimo_turno) : 0;
        socket.emit("servidor:UltimoTurno", resultado);
      }
    );
    //Cuento cuanto pendientes hay por el estado y por la fecha
    conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"', (error, results, fields) => {
        if (error) throw error;
        let pendientes = parseInt(results[0].pendientes);
        socket.emit("servidor:enviarPendientes", pendientes);
      }
    );
  });
  socket.on("cliente:buscarUltTurno", (input_ci) => {
    conexion.query("SELECT id_turno, turno as ultimo_turno FROM turnos order by id_turno desc limit 1",(error, results, fields) => {
        if (error) throw error;
        let ultTurno = results.length >= 1 ? results[0].ultimo_turno : 0;
        //Acá valido por si la base de datos no tiene valor va devolver null entonces el turno empieza de 1 y
        let turno = isNaN(ultTurno + 1) || ultTurno + 1 > 99 ? 1 : ultTurno + 1;
          conexion.query('SELECT cod_cli, ci_ruc, nombre FROM clientes WHERE ci_ruc LIKE "%'+input_ci+'%"', (error, results, fields)=>{
            if (error) {
              console.log("Error en la busqueda del cliente");
            } else {
                if(results.length==0){
                  var cod_cli = "C000001";
                  var ci_ruc = "X";
                  var nombre = "SIN NOMBRE";
                }else{
                  var cod_cli = results[0].cod_cli;
                  var ci_ruc = results[0].ci_ruc;
                  var nombre = results[0].nombre;
                }
                  //Inserto el turno
                  conexion.query("INSERT INTO turnos (turno, cod_cli, nombre_cli, ci_ruc) VALUES (" + turno + ", '"+cod_cli+"', '"+nombre+"', '"+ci_ruc+"')", (error, results, fields) => {
                    if (error) {
                      console.log("No se pudo insertar en la bd el turno " + error);
                    } else {
                      let datos_cli = {
                        "turno": turno,
                        "nombre": nombre,
                        "ci_ruc": ci_ruc
                      }
                      socket.emit("servidor:enviarTurno", datos_cli);
                    }
                });
              }  
              //Cuento cuanto pendientes hay por el estado y por la fecha
              conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"', (error, results, fields) => {
                if (error) {
                  console.log("No se pudo insertar en la bd el turno " + error);
                } else {
                  let pendientes = parseInt(results[0].pendientes);
                  socket.broadcast.emit("servidor:enviarPendientes", pendientes);
                }
              }
            );
            });


      }
    );
  });
  //Llamo el turno menor del día con estado pendiente
  socket.on("cliente:LlamarTurno", () => {
    conexion.query(
      'SELECT id_turno, MIN(turno) as turno FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d" ) = DATE_FORMAT(NOW(), "%Y-%m-%d" ) AND estado = "Pendiente"',
      (error, results, fields) => {
        if (error) {
          console.log("No encontre ningun dato pendiente para llamar");
        } else {
          let id_turno = results[0].id_turno;
          let turno = results[0].turno;
          socket.broadcast.emit("servidor:llamarTurno", turno);
          conexion.query(
            'UPDATE turnos SET estado = "Atendido" WHERE id_turno =' + id_turno
          );
          //Cuento cuanto pendientes hay por el estado y por la fecha
          conexion.query(
            'SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"',
            (error, results, fields) => {
              //console.log(results[0].pendientes)
              if (error) {
                console.log("No se pudo insertar en la bd el turno " + error);
              } else {
                let pendientes = parseInt(results[0].pendientes);
                socket.broadcast.emit("servidor:enviarPendientes", pendientes);
              }
            }
          );
        }
      }
    );
  });
  //Repetir Turno
  socket.on("cliente:RepetirTurno", () => {
    conexion.query(
      'SELECT max(turno) turnoRepetido FROM turnos WHERE DATE_FORMAT(fecha_hora, "%d-%m-%Y") = DATE_FORMAT(NOW(), "%d-%m-%Y") AND estado = "Atendido"',
      (error, results, fields) => {
        if (error) {
          console.log("Error en la busqueda del ultimo turno");
        } else {
          let turnoRepetido = parseInt(results[0].turnoRepetido);
          socket.broadcast.emit("servidor:RepetirTurno", turnoRepetido);
        }
      }
    );
  });

  //Busco el cliente
  socket.on("cliente:BuscarCliente",(input_ci)=>{
    conexion.query('SELECT ci_ruc, nombre FROM clientes WHERE ci_ruc LIKE "%'+input_ci+'%"', (error, results, fields)=>{
      if (error) {
        console.log("Error en la busqueda del cliente");
      } else {
        socket.emit("servidor:MostrarCliente", results);
      }
    });
  })

});

server.listen(3000);
console.log("Servidor corriendo en el puerto", 3000);
