//coord system data
let centerX =0;
let centerY =0;
let mx=0;
let my=0;

//velocity input and command data
let modd=0.0;
let last_modd=0.0;
let angle=0.0;
let last_angle=0.0;
let vel_data = new Array(2);
let pwm_data = [0,0];

var socket;

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(24);
	centerX=windowWidth/2;
	centerY=windowHeight/2;

	socket = io.connect(window.location.origin);
	//socket = io.connect(window.location.origin,{ rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']});

	//socket.on('pwm', pwm_visualizer);
	//function pwm_visualizer(pwm){
	socket.on("pwm_data", (pwm) => {
		pwm_data = pwm;
		console.log('pwm_data from server: '+pwm_data);
	});
	//}
}

function draw() {
	background(255, 204, 0); //in future bkg will be webcam capture

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

	//get velocity mouse input
	if(mouseIsPressed){
		//console.log("mouseIsPressed");
		modd=sqrt(pow(mx,2)+pow(my,2));
		if(my<0) modd=-modd;
		angle=atan2(my,mx);
		angle=Math.PI/2-angle;

		//send new velocity command
		if(modd<(windowHeight-100)/2){
			vel_data[0]=modd;
			vel_data[1]=angle;

			if((vel_data[1]!=last_angle) || (vel_data[0]!=last_modd)){
				socket.emit('vel_data',vel_data);
				console.log("Emit vel_data: "+ vel_data);
				if(socket.disconnected) pwm_data=[...kinetic(vel_data[0],vel_data[1])]; //offline fake kinematics
				textSize(32);
				fill(255, 0, 0);
				text(vel_data[0], centerX, centerY);
				text(vel_data[1], centerX, centerY+50);
			}
		}
	}

	if(socket.disconnected){
		//visualize dummy kinematics
		fill(255,0,0,100);
		rect(50, centerY, 50, pwm_data[0]/10);
		rect(101, centerY, 50, pwm_data[1]/10);	
	} else{
		//visualize servo pwm values
		fill(0,255,0,100);
		rect(50, centerY, 50, pwm_data[0]/10);
		rect(101, centerY, 50, pwm_data[1]/10);
	}
}

function keyPressed() {
	let sendmsg = true;
	if (keyCode === LEFT_ARROW)
		if(angle>=-Math.PI+0.1) angle=angle-0.1;		
	else if (keyCode == 39){//RIGHT_ARROW){
		if(angle<=Math.PI-0.1){
			angle=angle+0.1;
		}
			console.log(Math.PI-0.1);
			console.log(">=");
			console.log(angle);
	}
	else if (keyCode === DOWN_ARROW)
		if(modd>=-999) modd=modd-1;
	else if (keyCode === up_ARROW)
		if(modd<=999) modd=modd+1;
	else
		sendmsg=false;

	console.log("keypressed"+keyCode);

	if (sendmsg){
		console.log("key send");
		vel_data[0]=modd;
		vel_data[1]=angle;

		if((vel_data[1]!=last_angle) || (vel_data[0]!=last_modd)){
			socket.emit('vel_data',vel_data);
			console.log("Emit vel_data: "+ vel_data);
			if(socket.disconnected) pwm_data=[...kinetic(vel_data[0],vel_data[1])]; //offline fake kinematics
			textSize(32);
			fill(0, 255, 0);
			text(vel_data[0], centerX, centerY);
			text(vel_data[1], centerX, centerY+50);
		}
	}
}

function kinetic(_lin,_ang){ //kinematics (lin,ang)=>(left and right servos' speed)
	let SERVO_VEL=[0,0];
	const WheelSeparation = 0.06;
	const WheelRadius =0.025/2;

	SERVO_VEL[0]=(_lin/100 - (WheelSeparation * _ang/100)) /WheelRadius;
	SERVO_VEL[1]=(_lin/100 + (WheelSeparation * _ang/100)) /WheelRadius;

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
