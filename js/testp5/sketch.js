let y =0;
let centerX =0;
let centerY =0;
let mx=0;
let my=0;
let modd=0.0;
let last_modd=0.0;
let angle=0.0;
let last_angle=0.0;
let vel_data = new Array(2);
let pwm_data = [100,100];

var socket;

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(24);
	centerX=windowWidth/2;
	centerY=windowHeight/2;

	//socket = io.connect('http://localhost:3000');
	socket = io.connect(window.location.origin);
	//socket = io.connect(window.location);
	//socket = io.connect(window.location.origin,{ rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']});

	//socket.on('pwm', pwm_visualizer);
	//function pwm_visualizer(pwm){
	socket.on("pwm_data", (pwm) => {
		pwm_data = pwm;
		console.log("pwm: \n");
		console.log(pwm);
		console.log("fin pwm");
	});
	//}
}

function draw() {
	background(255, 204, 0);

	line(centerX,centerY,mouseX,mouseY);
	line(0, mouseY, width, mouseY);
	line(mouseX, 0, mouseX, height);
	line(centerX, 0, centerX, height);
	line(0,centerY,width,centerY);

	fill(255,255,255,100);
	ellipse(centerX, centerY, windowHeight-100, windowHeight-100);
	ellipse(centerX, centerY, windowHeight-300, windowHeight-300);
	ellipse(centerX, centerY, windowHeight-800, windowHeight-800);
	mx=centerX-mouseX;
	my=centerY-mouseY;

	modd=sqrt(pow(mx,2)+pow(my,2));
	if(my<0) modd=-modd;
	angle=atan2(my,mx);
	angle=Math.PI/2-angle;

	if(angle!=last_angle || modd!=last_modd){
		//console.log("Enviando vel_data: " + vel_data);
		vel_data[0]=modd;
		vel_data[1]=angle;
		console.log(modd);
		console.log(windowHeight-100);
		if(mouseIsPressed && modd<(windowHeight-100)/2)
			socket.emit('vel_data',vel_data);
	}

	fill(255,0,0,100);
	rect(50, centerY, 50, pwm_data[0]/10);
	rect(100,centerY,50,pwm_data[1]/10);
}
