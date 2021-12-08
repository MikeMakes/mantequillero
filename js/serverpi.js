const { exec } = require("child_process");
    
    var express=require('express');
    var app=express();
    var serverp5=app.listen(3000);
    app.use(express.static('testp5'));
    console.log("server running")
    
    var socket=require('socket.io');
    var io=socket(serverp5);
    io.sockets.on('connection', newConnection);
    function newConnection(socket){
        console.log('new connection: ' + socket.id);

        socket.on('angle', recvAngle);
        function recvAngle(angle){
            console.log("Recibido angle: "+angle);

            if (angle < 3.14/2){
            exec("pigs servo 12 1200", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
            } else if((angle > 3.14/2) && (angle < 3.14)){
                exec("pigs servo 12 1800", (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                });
            }else if(angle > 3.14){
                exec("pigs servo 12 0", (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                });
            }
        }

        socket.on('module', recvModule);
        function recvModule(module){
            console.log("Recibido module: "+module);
        }
    }