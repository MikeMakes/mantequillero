
const fs = require('fs'); //for pipes

//init and stop servos
console.log('Open pipe /pipetest');
// open in both read & write mode
// isn't blocked for other process to open the pipe
const fd = fs.openSync('pipetest', 'r+');
pipe = fd;

let data=new Uint8Array();
let out=new Uint8Array();
let framecounter=0;
let c=0;
while(framecounter<100){

    fs.readSync(pipe,data);


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
        fs.writeFile("frame"+frameCounter+".jpeg", out, 'base64', function (err) {
            if (err) return console.log(err);
            else console.log("writed frame_"+frameCounter+".jpeg");
        });//, [encoding], [callback])


        out =new Uint8Array();
    }

    out = Buffer.concat([out,data]);

    // Close the client socket completely
    //if(frameCounter===100) client.destroy();
    c++;
}