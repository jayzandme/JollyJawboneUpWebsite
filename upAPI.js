var https = require('https');

// For OAuth 
var client_id = 'bbtI3tvNMBs';
var redirect_uri = encodeURIComponent('https://localhost:5000/token');
var client_secret = '5734ad41f828bc7a6196342d2640cca3c3cb9193';
// This return the url for getting the tokenn
getCode = function() {

   var options = {
        host: 'jawbone.com',
        path: '/auth/oauth2/auth?response_type=code&client_id=' + client_id + 
              '&scope=basic_read%20sleep_read&redirect_uri=' + redirect_uri
    }

    return (options.host + options.path)
}

getToken = function(code) {

    var options = {
        host: 'jawbone.com',
        path: '/auth/oauth2/token?client_id=' + client_id +
              '&grant_type=authorization_code&client_secret=' + client_secret + 
              '&code=' + code,
        headers: {'Authorization': "Bearer " + code}
    }

    https.request(options, function(response) {

        var body = '';

        response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {
            parsedJSON = JSON.parse(body);
            console.log(parsedJSON.access_token);
            return body.access_token
        });
    }).end();

}

getSleeps = function(token) {

}

module.exports.getToken = getToken
module.exports.getCode = getCode;
