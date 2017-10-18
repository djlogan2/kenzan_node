var crypto = require('crypto');

var ISSUER = 'Kenzan';
var EXPIRE_MINUTES = 60;
var SIGNING_KEY = 'Kenzan Signing Key';

function JWTToken(token_or_employeeRecord) {
    "use strict";
    if (typeof token_or_employeeRecord === 'string') {
        this.valid = false;
        this.token = token_or_employeeRecord;
        var tokenArray1 = token_or_employeeRecord.split(' ');
        if (!tokenArray1 || tokenArray1.length === 0 || tokenArray1.length > 2) {
            this.error = "Invalid token(1)";
            return;
        }
        //
        // We allow the user to return "Bearer <token>" or just "<token>"
        // But if it's "<anything><space><anything>", it must obviously
        // begin with "Bearer".
        //
        if (tokenArray1.length === 2) {
            if (tokenArray1[0] !== "Bearer") {
                this.error = "Invalid token(2)";
                return;
            }
            tokenArray1[0] = tokenArray1[1];
        }

        var tokenArray2 = tokenArray1[0].split('.');
        if (!tokenArray2 || tokenArray2.length !== 3) {
            this.error = "Invalid token(3)";
            return;
        }

        this.header = JSON.parse(Buffer.from(tokenArray2[0], 'base64'));
        this.payload = JSON.parse(Buffer.from(tokenArray2[1], 'base64'));
        this.string_signature = tokenArray2[2];

        this.payload.exp = new Date(this.payload.exp);
        this.payload.atIssued = new Date(this.payload.atIssued);

        const calculated_signature = crypto.createHmac('sha256', this.test_signing_key || SIGNING_KEY).update(tokenArray2[0] + '.' + tokenArray2[1]).digest();
        if (this.string_signature !== Buffer.from(calculated_signature).toString('base64')) {
            this.error = "Invalid signature in token";
            return;
        }

        if (!this.header || !this.header.alg || this.header.alg !== "HS256") {
            this.error = "Invalid algorithm in token header";
            return;
        }

        if (!this.payload.exp) {
            this.error = "Missing expiration in token payload";
            return;
        }

        if ((new Date()).getTime() > this.payload.exp.getTime()) {
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
    this.payload.atIssued = (this.test_atIssued || new Date());
    this.payload.exp = (this.test_exp || new Date(this.payload.atIssued));
    if(!this.test_exp)
        this.payload.exp.setMinutes(this.payload.exp.getMinutes() + EXPIRE_MINUTES);
    return this.internalGetToken();
};

JWTToken.prototype.internalGetToken = function() {
    "use strict";
    var string_header = Buffer.from(JSON.stringify(this.header)).toString('base64');
    var string_payload = Buffer.from(JSON.stringify(this.payload)).toString('base64');
    const binary_signature = crypto.createHmac('sha256', this.test_signing_key || SIGNING_KEY).update(string_header + '.' + string_payload).digest();
    var string_signature = Buffer.from(binary_signature).toString('base64');

    return "Bearer " + string_header + "." + string_payload + "." + string_signature;

}

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
