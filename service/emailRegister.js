var mysql 	= require('mysql');
var Q   	= require('q');
var util	= require('./util.js');
var https 	= require('https');
var parseString = require('xml2js').parseString;

var appliancegroup = "Default";
var devicegroup = "Premium";
var sponsordevicegroup = "Premium";

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : '10.254.8.112',
    user     : 'radius',
    password : 'tLM7CGk6',
    database : 'radius',
    debug    :  false
});

// var pool      =    mysql.createPool({
//     connectionLimit : 100, //important
//     host     : 'localhost',
//     user     : 'root',
//     password : '',
//     database : 'radius',
//     debug    :  false
// });

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
//var transporter = nodemailer.createTransport({
//    service: 'gmail',
//    auth: {
//        user: 'bernard.p.lee@gmail.com',
//        pass: '2qwerty,'
//    }
//});

var transporter = nodemailer.createTransport(smtpTransport({
    host: 'cluster4out.us.messagelabs.com',
    port: 25,
    debug: true
}));

exports.requestAccess = function(res,s,email,mac,ip) {
	pool.getConnection(function(err,connection){
		if (err) {
			console.log("Database Connection Error");
			console.log(err);
			if (s) s.emit("progress","Database Connection Error");
			util.makeError(res,"Database Connection Error - " + err.syscall + " : " + err.code);
			return;
		}   

		var sql = "call activate_request('"+email+"','"+mac+"','"+ip+"')";

		//console.log("ID:"+connection.threadId+", SQL="+sql);

		connection.query(sql,function(err,rows){
			connection.release();
			if(!err) {
				var r = rows[0][0];
				console.log(r);

				if (s) s.emit("progress",r.errmsg);

				if (r.status == 1) {
					var url = "http://10.97.254.111:3000/?email="+r.email+"&activationcode="+r.activation_code;
					var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
					html += '<html xmlns="http://www.w3.org/1999/xhtml">';
					html += '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>WIFI</title></head>';
					html += '<body style="background-color: #cccccc;">';
					html += '<table width="600" border="0" cellpadding="0" cellspacing="0" style="font-family: arial, helvetica, sans-serif; font-size: 15px; color: #ffffff; background-color: #ffffff;" align="center"><tbody>';

					html += '<tr><td bgcolor="f0e8e3"><img alt="" src="http://www.galaxymacau.com/images/logo.png?v=4" height="100" style="margin: 0px; display: block; border-width: 0px; border-style: solid;background-color:#fff;margin-left:10px;" /></td></tr>';

					html += '<tr><td align="center" bgcolor="#9c7542" height="33"><font size="1">Welcome to Galaxy Macau&trade; WiFi.</font></td></tr>';

					html += '<tr><td style="padding:20px;"><font color="333333">Dear Guest,<br /><br /> Thank you for registering with Galaxy Macau&trade; WiFi. To activate your 7-DAY HIGH SPEED WiFi, please press "ACTIVATE" below.</font></td></tr>';

					html += '<tr><td><table border="0" cellpadding="15" cellspacing="20" width="200"><tr><td align="center" bgcolor="#46797c"><a href="'+url+'"><font size="4" color="#FFFFFF">Activate</font></a></td></tr></table></td></tr>';

					html += '</tr><tr><td style="padding:20px;"><font color="333333">We wish you a pleasant stay at Galaxy Macau™.<br /><br />Best Regards,<br /> <br />Galaxy Macau Customer Support<br /> <a href="http://www.galaxymacau.com">http://www.galaxymacau.com</a></font></td></tr>';

					html += '<tr><td style="padding:20px;"><font color="333333">亲爱的宾客：<br /><br /> 感谢您登记使用「澳門銀河&trade;」WiFi。请点击以下链接激活七日免费高速WiFi网络。</font></td></tr><tr><td><table border="0" cellpadding="15" cellspacing="20" width="200"><tr><td align="center" bgcolor="#46797c"><a href="'+url+'"><font size="4" color="#FFFFFF">激活</font></a></td></tr></table></td></tr>';

					html += '</tr><tr><td style="padding:20px;"><font color="333333">我们希望您有一个愉快的入住体验。<br /><br />谢谢！<br /><br /> 「澳門銀河」客户服务部敬上<br /> <a href="http://www.galaxymacau.com">http://www.galaxymacau.com</a></font></td></tr>';

					html += '<tr><td style="padding:20px;"><font color="333333">親愛的賓客：<br /><br /> 感謝您登記使用「澳門銀河™」WiFi。請點擊以下鏈接啟動七日免費高速WiFi網絡。</font></td></tr><tr><td><table border="0" cellpadding="15" cellspacing="20" width="200"><tr><td align="center" bgcolor="#46797c"><a href="'+url+'"><font size="4" color="#FFFFFF">啟動</font></a></td></tr></table></td></tr>';

					html += '</tr><tr><td style="padding:20px;"><font color="333333">我們希望您有一個愉快的入住體驗。<br /><br />謝謝！<br /><br /> 「澳門銀河」客戶服務部敬上<br /> <a href="http://www.galaxymacau.com">http://www.galaxymacau.com</a></font></td></tr>';

					html += '</tbody></table><h1>&nbsp;</h1></body></html>';

					console.log("SMTP Start");
					transporter.sendMail({
					    from: 'no-reply@galaxymacau.com',
					    to: r.email,
					    subject: 'Galaxy Macau WiFi - "UPGRADE LINK"',
					    text: 'Click to get VIP WiFi access',
					    html: html
					}, function(error, response){
					   if(error){
					   		console.log("SMTP Error");
					       console.log(error);
					   }else{
					   		console.log("SMTP Success");
					       console.log("Message sent: " + response.message);
					   }
					});
					console.log("SMTP Finish");
				}

				util.makeResult(res,r);
			} else {
				if (s) s.emit("progress","Database Connection Error");
				util.makeErrorObj(res,err);
			}     
		});

	});
}

