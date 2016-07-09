var express = require('express');
var app = express();
var server = require('http').createServer(app);
var lfu = require('lfu-cache')(
    20000,   // max size of the cache
    60000    // decay of the entries in milliseconds
);

var debounce = 30000;

lfu.on('eviction', function(key, obj) {
    console.log("evicted", key, obj);
});

var res = {};
res.json = function(o) {
	console.log(JSON.stringify(o));
}

var emailpatt = /^[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,4}$/i;
var emailpatt2 = /[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,4}/i;

var io = require('socket.io')(server);
io.on('connection', function(socket){
	socket.on('data', function(data){
		if (data.action == 'register') {
			socket.emit('progress','Registering Email');
			var matchemail = data.email.match(emailpatt);
			if (!matchemail) {
				socket.emit('progress', 'Invalid Email Address');
			} else {
				r.requestAccess(res,socket,data.email,'00:00:00:00:00','127.0.0.1');
			}
		}
		if (data.action == 'activate') {
			socket.emit('progress','Processing Activation');
			var matchemail = data.email.match(emailpatt);
			if (!matchemail) {
				socket.emit('progress', 'Invalid Email Address');
			} else {
				r.activate(res,socket,data.email,data.activation_code);
			}
		}
	});
});



var util = require('./service/util.js');
var r = require('./service/emailRegister');

var Tail = require('tail').Tail;
var tail = new Tail("/var/log/messages");
//var tail = new Tail("syslog.log");
//
//	Syslog Tail
//

tail.on("line", function(data) {


	
	var regex =/MAC.*EMAIL.*/;
	var regex2 =/MAC\s+(\S+)\s+IP\s+(\S+)\s+EMAIL\s+(\S+)\s+OLDEMAIL\s+(.*)\s+IFALIAS\s+(\S+)\s+WIRELESSAP\s+(\S+)/;

	if (m = data.match(regex)) {
		if (m2 = m[0].match(regex2)) {
			var mac = m2[1];
			var ip = m2[2];
			var email = m2[3];
			var oldemail = m2[4];
			var ifalias = m2[5];
			var wirelessap = m2[6];
			if (email.match(emailpatt2)) {
				if (email !== oldemail) {
					var cache = lfu.get(email);
					if (cache) {
						var tdiff = Date.now() - cache.time;
						if (tdiff < debounce) {
							console.log("--- Debounced Request ("+tdiff+") :" + mac + "," + ip + "," + email + "," + ifalias + "," + wirelessap);
						} else {
							console.log("+++ RETURNING Registration Request :" + mac + "," + ip + "," + email + "," + ifalias + "," + wirelessap);
							lfu.set(email, {mac: mac, ip: ip, time:Date.now()});
							r.requestAccess(res,null,email,mac,ip);
						}
					} else {
						console.log("+++ NEW Registration Request :" + mac + "," + ip + "," + email + "," + ifalias + "," + wirelessap);
						lfu.set(email, {mac: mac, ip: ip, time:Date.now()});
						r.requestAccess(res,null,email,mac,ip);
					}
					
				} else {
					console.log("--- Duplicate Request :" + mac + "," + ip + "," + email + "," + ifalias + "," + wirelessap);
				}
				
				//
			} else {
				//console.log("--- Invalid Email Address [" + email + "] for mac " + mac + " ip " + ip);
			}
		} else {
			//console.log("--- Invalid line received : [" + m[0] + "]");
		}
	}
  
});
tail.on("error", function(error) {
  console.log('ERROR: ', error);
});

//
//	Express
//
app.use(express.static(__dirname + '/html'));

// app.get('/activationrequest/:email/:mac/:ip/:hmac', function (req, res) {
// 	var macpatt = /^[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/i
// 	var emailpatt = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i

// 	var matchmac = req.params.mac.match(macpatt);
// 	var matchemail = req.params.email.match(emailpatt);

// 	if (!matchmac) {
// 		util.makeError(res,req.params.mac + " is not a valid MAC address");
// 	} else	if (!matchemail) {
// 		util.makeError(res,req.params.email + " is not a valid email address");
// 	} else {
// 		r.requestAccess(res,null,req.params.email,req.params.mac,req.params.ip);
// 	}
	
// });

// app.get('/activate/:email/:actcode/:hmac', function (req, res) {
// 	r.activate(res,null,req.params.email,req.params.actcode);
// });

server.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('API listening at http://%s:%s', host, port);
});
