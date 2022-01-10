# mantequillero   
It tosses you the butter.   
Work in progress of the Rick & Morty butter robot with a Pi zero with some servos, webcam, and a node.js server controlled from a javascript client.  
The client looks like  [this][https://mikemakes.github.io/mantequillero/]

# Pi Zero W setup   
- Install [pigpio][https://github.com/joan2937/pigpio] (read how to start his daemon)
- Install [node.js][https://hassancorrigan.com/blog/install-nodejs-on-a-raspberry-pi-zero/]

- sudo npm install socket.io p5-manager

- sudo apt-get update
- sudo apt-get install git
- git clone https://github.com/MikeMakes/mantequillero

# Run web server with
- node ./mantequillero/js/server.js
