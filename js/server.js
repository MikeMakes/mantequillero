console.log('Starting...');

//input boundarys
const INPUT_LIN_MAX=450;
const INPUT_ANG_MAX=Math.PI;

//vel boundarys
const VEL_LIN_MAX=0.33*100;
const VEL_ANG_MAX=Math.PI*100;

//kinematics data
let _lin=0.0;
let _ang=0.0;
let _linLast=0.0;
let _angLast=0.0;
const WheelSeparation = 0.06*1.6;
const WheelRadius =0.025/2;

//servo data
const SERVO_EN=1;
const SERVO_LEFT=0;
const SERVO_RIGHT=1;
const SERVO_LEFT_PIN=14;
const SERVO_RIGHT_PIN=15;
const SERVO_PINS=[SERVO_LEFT_PIN, SERVO_RIGHT_PIN];
const SERVO_INV=[1,0]; //software inversion servo dir
const SERVO_CCW_MIN=700;
const SERVO_MID=1500;
const SERVO_CW_MAX=2300;
const SERVO_DEAD_BAND=90;
let SERVO_VEL = new Float64Array(2);
let SERVO_PWM=[0,0];

//image data
let imgbuffer=new Uint8Array(12000);
let br=0;
let newFrame=false;
let frameCounter=0;
let img=new Uint8Array(12000);

//const { spawn } = require("child_process");
const fs = require('fs'); //for pipes

//detects if running in rpi
var isPi = require('detect-rpi');
var pi = false;
if (isPi()){
    console.log('RPI');
    pi = true;
}
else console.log('Not RPI');

var pipe;
var pipeimg;
if(pi){
    //init and stop servos
    console.log('Open pipe /dev/pigpio');
    // open in both read & write mode
    // isn't blocked for other process to open the pipe
    const fd = fs.openSync('/dev/pigpio', 'w+');
    pipe = fd;
    const stop_left ='SERVO ' + SERVO_PINS[SERVO_LEFT] + ' ' + 0 + '\n';
    const stop_right ='SERVO ' + SERVO_PINS[SERVO_RIGHT] + ' ' + 0 + '\n';
    console.log('Stop servo signal: \n', stop_left, stop_right);
    fs.writeSync(fd,stop_left);
    fs.writeSync(fd,stop_right);
    console.log('Stopped.\n');

    console.log('Open pipe /imgpipe');
    const fdi = fs.openSync('imgpipe', 'r+');
    pipeimg = fdi;
}

//start client
var express=require('express');
var app=express();
var serverp5=app.listen(3000);
app.use(express.static('client'));
console.log("Client running.\n");

//all server logic as callbacks from client commands events
console.log("Server running:\n");
//var socket=require('socket.io');
var socket=require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] });
var io=socket(serverp5);

io.sockets.on('connection', newConnection);
function newConnection(socket){
    console.log('New connection: ' + socket.id);
    socket.on('vel_data', changeVel);   //change velocity command callback
    function changeVel(vel_data){
        console.log("Received vel_data: " + vel_data);
        _linLast=_lin;
        _angLast=_ang;
        _lin=vel_data[0];
        _ang=vel_data[1];
        if(_lin>INPUT_LIN_MAX || _lin<-INPUT_LIN_MAX) _lin = INPUT_LIN_MAX * _lin/Math.abs(_lin); //limit w sign
        if(_ang>INPUT_ANG_MAX || _ang<-INPUT_ANG_MAX) _ang = INPUT_ANG_MAX * _ang/Math.abs(_ang);
        _lin=(2*VEL_LIN_MAX)/(2*INPUT_LIN_MAX) * _lin; //scaling

        console.log("LIN: " + _lin);
        console.log("ANG: " + _ang);
        
        function kinetic(_lin,_ang){ //kinematics (lin,ang)=>(left and right servos' speed)
            SERVO_VEL[SERVO_LEFT]=(_lin/100 - WheelSeparation * _ang) /WheelRadius;
            SERVO_VEL[SERVO_RIGHT]=(_lin/100 + WheelSeparation * _ang) /WheelRadius;

            //software direction inversion
            SERVO_VEL.forEach(inverse);
            function inverse(value,index,array){
                if(SERVO_INV[index]) array[index] = value * -1;
            }

            console.log('Servos speed (left,right): '+SERVO_VEL);
        }
        kinetic(_lin,_ang);

        function apply_pwm(SERVO_VEL){ //(left,right) speed => (left,right) pwm
            let pwm_values = SERVO_VEL.map(abs_pwm);
	        function abs_pwm(value){
                let pwm=(SERVO_CW_MAX-SERVO_CCW_MIN)/(2*VEL_LIN_MAX) * value + SERVO_MID;

                //if(pwm>0) pwm = Math.floor(pwm); //round to int
                //else pwm = Math.ceil(pwm);
                pwm=Math.round(pwm);

                console.log("pwm1  "+pwm);
                if(pwm>SERVO_CW_MAX) return SERVO_CW_MAX; //max limit
                else if(pwm<SERVO_CCW_MIN) return SERVO_CCW_MIN; //min limit
                else if(Math.abs(pwm-SERVO_MID)<SERVO_DEAD_BAND*1) return 0; //stop aprox
                else return pwm;
            }

            console.log("PWM_VALUES: "+ pwm_values);
            pwm_left ='SERVO ' + SERVO_PINS[SERVO_LEFT] + ' ' + pwm_values[SERVO_LEFT] + '\n';
            pwm_right ='SERVO ' + SERVO_PINS[SERVO_RIGHT] + ' ' + pwm_values[SERVO_RIGHT] + '\n';
        
	        if(pi && SERVO_EN){
                fs.writeSync(pipe,pwm_left);
                fs.writeSync(pipe,pwm_right);
            } else{
                console.log("\n\nDummy pwm write:\n")
                console.log("\tLEFT: "+pwm_left);
                console.log("\tRIGHT: "+pwm_right);
            }

	        return pwm_values;
        }
    
        SERVO_PWM=[...apply_pwm(SERVO_VEL)];
        socket.emit("pwm_data",SERVO_PWM);
        
        //console.log("sent img_data: ");
        //imgtest=[...imgbuffer];
        //socket.emit("img_data",imgtest);
    }

    socket.on('angle', recvAngle);
    function recvAngle(angle){
        console.log("Recibido angle: "+angle);
    }

    socket.on('module', recvModule);
    function recvModule(module){
        console.log("Recibido module: " + module);
    }

    
    function updateFrame(){
        console.log("updateFrame");
        fs.read(pipeimg,imgbuffer,0,12000,-1,function(err,bytesRead){
            console.log("READ");
            if(err) return console.log(err);
            br=bytesRead;
            newFrame=true;
            if(newFrame && imgbuffer.length>0){
                console.log("newFrame");
                //let img=imgbuffer.slice(0,br);
                img=[...imgbuffer];
                console.log("img");
                socket.emit("img_data",img);
                newFrame=false;
            }
        });
    
        setImmediate(() => {
            updateFrame();
        });
    }
    setImmediate(() => {
        updateFrame();        
    });
}
