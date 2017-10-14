var crypto = require('crypto');

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
            var tokenArray2 = tokenArray1[0].split('.');
            if (!tokenArray2 || tokenArray2.length !== 3) {
                this.error = "Invalid token(3)";
                return;
            }
            this.header = JSON.parse(Buffer.from(tokenArray2[0], 'base64'));
            this.payload = JSON.parse(Buffer.from(tokenArray2[1], 'base64'));
            this.string_signature = tokenArray2[2];
            const hash = crypto.createHmac('sha256', "signing key").update(tokenArray2[0] + '.' + tokenArray[1]);
            if (this.string_signature !== new Buffer(hash, 'base64').toString('ascii')) {
                this.error = "Invalid signature in token";
                return;
            }
        }

        if (!this.header || !this.header.alg || this.header.als !== "HSA256") {
            this.error = "Invalid algorithm in token header";
            return;
        }

        if (!this.header.exp) {
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
        this.header = {alg: "HSA256"};
        this.payload = {
            username: token_or_employeeRecord.username,
            iss: "issuer",
            exp: new Date(),
            atIssued: new Date(),
            roles: token_or_employeeRecord.roles
        };
    }
}

JWTToken.prototype.getToken = function () {
    "use strict";
    if(this.token) return this.token;
    this.payload.atIssued = new Date();
    this.payload.exp = new Date(this.payload.atIssued);
    this.payload.exp.setMinutes(this.payload.exp.getMinutes());

    var string_header = new Buffer(this.header, 'base64').toString('ascii');
    var string_payload = new Buffer(this.payload, 'base64').toString('ascii');
    const hash = crypto.createHmac('sha256', "signing key").update(string_header + '.' + string_payload);
    var string_signature = Buffer(hash, 'base64').toString('ascii');

    return "Bearer " + string_header + "." + string_payload + "." + string_signature;
}

JWTToken.prototype.isValid = function () {
    return this.valid;
}
JWTToken.prototype.getError = function () {
    return this.error;
}

JWTToken.prototype.isInRole = function (role) {
    return (this.valid && payload && payload.roles && payload.roles.indexOf(role) > -1);
}

module.exports = JWTToken;