exports.activate = function(res,s,email,actcode) {
	pool.getConnection(function(err,connection){
		if (err) {
			console.log("Database Connection Error");
			console.log(err);
			if (s) s.emit("progress","Database Connection Error");
			util.makeError(res,"Database Connection Error - " + err.syscall + " : " + err.code);
			return;
		}   

		var sql = "call activate('"+email+"','"+actcode+"')";

		//console.log("ID:"+connection.threadId+", SQL="+sql);

		connection.query(sql,function(err,rows){
			connection.release();
			if(!err) {
				var r = rows[0][0];
				console.log(r);
				if (s) s.emit("progress",r.errmsg);


				if (r.status == 1 || r.status == 4) {

					var username = r.email.replace(/[^a-z0-9-_]/ig,'');

					setTimeout(function() {
						var path = '/axis/services/NACWebService/saveRegisteredUser?propString=applianceGroup='+appliancegroup+',displayName='+r.email+',lastName=,firstName=,emailAddress='+r.email+',expiresTime=,userTypeStr=Guest,userName='+username+'&requestingUser=root';

						var path2 = '/axis/services/NACWebService/saveRegisteredDevice?propString=applianceGroup='+appliancegroup+',description=RegisteredThroughEmail,deviceGroup='+devicegroup+',macAddress='+r.mac+',sponsorDeviceGroup='+sponsordevicegroup+',stateStr=Approved,userName='+username+',AUTHENTICATED=true&requestingUser=root';

						// var path3 = '/axis/services/NACWebService/addMACToEndSystemGroup?endSystemGroup=Premium&macAddress='+r.mac+'&description=EIS&reauthenticate=true&removeFromOtherGroups=true';

						// exports.doAPICall (path3, function(ret) {
						// 	console.log("=== CALL RETURN")
							
						// 	parseString(ret, function (err, result) {
						// 	    var retcode = result['ns:addMACToEndSystemGroupResponse']['ns:return'][0];
						// 	    if (retcode == 0) {
						// 	    	if (s) s.emit("progress","addMACToEndSystemGroup() OK");
						// 	    } else {
						// 	    	if (s) s.emit("progress","saveRegisteredUser() error " + retcode);
						// 	    }
						// 	});
						// })

						console.log("=== CALL ONE START")
						console.log(path);
						console.log(path2);
						exports.doAPICall (path, function(ret) {

							console.log("=== CALL ONE RETURN")
							
							parseString(ret, function (err, result) {
							    var retcode = result['ns:saveRegisteredUserResponse']['ns:return'][0];
							    if (retcode == 0) {
							    	console.log("=== saveRegisteredUser() OK")
							    	if (s) s.emit("progress","saveRegisteredUser() OK");
							    	setTimeout(function() {
								    	exports.doAPICall (path2, function(ret2) {
								    		parseString(ret2, function (err2, result2) {
									    		var retcode2 = result2['ns:saveRegisteredDeviceResponse']['ns:return'][0];
											    if (retcode2 == 0) {
											    	console.log("=== saveRegisteredDevice() OK")
											    	if (s) s.emit("progress","activated");
											    } else {
											    	console.log("=== saveRegisteredDevice() ERROR " + retcode2)
											    	if (s) s.emit("progress","saveRegisteredDevice() error " + retcode2);
											    }
											});
								    	});
								    },200);
							    } else {
							    	console.log("=== saveRegisteredUser() ERROR " + retcode)
							    	if (s) s.emit("progress","saveRegisteredUser() error " + retcode);
							    }
							});
						})
					},200);
				}
				util.makeResult(res,r);
			} else {
				if (s) s.emit("progress","Database Connection Error");
				util.makeErrorObj(res,err);
			}     
		});

	});
}



exports.doAPICall = function (path, callback) {
	var username = 'root';
	var password = 'Abcd1234';
	var host = '10.254.8.131';
	var port = '8443';
	var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	var options = {
		host: host,
		port: 8443,
		path: path,
		//auth: username + ':' + password,
		headers: {
			'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
		}     
	};

    return https.get(options, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
        	callback(body);
            // Data reception is done, do whatever with it!
            // var parsed = JSON.parse(body);
            // callback({
            //     email: parsed.email,
            //     password: parsed.pass
            // });
        });
    }).on('error', function(err) {
        console.error('Error with the request:', err.message);
        callback(err);
    });

};
