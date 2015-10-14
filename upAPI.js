var http = require('http');

var jawboneAuth = {
    clientSecret: '5734ad41f828bc7a6196342d2640cca3c3cb9193',
    authorizationURL: 'https://jawbone.com/auth/oauth2/auth',
    tokenURL: 'https://jawbone.com/auth/oauth2/token',  
    callbackURL: 'https://localhost:5000/dashboard'  
}

var client_id = 'bbtI3tvNMBs';
var redirect_uri = 'https://localhost:5000/dashboard'; 

function getToken () {

    var options = {
        host: 'https://jawbone.com',
        path: '/auth/oauth2/auth?responsetype=code&client_id=' + client_id + 
              '&scope=basic_read%20sleep_read&redirect_uri=' + redirect_uri
    }

    console.log(options.path);
}

getToken()
