var net = require('net');
var PORT=3001;

//
//  Disconnection Timeout
//
var timeout = 6000;

net.createServer(function(sock) {

    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sock.context = {
        remoteAddress : sock.remoteAddress,
        remotePort : sock.remotePort
    }
    sock.on('data', function(received) {
        console.log('RECVDATA ' + sock.context.remoteAddress + ': ' + received);
        sock.write(received);
    });
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.context.remoteAddress + ' ' + sock.context.remotePort);
    });
    sock.on('error', function(err) {
        console.log('Error occurred:', err.message);
    });
    sock.setTimeout(timeout);
    sock.on('timeout', function() {
        sock.write('idle timeout, disconnecting, bye!');
        sock.end();
    });

}).listen(PORT);

console.log('Socket Server listening on port ' + PORT);