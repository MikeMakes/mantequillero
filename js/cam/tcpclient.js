fs = require('fs');
let i=0;
let j=0;
let c=0;
let out = new Uint8Array(); // new in ES2017
let startFrame = new Uint8Array();
let endFrame = new Uint8Array();
let newFrame = false;

var net = require('net');

var HOST = '192.168.18.114';
var PORT = 3001;

var client = new net.Socket();
client.connect(PORT, HOST, function() {
  console.log('CONNECTED TO: ' + HOST + ':' + PORT);
  // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client
  //client.write('8 14 1200 0 0 0 0');
  //  client.write('0x8','hex'); 
  // client.write('0x14','hex');
  // client.write('1200');
  // client.write('0');
  //client.write('0');
  //client.write('0');
  // client.write('0');
  // client.write('0');
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
  console.log("Data event n:  " + c);
  console.log('Frame: ' + j);
  /*
  fs.writeFile("base64_"+i+".jpeg", data, 'base64', function (err) {
    if (err) return console.log(err);
    console.log('END BASE64');
  });//, [encoding], [callback])
  fs.writeFile("ascii_"+i+".jpeg", data, 'ascii', function (err) {
    if (err) return console.log(err);
    console.log('END ascii');
  });//, [encoding], [callback])

  fs.writeFile("utf8_"+i+".jpeg", data, 'utf8', function (err) {
    if (err) return console.log(err);
    console.log('END utf8');
  });//, [encoding], [callback])
  */

  //Slice by jpeg FF D8 start
  let jpegstart = data.findIndex((element,index,array) => { 
    //console.log("searching");
    if(element===0xFF) console.log("0xFF at index:  " + index);
    if(array[index+1]===0xD8) console.log("0xD8 at index:  " + index+1);
    if((element===0xFF)&&(array[index+1]===0xD8)){
      console.log("start at: " + index);
      return true;
    }  
  });
  /*
  if(jpegstart>0){
    endFrame = data.slice(0,jpegstart-1);
    startFrame = data.slice(jpegstart);
    out = Buffer.concat([out,endFrame]);
    newFrame=true;
    console.log("New Frame");
  }else{
    newFrame=false;
    out = Buffer.concat([out,data]);
  }*/

  if(jpegstart>=0){
    newFrame=true;
    console.log("New Frame");

    //endFrame = data.slice(0,jpegstart-1);
    //startFrame = data.slice(jpegstart);
    fs.writeFile("final_"+j+".jpeg", out, 'base64', function (err) {
      if (err) return console.log(err);
      else console.log("writed final_"+j+".jpeg");
    });//, [encoding], [callback])

    out =new Uint8Array();
  }else{
    newFrame=false;
  }

  out = Buffer.concat([out,data]);
  
  /*
  if(i<3) {
    out = Buffer.concat([out,data]);
  }

  if(i===2) {
    i=-1;

    fs.writeFile("final_"+j+".jpeg", out, 'base64', function (err) {
      if (err) return console.log(err);
      else console.log("writed final_"+j+".jpeg");
    });//, [encoding], [callback])

    out=new Uint8Array();

    j++;
    //out=[...startFrame]; 
  }
  */

  if(newFrame){
    //out =new Uint8Array();
    //out = Buffer.concat([out,startFrame]);

    j++;

  }


  // Close the client socket completely
  if(j===100) client.destroy();
  //client.destroy();
  //i++;
  c++;

  console.log(out.length);
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
  console.log('Connection closed');
});


