let y =0;
let centerX =0;
let centerY =0;
let mx=0;
let my=0;
let module=0;
let last_module=0;
let angle=0;
let last_angle=0;

var socket;

function setup() {
	createCanvas(windowWidth, windowHeight);
	centerX=windowWidth/2;
	centerY=windowHeight/2;

	//socket = io.connect('http://localhost:3000');
	socket = io.connect();
}

function draw() {
	background(255, 204, 0);

	line(centerX,centerY,mouseX,mouseY);
	line(0, mouseY, width, mouseY);
	line(mouseX, 0, mouseX, height);
	line(centerX, 0, centerX, height);
	line(0,centerY,width,centerY);

	mx=mouseX-centerX;
	my=mouseY-centerY;

	module=sqrt(pow(mx,2)+pow(my,2));
	angle=atan2(my,mx);

	console.log("mouseX:	"+mouseX);
	console.log("mouseY:	"+mouseY);
	console.log("module:	"+module);
	console.log("angle:	"+angle);

	translate(centerX, centerY);
	//rotate(angle);
	//triangle(-20,-20,0,70,0,-20);
	//rect(-20,-20,40,40);
	//rect(centerX-20,centerY-20,40,40);
	if (angle!=last_angle){
		console.log(angle);
		socket.emit('angle',angle);
		last_angle=angle;
	}
	if (module!=last_module){
		console.log(module);
		socket.emit('module',module);
		last_module=module;
	}

}