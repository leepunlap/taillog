var net = require('net');
var Q   = require('q');

//
//	Host and port of socket server
//
var HOST = '127.0.0.1';
var PORT=3001;

//
//	Time delay before sending any message
//
var tSendDelay = 1000;

//
//	Lock polling interval if socket is busy (to ensure one command at a time)
//
var tLockRetryTime = 50;

//
//	Max number of times to try for lock, after which reset and give up
//
var nRetryCount = 100;

//
//	Global socket client, lock and deferred queue, make sure all commands are sent and received serially
//
var client;
var globaldeferred;
var lock = false;
var seq = 0;

//
//	Synchronout send function
//
exports.send = function(msg,callback,retries) {

	//
	//	Keep track of retry count, abort if > maxRetryCount
	//
	if(!retries) {
		retries=0;
	}

	//
	//	Actual code to send msg
	//
	var doSend = function(msg) {
		var currentseq = seq++;
		globaldeferred = Q.defer();
		setTimeout(function (){
			if (client.destroyed) {
				exports.new().then(function() {
					client.write(msg);
				})
			} else {
				client.write(msg);
			}
		},tSendDelay);
		return globaldeferred.promise;
	}

	//
	//	Do locking - only allow one single command through and wait for reply
	//
	if (!lock) {
		lock=true;
		doSend(msg).then(function(received) {
			lock=false;
			callback(received);
		});
	} else {
		if (retries > nRetryCount) {
			callback("{'status':'timeout'}");
		} else {
			setTimeout(function() {
				exports.send(msg,callback,retries+1);
			},tLockRetryTime)
		}
	}

}

exports.new = function() {
	var deferred = Q.defer()
	client = new net.Socket();
	client.connect(PORT, HOST, function() {
	    deferred.resolve();
	});
	if(typeof(client._events['data']) !== 'function') {
		client.on('data', function(received) {
			if (globaldeferred) {
				globaldeferred.resolve(received);
			}
		});
	}
	return deferred.promise;
}

exports.destroy = function() {
	client.destroy();
}

exports.new();

