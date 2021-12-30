console.log('Starting...');

const { spawn } = require("child_process");
const fs = require('fs');

var isPi = require('detect-rpi');
var pi = false;

if (isPi()){
    console.log('RPI');
    pi = true;
}
else console.log('Not RPI');

console.log('open pipe /dev/pigpio');
// open in both read & write mode
// isn't blocked for other process to open the pipe
const fd = fs.openSync('/dev/pigpio', 'w+');
const stop = 'servo 14 0\n';
const foward= 'servo 14 1200\n';
const reverse='servo 14 1800\n';
console.log('Stop servo signal: ', stop);
fs.writeSync(fd, stop);
fs.writeSync(fd,stop);
fs.writeSync(fd,stop);
console.log('\nStopped.\n\n\n');
    
var express=require('express');
var app=express();
var serverp5=app.listen(3000);
app.use(express.static('testp5'));
console.log("Server running:")

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
            console.log("+++ ALANTE +++");
            if(pi) fs.writeSync(fd,foward);
            else spawn("ls", ["-la"]);
        } else if((angle > 3.14/2) && (angle < 3.14)){
            console.log("--- ATRAS ---");
            if(pi) fs.writeSync(fd,reverse);
            else spawn("ls", ["-la"]);
        }else if(angle > 3.14){
            console.log("... parao ...");
            if(pi) fs.writeSync(fd,stop);
            else spawn("ls", ["-la"]);
        }
    }

    socket.on('module', recvModule);
    function recvModule(module){
        console.log("Recibido module: "+module);
    }
}