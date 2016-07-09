var util = require('../util.js');
var crc = require('crc');

exports.decode = function (buf) {

	var bytePos = 0
	var pkt_len = buf.readUInt8(2)
	var fr_addr = buf.readUInt8(3)
	var to_addr = buf.readUInt8(4)
	var opcode = buf.readUInt8(5)
	var start_byte = buf.readUInt16BE(0).toString(16)
	var retObj = {}
	var msgtype = 'none'
	var opcodedesc = 'none'

	if (fr_addr == 0) {
		msgtype = 'request'
	} else if (to_addr == 0 || to_addr == 1) {
		msgtype = 'reply'
		
	} else {
		msgtype = 'peer'
	}

	retObj.pkt_len = util.txtIntAndHexVal(pkt_len);
	retObj.fr_addr = util.txtIntAndHexVal(fr_addr);
	retObj.to_addr = util.txtIntAndHexVal(to_addr);
	retObj.opcode = util.txtIntAndHexVal(opcode);

	switch (opcode) {
		case 0x00:
			retObj.opcodedesc = "Read Module Info"
			retObj.devicetype = util.getModuleType(buf.readUInt8(6))
			retObj.extdevicetype = buf.readUInt8(7)
			retObj.sw_version = buf.readUInt16LE(8)
			retObj.hw_version = buf.readUInt8(10)
			retObj.serial_no = buf.readUInt32LE(12).toString(16)
			bytePos = 16
			break
		case 0x02:
			retObj.opcodedesc = "Read Scenes"
			retObj.scene = buf.readUInt16LE(6)
			retObj.followscene = buf.readUInt16LE(8)
			retObj.followtime = buf.readUInt16LE(10)
			retObj.protoversion = buf.readUInt16LE(12)
			bytePos = 10
			break
		case 0x03:
			retObj.opcodedesc = "Read Module Status"
			retObj.sourceAddr = buf.readUInt8(4)
			retObj.toAddr = buf.readUInt8(5)
			retObj.devicetype = buf.readUInt8(6)
			retObj.extdevicetype = buf.readUInt8(7)
			retObj.temperature1 = buf.readUInt8(8)
			retObj.temperature2 = buf.readUInt8(9)
			retObj.flag = buf.readUInt8(10)
			bytePos = 11
			break
		case 0x10:
			retObj.opcodedesc = "Module Setup Data"
			break
		case 0x0f:
			retObj.opcodedesc = "Setup Module ID"
			break
		case 0x92:
			retObj.opcodedesc = "On Off Status"
			retObj.onoff_state = buf.readUInt16LE(6)
			retObj.onoff_state_bitmask = util.getBitMask(buf.readUInt16LE(6))
			retObj.onoff_state_val = util.parseBitMask(retObj.onoff_state)
			bytePos = 8;
			break
		case 0x1c:
			retObj.opcodedesc = "Direct Control"
			retObj.action = buf.readUInt8(6) + " (" + exports.getDirectControlAction(buf.readUInt8(6)) + ")";
			retObj.channel = buf.readUInt8(7)
			retObj.onoff = buf.readUInt8(8) + " (" +exports.getOnOffDesc(buf.readUInt8(8)) + ")";
			bytePos = 10;
			break
		default:
			retObj.opcodedesc = "unknown"
			break
	}

	var crc16 = buf.readUInt16BE(bytePos + 2).toString(16)
	var crcchunk = buf.slice(0, buf.length - 2)
	var crc16check = crc.crc16ccitt(crcchunk, 0x0000).toString(16)
	if (crc16check == crc16) {
		retObj.crc_ok = "yes"
	} else {
		retObj.crc_ok = "no"
	}

	return retObj
}

exports.getModuleType = function(modtype) {
	if (modtype == 0x00) {
		return "0x00 - Gateway";
	}
	if (modtype == 0x01) {
		return "0x01 - Dimmer Module";
	}
	if (modtype == 0x02) {
		return "0x02 - Relay Module";
	}
	if (modtype == 0x06) {
		return "0x06 - Power Meter Module";
	}
	if (modtype == 0x0a) {
		return "0x0a - DIO Module";
	}
	return modtype + " - Unknown";
}

exports.getDirectControlAction = function(action) {
	if (action == 3) {
		return "onoff"
	} else if (action == 1) {
		return "toggle"
	} else {
		return "unknown"
	}
}

exports.getOnOffDesc = function(onoff) {
	if (onoff == 0) {
		return "off"
	} else if (onoff == 1) {
		return "on"
	} else {
		return "unknown"
	}
}

exports.directcontrol = function(id, channel, cmd) {
	var action = 3
	var onoff = 3
	if (cmd === 'toggle') {
		action = 1
	} else if (cmd === "on") {
		onoff = 1
	} else if (cmd === "off") {
		onoff = 0
	}
	var buf = new Buffer(14)
	buf[0] = 0x55
	buf[1] = 0xAA
	buf[2] = 0x0B
	buf[3] = 0x00
	buf[4] = id
	buf[5] = 0x1C
	buf[6] = action
	buf[7] = channel
	buf[8] = onoff
	buf[9] = 0x00
	var seqno = util.getRandomSeq()
	buf.writeUInt16BE(seqno, 10)
	var crc16 = util.makeCRC(buf)
	buf.writeUInt16BE(crc16, 12)
	return(buf);
}