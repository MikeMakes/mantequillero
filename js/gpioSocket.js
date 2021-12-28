console.log('Starting...');

const { spawn } = require("child_process");

var isPi = require('detect-rpi');
var pi = false;
if (isPi()){
    console.log('RPI');
    pi = true;
}
else console.log('Not RPI');

console.log("Server running:")


var socket = io.connect("192.168.18.114:8888");


