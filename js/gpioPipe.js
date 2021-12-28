const fs = require('fs');

// open in both read & write mode
// isn't blocked for other process to open the pipe
const fd = fs.openSync('/dev/pigpio', 'w+');

const input="servo 14 1700";
console.log('sending:', input);
fs.writeSync(fd, input);
console.log('send');