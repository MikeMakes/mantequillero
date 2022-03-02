//coord system data
let centerX =0;
let centerY =0;
let mx=0;
let my=0;

//velocity input and command data
let modd=0.0;
let moddLast=0.0;
let angle=0.0;
let angleLast=0.0;
let vel_data = new Array(2);
let pwm_data = [0,0];

//pwm constant for dummy kinematics
const SERVO_CCW_MIN=700;
const SERVO_MID=1500;
const SERVO_CW_MAX=2300;
const SERVO_DEAD_BAND=90;
const VEL_LIN_MAX=0.33*100;

//image data
let imgbuff=new Uint8Array();
let img; //dom element ref
let newFrame=false;

var socket;

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function setup() {
	socket = io.connect(window.location.origin);
	//socket = io.connect(window.location.origin,{ rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']});

	socket.on("pwm_data", (pwm) => {
		pwm_data = pwm;
		console.log('pwm_data from server: '+pwm_data);
	});

	socket.on("img_data", (imgbuffer) => {
		imgbuff=imgbuffer;
		newFrame=true;
	});

	img = createImg("data:image/jpeg;base64," + '','jpeg image captured');
	img.style("z-index","-1");
	img.position(0, 0);
	img.size(windowWidth, windowHeight);

	createCanvas(windowWidth, windowHeight);
	frameRate(24);
	centerX=windowWidth/2;
	centerY=windowHeight/2;
}

function draw() {
	clear();
	background(255,255,255,0);

	if(newFrame && imgbuff.length>0){
		var b64 = _arrayBufferToBase64(imgbuff);
		img.attribute('src', "data:image/jpeg;base64," + b64);
		newFrame=false;
	}else{
		if(socket.disconnected) img.attribute('src', "resources/nocam.jpg");
	}

	//coordinate system
	line(centerX,centerY,mouseX,mouseY);
	line(0, mouseY, width, mouseY);
	line(mouseX, 0, mouseX, height);
	line(centerX, 0, centerX, height);
	line(0,centerY,width,centerY);

	//circle
	fill(255,255,255,100);
	ellipse(centerX, centerY, windowHeight-100, windowHeight-100);
	ellipse(centerX, centerY, windowHeight-300, windowHeight-300);
	ellipse(centerX, centerY, windowHeight-800, windowHeight-800);
	mx=centerX-mouseX;
	my=centerY-mouseY;

	let reduce_lin = true;
	let reduce_ang = true;

	//get velocity mouse input
	if(mouseIsPressed){
		modd=sqrt(pow(mx,2)+pow(my,2));
		if(my<0) modd=-modd;
		angle=atan2(my,mx);
		angle=Math.PI/2-angle;
		if(angle>=Math.PI) angle=-Math.PI+(angle-Math.PI); //[pi,3pi/2]=>[-pi/2,-pi] -Math.PI+(angle-Math.PI)

		reduce_lin=false;
		reduce_ang=false;
	}

	//keyboard velocity input, hold increase, release stops 
	if (keyIsDown(65)) {//right
		angle -= 0.2;
		if(angle<=-Math.PI) angle=-Math.PI; 
		reduce_ang=false;
	}
	if (keyIsDown(68)) {//left
		angle += 0.2;
		if(angle>=Math.PI) angle=Math.PI;
		reduce_ang=false;
	}
	if (keyIsDown(83)) {//down
		modd -= 20;
		if(modd<-500) modd=-500;
		reduce_lin=false;
	}
	if (keyIsDown(87)) {//up
		modd += 20;
		if(modd>500) modd=500;
		reduce_lin=false;
	}

	//automatic speed decrease
	if(reduce_lin===true) modd=modd*0.4;
	if(reduce_ang===true) angle=angle*0.4;
	if((modd>-10)&&(modd<10)) modd=0;
	if((angle>-0.1)&&(angle<0.1)) angle=0;

	if(moddLast!=modd || angleLast!=angle) send_vel();
	moddLast=modd;
	angleLast=angle;

	if(socket.disconnected){
		fill(255,0,0,100);	//red dummy kinematics
	} else{
		fill(0,255,0,100); //green servo pwm values
	}

	let pwm_data_norm = pwm_data.map(pwm_norm);
	function pwm_norm(value){
		if (value===0) return value;
		return value-1500;
	}
	rect(50, centerY, 50, -pwm_data_norm[1]/10);
	rect(101, centerY, 50, pwm_data_norm[0]/10);
}

function send_vel(){
	vel_data[0]=modd;
	vel_data[1]=angle;

	socket.emit('vel_data',vel_data);
	console.log("Emit vel_data: "+ vel_data);
	//if(socket.disconnected) pwm_data=[...kinetic(vel_data[0],vel_data[1])]; //offline fake kinematics
	if(socket.disconnected) pwm_data=[...apply_pwm(kinetic(vel_data[0],vel_data[1]))]; //offline fake pwm
	
	/* //debug print speed on screen
	textSize(32);
	fill(0, 255, 0);
	text(vel_data[0], centerX, centerY);
	text(vel_data[1], centerX, centerY+50);
	*/
}

function kinetic(_lin,_ang){ //kinematics (lin,ang)=>(left and right servos' speed)
	let SERVO_VEL=[0,0];
	const WheelSeparation = 0.06;
	const WheelRadius =0.025/2;

	SERVO_VEL[0]=(_lin/100 - (WheelSeparation * _ang)) /WheelRadius;
	SERVO_VEL[1]=(_lin/100 + (WheelSeparation * _ang)) /WheelRadius;

	/*
	fill(0,255,255,100);
	rect(centerX, centerY, 50, SERVO_VEL[0]/10);
	rect(centerX, centerY, 50, SERVO_VEL[1]/10);
	*/

	//software direction inversion
	let SERVO_INV=[1,0];
	SERVO_VEL.forEach(inverse);
	function inverse(value,index,array){
		if(SERVO_INV[index]) array[index] = value * -1;
	}

	console.log('[Dummy kin] Servos speed (left,right): '+SERVO_VEL);

	return SERVO_VEL;
}

function apply_pwm(SERVO_VEL){ //(left,right) speed => (left,right) pwm
	let pwm_values = SERVO_VEL.map(abs_pwm);
	function abs_pwm(value){
		let pwm=(SERVO_CW_MAX-SERVO_CCW_MIN)/(2*VEL_LIN_MAX) * value + SERVO_MID;

		//if(pwm>0) pwm = Math.floor(pwm); //round to int
		//else pwm = Math.ceil(pwm);
		pwm=Math.round(pwm);

		//console.log("pwm1  "+pwm);
		if(pwm>SERVO_CW_MAX) return SERVO_CW_MAX; //max limit
		else if(pwm<SERVO_CCW_MIN) return SERVO_CCW_MIN; //min limit
		else if(Math.abs(pwm-SERVO_MID)<SERVO_DEAD_BAND*1) return 0; //stop aprox
		else return pwm;
	}

	console.log("\n\nDummy pwm write:\n")
	console.log("\tLEFT: "+pwm_values[0]);
	console.log("\tRIGHT: "+pwm_values[1]);
	
	return pwm_values;
}

/*
function keyPressed(){
	console.log("keycode "+keyCode);

}
*/
