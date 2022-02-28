fs = require('fs');
let frameCounter=0;
let c=0;
let out = new Uint8Array(); // new in ES2017

var http = require('http');
const httpserver = http.createServer(function(req, res) {
  console.log('Server running at http://localhost:8124/');
  res.writeHead(200, {'Content-Type': 'image/jpeg'})
  res.end(out) // Send the file data to the browser.
}).listen(8124)


var net = require('net');
var HOST = '192.168.18.114';
var PORT = 3001;

var client = new net.Socket();
client.connect(PORT, HOST, function() {
  console.log('CONNECTED TO: ' + HOST + ':' + PORT);
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
  console.log("Data event n:  " + c);
  console.log('Frame: ' + frameCounter);

  //Slice by knowing all jpeg start with 0xFF 0xD8 bytes
  let jpegstart = data.findIndex((element,index,array) => { 
    //if(element===0xFF) console.log("0xFF at index:  " + index);
    //if(array[index+1]===0xD8) console.log("0xD8 at index:  " + index+1);
    if((element===0xFF)&&(array[index+1]===0xD8)){
      //console.log("Start of frame at: " + index);
      return true;
    }  
  });

  //Save frame
  if((jpegstart>=0)&&out.length>0){
    console.log("New Frame");
    frameCounter++;

  
    //fs.writeFile("frame_"+frameCounter+".jpeg", out, 'base64', function (err) {
    fs.writeFile("frame.jpeg", out, 'base64', function (err) {
      if (err) return console.log(err);
      else console.log("writed frame_"+frameCounter+".jpeg");
    });//, [encoding], [callback])
    
    
    out =new Uint8Array();
  }

  out = Buffer.concat([out,data]);

  // Close the client socket completely
  //if(frameCounter===100) client.destroy();
  c++;

  //console.log(out.length);
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
  console.log('Connection closed');
});


