console.log('Starting...');

const VEL_LIN_MAX=3500.0;
const VEL_ANG_MAX=Math.PI;

let _lin=0.0;
let _ang=0.0;
const WheelSeparation = 100;
const WheelRadius =0.2;

const SERVO_EN=0;
const SERVO_LEFT=0;
const SERVO_RIGHT=1;
const SERVO_LEFT_PIN=14;
const SERVO_RIGHT_PIN=15;
const SERVO_PINS=[SERVO_LEFT_PIN, SERVO_RIGHT_PIN];
const SERVO_CCW_MIN=700;
const SERVO_MID=1500;
const SERVO_CW_MAX=2300;
const SERVO_DEAD_BAND=90;
let SERVO_VEL = new Float64Array(2);

const { spawn } = require("child_process");
const fs = require('fs');

var isPi = require('detect-rpi');
var pi = false;
if (isPi()){
    console.log('RPI');
    pi = true;
}
else console.log('Not RPI');

if(pi){
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
}
  
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

    socket.on('vel_data', changeVel);
    function changeVel(vel_data){
        console.log("Received vel_data: " + vel_data);
        _lin=vel_data[0];
        _ang=vel_data[1];

        function kinetic(_lin,_ang){
            SERVO_VEL[SERVO_LEFT]=(_lin - WheelSeparation * _ang) /WheelRadius;
            SERVO_VEL[SERVO_RIGHT]=(_lin + WheelSeparation * _ang) /WheelRadius;
            console.log('kinematics: '+SERVO_VEL);
        }
        kinetic(_lin,_ang);

        function apply_pwm(SERVO_VEL){
            let pwm_values = SERVO_VEL.map(abs_pwm);
            function abs_pwm(value){
                let pwm=(SERVO_CW_MAX-SERVO_CCW_MIN)/(2*VEL_LIN_MAX) * value +SERVO_MID;
                pwm = Math.floor(pwm);
                if(pwm>SERVO_CW_MAX) return SERVO_CW_MAX;
                else if(pwm<SERVO_CCW_MIN) return SERVO_CCW_MIN;
                else 
                    if(Math.abs(pwm-SERVO_MID)<SERVO_DEAD_BAND*1.5) return SERVO_MID;
                    return pwm;
            }

            console.log("PWM_VALUES: "+ pwm_values);

            pwm_left ='SERVO ' + SERVO_PINS[SERVO_LEFT] + ' ' + pwm_values[SERVO_LEFT] + '\n';
            pwm_right ='SERVO ' + SERVO_PINS[SERVO_RIGHT] + ' ' + pwm_values[SERVO_RIGHT] + '\n';
            if(pi && SERVO_EN){
                fs.writeSync(fd,pwm_left);
                fs.writeSync(fd,pwm_right);
            } else{
                console.log("LEFT: "+pwm_left);
                console.log("RIGHT: "+pwm_right);
            }
        }
        apply_pwm(SERVO_VEL);
    }

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
        console.log("Recibido module: " + module);
    }

}