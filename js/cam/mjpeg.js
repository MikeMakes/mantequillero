var clients = [];

// Registering route
exports.install = function() {
    ROUTE('GET /mjpeg/', mjpeg);
};

// Action
function mjpeg() {

    var self = this;
    var headers = {};
    var multipart = '--totalmjpeg';

    headers['Cache-Control'] = 'private, no-cache, no-store, max-age=0';
    headers['Content-Type'] = 'multipart/x-mixed-replace; boundary="' + multipart + '"';
    headers.Connection = 'close';
    headers.Pragma = 'no-cache';

    // Makes answer
    self.custom();
    self.res.writeHead(200, headers);

    self.mjpegwrite = function(buffer) {
        self.res.write('--' + multipart + '\r\n', 'ascii');
        self.res.write('Content-Type: image/jpeg\r\n');
        self.res.write('Content-Length: ' + buffer.length + '\r\n');
        self.res.write('\r\n', 'ascii');
        self.res.write(buffer, 'binary');
        self.res.write('\r\n', 'ascii');
    };

    self.mjpegend = function() {
        self.res.end();
    };

    var close = function() {
        var index = clients.indexOf(self);
        if (index !== -1) {
            clients[index] = null;
            clients.splice(index, 1);
        }
    };

    self.res.on('finish', close);
    self.res.on('close', close);
    self.res.on('error', close);

    // Caches the current request
    clients.push(self);
}

// Registers a public method for sending entire content to all open clients
// This method sends data to all online clients
FUNC.mjpegsend = function(buffer) {
    for (var client of clients)
        client.mjpegwrite(buffer);
};