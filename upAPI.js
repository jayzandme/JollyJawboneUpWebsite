var http = require('http');

// For OAuth 
var client_id = 'bbtI3tvNMBs';
var redirect_uri = encodeURIComponent('https://localhost:5000/token');

// This return the url for getting the tokenn
getToken = function() {

   var options = {
        host: 'jawbone.com',
        path: '/auth/oauth2/auth?response_type=code&client_id=' + client_id + 
              '&scope=basic_read%20sleep_read&redirect_uri=' + redirect_uri
    }

    return (options.host + options.path)
}

module.exports.getToken = getToken;
