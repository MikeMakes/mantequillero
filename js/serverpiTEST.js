const { exec } = require("child_process");
    
    var express=require('express');
    var app=express();
    var serverp5=app.listen(3000);
    app.use(express.static('testp5'));
    console.log("server running")
    
    //var socket=require('socket.io');
    var socket=require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] });
    var io=socket(serverp5);
    io.sockets.on('connection', newConnection);
    function newConnection(socket){
        console.log('new connection: ' + socket.id);

        socket.on('angle', recvAngle);
        function recvAngle(angle){
            console.log("Recibido angle: "+angle);

            if (angle < 3.14/2){
	    console.log("------ALANTE");
            //exec("pigs servo 14 1200", () => {
            //});
            } else if((angle > 3.14/2) && (angle < 3.14)){
                console.log("++++++ATRAS");
		//exec("pigs servo 14 1800", (error, stdout, stderr) => {
                //});
            }else if(angle > 3.14){
		console.log("......parao");
                //exec("pigs servo 14 0", (error, stdout, stderr) => {
                //});
            }
        }

        socket.on('module', recvModule);
        function recvModule(module){
            console.log("Recibido module: "+module);
        }
    }
