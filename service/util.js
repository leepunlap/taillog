var hexy = require("hexy")
var crc = require('crc')

//
//	Binary Debug Dump Format
//
var format = {}
format.width = 16 // how many bytes per line, default 16
format.numbering = "none" // ["hex_bytes" | "none"],  default "hex_bytes"
format.format = "twos" // ["fours"|"twos"|"none"], how many nibbles per group, default "fours"
format.caps = "upper" // ["lower"|"upper"],       default lower
format.annotate = "ascii" // ["ascii"|"none"], ascii annotation at end of line? default "ascii"
format.prefix = "> " // <string> something pretty to put in front of each line default ""
format.indent = 2 // <num> number of spaces to indent default 0
format.html = false // funky html divs 'n stuff! experimental. default: false

var simpleformat = {}
format.width = 16
format.numbering = "none"
format.caps = "upper"
format.annotate = "none"
format.indent = 0

//
//	Bunary Dump Util
//
exports.getBinary = function(prefix, buf) {
	format.prefix = prefix + " > "
	return hexy.hexy(buf, format)
}

exports.printBinary = function(prefix, buf) {
	format.prefix = prefix + " > "
	str = hexy.hexy(buf, format)
	console.log(str)
}

exports.toHex = function(buf) {
	return hexy.hexy(buf,simpleformat)
}

exports.txtIntAndHexVal = function(v) {
	hexval = v.toString(16).toUpperCase();
	return v + " (" + hexval + ")";
}

//
//	Random Sequence Generator
//
exports.getRandomSeq = function() {
	return Math.floor(Math.random() * 65536)
}

exports.makeCRC = function(buf) {
	var crcchunk = buf.slice(0, buf.length - 2)
	var crc16check = crc.crc16ccitt(crcchunk, 0x0000)
	return crc16check
}

exports.makeError = function(res,msg) {
	res.json({"code" : 100, "status" : msg});
}

exports.makeErrorObj = function(res,obj) {
	res.json({"code" : 300, "errmsg" : obj});
}

exports.makeResult = function(res,obj) {
	res.json({"code" : 200, "result" : obj});
}
