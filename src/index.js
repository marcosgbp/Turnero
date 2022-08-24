import express from 'express';
import { Server as WebSocketServer } from 'socket.io';
import http from 'http'

const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server);
const mysql = require('mysql');

/**
 * Establecemos la conexiòn a la base de datos
 */
var conexion = mysql.createConnection({
    host: 'localhost',
    database: 'turnero',
    user: 'root',
    password: '',
});

conexion.connect(function (err) {
    if (err) {
        console.error('Error de conexion: ' + err.stack);
        return;
    } else {
        console.log('Conectado con el identificador ' + conexion.threadId);
    }
});


app.use(express.static(__dirname + "/public"));

//Rutas
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/modules/pulsador/pulsador.html');
});
app.get('/panel', (req, res) => {
    res.sendFile(__dirname + '/public/modules/panel/panel.html');
});
app.get('/control', (req, res) => {
    res.sendFile(__dirname + '/public/modules/control/control.html');
});

io.on('connection', (socket) => {
    socket.on("cliente:buscarUltTurno", () => {
        conexion.query('SELECT MAX(turno) as ultimo_turno FROM turnos', (error, results, fields) => {
            if (error) throw error;
            let turno = (parseInt(results[0].ultimo_turno) + 1);
            //Inserto el turno
            conexion.query('INSERT INTO turnos (turno) VALUES (' + turno + ')', (error, results, fields) => {
                if (error) {
                    console.log("No se pudo insertar en la bd el turno " + error)
                } else {
                    socket.emit("servidor:enviarTurno", turno);
                }
            });
            //Cuento cuanto pendientes hay por el estado y por la fecha
            conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"', (error, results, fields) => {
                //console.log(results[0].pendientes)
                if (error) {
                    console.log("No se pudo insertar en la bd el turno " + error)
                } else {
                    let pendientes = parseInt(results[0].pendientes)
                    socket.broadcast.emit("servidor:enviarPendientes", pendientes);
                }
            });
        });

    });
    //Llamo el turno menor del día con estado pendiente
    socket.on("cliente:LlamarTurno", () => {
        conexion.query('SELECT id_turno, MIN(turno) as turno FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d" ) = DATE_FORMAT(NOW(), "%Y-%m-%d" ) AND estado = "Pendiente"', (error, results, fields) => {
            if (error) {
                console.log("No encontre ningun dato pendiente para llamar")
            } else {
                let id_turno = results[0].id_turno;
                let turno = results[0].turno;
                socket.broadcast.emit("servidor:llamarTurno", turno);
                conexion.query('UPDATE turnos SET estado = "Atendido" WHERE id_turno =' + id_turno);
                //Cuento cuanto pendientes hay por el estado y por la fecha
                conexion.query('SELECT COUNT(id_turno) as pendientes FROM turnos WHERE DATE_FORMAT(fecha_hora, "%Y-%m-%d") = DATE_FORMAT(NOW(), "%Y-%m-%d") AND estado = "Pendiente"', (error, results, fields) => {
                    //console.log(results[0].pendientes)
                    if (error) {
                        console.log("No se pudo insertar en la bd el turno " + error)
                    } else {
                        let pendientes = parseInt(results[0].pendientes)
                        socket.broadcast.emit("servidor:enviarPendientes", pendientes);
                    }
                });
            }
        });
    });
    //Repetir Turno
    socket.on("cliente:RepetirTurno", ()=>{
        conexion.query('SELECT max(turno) turnoRepetido FROM turnos WHERE DATE_FORMAT(fecha_hora, "%d-%m-%Y") = DATE_FORMAT(NOW(), "%d-%m-%Y") AND estado = "Atendido"',(error, results, fields) => {
            if(error){
                console.log("Error en la busqueda del ultimo turno");
            }else{
                console.log(results[0].turnoRepetido)
                let turnoRepetido = parseInt(results[0].turnoRepetido);
                socket.broadcast.emit("servidor:RepetirTurno", turnoRepetido);
            }
        })
    });
})


server.listen(3000);
console.log("Servidor corriendo en el puerto", 3000)