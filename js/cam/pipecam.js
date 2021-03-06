
const fs = require('fs'); //for pipes
//init and stop servos
console.log('Open pipe /pipetest');
// open in both read mode
// isn't blocked for other process to open the pipe
const fd = fs.openSync('pipetest', 'r+');
pipe = fd;

let data=new Uint8Array(12000);
let out=new Uint8Array();
let frameCounter=0;
let i=0;
let br=0;
let newFrame=false;

while(frameCounter<100){

    //fs.readSync(pipe,data);
    fs.read(pipe,data,0,11700,-1,function(err,bytesRead){
        br=bytesRead;
        newFrame=true;
    });

    /*
    //Slice by knowing all jpeg start with 0xFF 0xD8 bytes
    let jpegstart = data.findIndex((element,index,array) => { 
        //if(element===0xFF) console.log("0xFF at index:  " + index);
        //if(array[index+1]===0xD8) console.log("0xD8 at index:  " + index+1);
        if((element===0xFF)&&(array[index+1]===0xD8)){
            //console.log("Start of frame at: " + index);
            return true;
        }  
    });
    */

    if(newFrame && data.length>0){
        let d=data.slice(0,11700);
        fs.writeFile("d.jpeg",d,'utf-8',function(err){
            if(err) console.log(err);
            else console.log("writed d.jpeg");
        });
    }

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
    i++;
}