// app.get('/testserial', function (req, res) {

// 	var buf = toshiba.setTemperature(23);

// 	util.printBinary("SEND", buf)

// 	c.send(buf,function(retmsg) {
// 		var decodedPacket = toshiba.decode(retmsg);
// 		var retHTML = "<h3>Sent:</h3>";
// 		retHTML += "<pre>";
// 		retHTML += util.getBinary("SEND", buf);
// 		retHTML += "</pre>";
// 		retHTML += "<h3>Received:</h3>";
// 		retHTML += "<pre>";
// 		retHTML += util.getBinary("RECV", retmsg);
// 		retHTML += "</pre>";
// 		retHTML += "<h3>Decoded packet:</h3>";
// 		retHTML += "<pre>";
// 		retHTML += JSON.stringify(decodedPacket, null, 2);
// 		retHTML += "</pre>";
// 		res.send(retHTML);
// 	})
// });




exports.decode = function (buf) {
	var retObj = {}
	retObj.command = buf.readUInt8(2)
	retObj.temp = buf.readUInt8(3)
	return retObj;
};

exports.setTemperature = function(temp) {
	var buf = new Buffer(4)
	buf[0] = 0x55
	buf[1] = 0xAA
	buf[2] = 0x02 // command for set temp
	buf[3] = 0x18 // 22C
	return(buf);
}


