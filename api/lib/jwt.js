var crypto = require('crypto');
var errorCode = require('./errorcode');

var ISSUER = 'Kenzan';
var EXPIRE_MINUTES = 60;
var SIGNING_KEY = 'Kenzan Signing Key';

function JWTToken(token_or_employeeRecord) {
    "use strict";
    if (typeof token_or_employeeRecord === 'string') {
        this.valid = false;
        this.token = token_or_employeeRecord;
        var tokenArray1 = token_or_employeeRecord.split(' ');
        if (!tokenArray1 || tokenArray1.length !== 2) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR;
            this.error = "Invalid token - No prefix";
            return;
        }

        if (tokenArray1[0] !== "Bearer") {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR;
            this.error = "Invalid token - no 'Bearer'";
            return;
        }

        var tokenArray2 = tokenArray1[1].split('.');
        if (!tokenArray2 || tokenArray2.length !== 3) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR;
            this.error = "Invalid token - Not three pieces";
            return;
        }

        this.header = JSON.parse(Buffer.from(tokenArray2[0], 'base64'));
        this.payload = JSON.parse(Buffer.from(tokenArray2[1], 'base64'));
        this.string_signature = tokenArray2[2];

        if(!this.header || !this.payload || !this.string_signature || typeof this.header !== 'object' || typeof this.payload !== 'object') {
            this.error = "Missing expiration in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_PARSE_ERROR;
            return;
        }

        if (!this.payload.exp) {
            this.error = "Missing expiration in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_EXPIRATION;
            return;
        }

        if (!this.payload.atIssued) {
            this.error = "Missing issued in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUED;
            return;
        }

        this.payload.exp = new LocalDate(this.payload.exp);
        this.payload.atIssued = new LocalDate(this.payload.atIssued);

        if(Object.prototype.toString.call(this.payload.atIssued) !== '[object Date]' || isNaN(this.payload.atIssued.getTime())) {
            this.error = "Invalid issue date in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED;
            return;
        }

        if(Object.prototype.toString.call(this.payload.exp) !== '[object Date]' || isNaN(this.payload.exp.getTime())) {
            this.error = "Invalid expiration date in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_EXPIRATION;
            return;
        }

        const calculated_signature = crypto.createHmac('sha256', this.test_signing_key || SIGNING_KEY).update(tokenArray2[0] + '.' + tokenArray2[1]).digest();

        if (this.string_signature !== Buffer.from(calculated_signature).toString('base64')) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_INVALID_SIGNATURE;
            this.error = "Invalid signature in token";
            return;
        }

        if (!this.header || !this.header.alg || this.header.alg !== "HS256") {
            this.error = "Invalid algorithm in token header";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_HEADER_INVALID_ALGORITHM;
            return;
        }

        if(!this.payload.iss) {
            this.error = "Missing issuer in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_NO_ISSUER;
            return;
        }

        if(this.payload.iss !== ISSUER) {
            this.error = "Invalid issuer in token payload";
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUER;
            return;
        }

        if(this.payload.exp.getTime() <= this.payload.atIssued.getTime()) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED;
            this.error = "Token has expired";
            return;
        }

        if((new Date()).getTime() <= this.payload.atIssued.getTime()) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_PAYLOAD_INVALID_ISSUED;
            this.error = "Token has expired";
            return;
        }

        if ((new Date()).getTime() > this.payload.exp.getTime()) {
            this.errorcode = errorCode.INVALID_AUTHORIZATION_TOKEN_EXPIRED;
            this.error = "Token has expired";
            return;
        }

        this.valid = true;
    }
    else // It's an employee record, so we need to create a new token
    {
        this.header = {alg: "HS256"};
        this.payload = {
            username: token_or_employeeRecord.username,
            iss: ISSUER,
            roles: token_or_employeeRecord.roles
        };
    }
}

JWTToken.prototype.getToken = function () {
    "use strict";
    if(this.token) return this.token;
    // noinspection Annotator
    this.payload.atIssued = new Date();
    //
    // Add this if you're having trouble in your test framework around slightly different
    // times causing your server and unit tests to fail incorrectly with "INVALID_ISSUED"
    //
    this.payload.atIssued.setMinutes(this.payload.atIssued.getMinutes() - 1, 0, 0);
    // **********************************************************************************
    this.payload.exp = new Date(this.payload.atIssued);
    this.payload.exp.setMinutes(this.payload.exp.getMinutes() + EXPIRE_MINUTES);
    return this.internalGetToken();
};

/*
  I split this up into a second routine so that the unit tests could create various invalid
  issue and expiration date conditions. This should never be called directly in a production setting.
 */
JWTToken.prototype.internalGetToken = function() {
    "use strict";
    var string_header = Buffer.from(JSON.stringify(this.header)).toString('base64');
    var string_payload = Buffer.from(JSON.stringify(this.payload)).toString('base64');
    const binary_signature = crypto.createHmac('sha256', this.test_signing_key || SIGNING_KEY).update(string_header + '.' + string_payload).digest();
    var string_signature = Buffer.from(binary_signature).toString('base64');

    return "Bearer " + string_header + "." + string_payload + "." + string_signature;

};

JWTToken.prototype.isValid = function () {
    return this.valid;
};

JWTToken.prototype.getError = function () {
    return this.error;
};

JWTToken.prototype.isInRole = function (role) {
    return (this.valid && this.payload && this.payload.roles && this.payload.roles.indexOf(role) > -1);
};

module.exports = JWTToken;
