DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `activate`(IN email CHAR(45), code CHAR(45))
BEGIN
	SET @graceperiod = 15*60;
    
	SET @userid = NULL, @reqdate = NULL, @actdate = NULL, @mac = NULL;

	SELECT id, request_date, activation_date, mac_address FROM vip_userinfo u
	WHERE u.email = email and u.activation_code = code
	LIMIT 1
	INTO @userid, @reqdate, @actdate, @mac;

	IF @userid IS NULL THEN
		select 2 status, 'Invalid email or activation code' errmsg;
	ELSE
		set @timediff = TIME_TO_SEC(TIMEDIFF(NOW(),@reqdate));
        IF @timediff > @graceperiod THEN
			select 3 status, 'Activation code expired' errmsg;
        ELSE
			IF @actdate IS NULL THEN
				UPDATE vip_userinfo
				SET activation_date = NOW()
				WHERE id = @userid;
				select 1 status, 'Activation code valid' errmsg, email, @mac mac, @timediff timediff;
            ELSE
				select 4 status, 'Already activated' errmsg, email, @mac mac, @timediff timediff;
            END IF;
        END IF;
	END IF;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `activate_request`(IN email CHAR(45), mac CHAR(45), ip CHAR(45))
BEGIN    

	SET @userid = NULL, @request_date = NULL, @activation_code = NULL;
    
    SET @graceperiod = 7200;
    
	SELECT id, request_date, activation_code FROM vip_userinfo u
	WHERE u.email = email and u.mac_address = mac
	LIMIT 1
	INTO @userid, @request_date, @activation_code;
    
    IF @userid IS NULL THEN
		SET @activation_code = UUID();
		INSERT INTO vip_userinfo (email,mac_address,ip_address,activation_code,status,request_date,activation_date)
        VALUES (email,mac,ip,@activation_code,1,NOW(),NULL);
	ELSE
		SET @timediff = TIME_TO_SEC(TIMEDIFF(NOW(),@request_date));
        IF @timediff > @graceperiod THEN
			UPDATE vip_userinfo
			SET request_date = NOW(),
			activation_date = NULL
			WHERE id = @userid;        
        ELSE
			select 3 status, @timediff lastreq, 'Wait 2 hours between activation requests' errmsg;
        END IF;
    END IF;
    
    select 1 status, 'Activation email sent' errmsg, email email, @activation_code activation_code;
END$$
DELIMITER ;
