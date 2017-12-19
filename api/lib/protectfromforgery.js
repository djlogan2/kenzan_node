var secureRandom = require('secure-random'),
    crypto = require('crypto');

function protectFromForgery(req, res, next) {
    "use strict";
    /*
     * Step 1: Since we have just arrived, check the previous token if we have any method other than get
     */
    if (req.method !== 'GET' && !req.body.authenticity_token) {
        throw new Error('Invalid CSRF token');
    }

    if (req.body.authenticity_token) {
        console.log('Checking authenticity with action=' + req.originalUrl);
        var real_csrf = req.session.csrf_token;

        if (req.method !== 'GET')
            real_csrf = Array.from(crypto.createHmac('sha256', Buffer.from(req.session.csrf_token).toString('base64')).update(req.originalUrl + '#' + req.method.toLowerCase()).digest());

        var obtained_csrf = Buffer.from(req.body.authenticity_token, 'base64');
        if (obtained_csrf.length != 64)
            throw new Error('Invalid CSRF token');

        for (var x = 0; x < 32; x++)
            if (real_csrf[x] !== (obtained_csrf[x] ^ obtained_csrf[32 + x]))
                throw new Error('Invalid CSRF token');
        delete req.body.authenticity_token; // Delete this token to save the actual controller from having to wonder what it is
    }

    /*
     * Step 2: Create a new token for the remainder of the server to use
     */

    if (!req.session.have_current_csrf) {
        req.session.csrf_token = secureRandom.randomArray(32);
        console.log('Changed csrf token in session to ' + req.session.csrf_token.toString());
    }
    res.locals.csrf_token = req.session.csrf_token;
    res.locals.originalUrl = req.originalUrl;
    res.locals.req = req;

    next();
}

module.exports = function (app, hbs) {
    app.use(protectFromForgery);

    //
    // Step 3: Override handlebars _renderTemplate to insert the meta tags and the hidden field in a form.
    //    If you look through this code, you will notice that it currently only supports a single form in
    //    the HTML. If there are multiple forms, 2nd and subsequent will fail the above check, due to this
    //    code not adding the hidden field to their post data.
    //
    var _myrenderTemplate = hbs._renderTemplate;
    hbs._renderTemplate = function (template, context, options) {
        "use strict";
        var text = template(context, options);
        var csrf_form_data = null;
        var calculated_csrf = null;
        var csrfToken = function () {
            if (calculated_csrf) return calculated_csrf;
            console.log('     csrf          =' + context.csrf_token);
            console.log('     csrf_form_data=' + csrf_form_data);
            var csrf = context.csrf_token;
            if (csrf_form_data)
                csrf = Array.from(crypto.createHmac('sha256', Buffer.from(context.csrf_token).toString('base64')).update(csrf_form_data).digest());
            csrf = csrf.concat(secureRandom.randomArray(32));
            for (var x = 0; x < 32; x++)
                csrf[x] ^= csrf[x + 32];
            return (calculated_csrf = Buffer.from(csrf).toString('base64'));
        };

        if (text.indexOf('<html>') != -1) {
            var re_form = /<(form|FORM)/;
            var re_action = /action=['"]?(.*?)['"]?(\s+|>)/;
            var re_method = /method=['"]?(.*?)['"]?(\s+|>)/;
            var action = '';
            var method = 'get';
            if (re_form.exec(text)) {
                var arr = re_action.exec(text);
                if (arr && arr.length) action = arr[1];

                arr = re_method.exec(text);
                if (arr && arr.length) method = arr[1].toLowerCase();
                console.log('Setting csrf action to "' + (action || context.originalUrl) + '"');
                csrf_form_data = (action || context.originalUrl) + '#' + method;
            }

            //text = text.replace(/({{#form .*?}})/gi, "$1\n<input type=hidden name=authenticity_token id=authenticity_token value={{insert-csrf-token-here}}>");
            text = text.replace(/(<form .*?>)/gi, "$1\n<input type=hidden name=authenticity_token id=authenticity_token value='" + csrfToken() + "'>");
            text = text.replace("<head>", "<head>\n<meta name='csrf-param' content='authenticity_token'/>\n<meta name='csrf-token' content='" + csrfToken() + "'>");
            text = text.replace("<head>", "<head>\n<meta name='dev-test-form' content='" + csrf_form_data + "'>");
            text = text.replace("<head>", "<head>\n<meta name='dev-test-csrf' content='" + context.csrf_token.toString() + "'>");
            return _myrenderTemplate.call(hbs, function () {
                return text;
            }, context, options);
        }
        else
            return _myrenderTemplate.call(hbs, template, context, options);
    };
};