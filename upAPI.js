var https = require('https');
var queries = require('./queries.js');

// For OAuth 
var client_id = 'bbtI3tvNMBs';
var redirect_uri = encodeURIComponent('https://localhost:5000/token');
var client_secret = '5734ad41f828bc7a6196342d2640cca3c3cb9193';

// for printing purposes
var count = 1;

// This return the url for getting the tokenn
getCode = function() {

   var options = {
        host: 'jawbone.com',
        path: '/auth/oauth2/auth?response_type=code&client_id=' + client_id + 
              '&scope=basic_read%20sleep_read%20move_read&redirect_uri=' + redirect_uri
    }

    return (options.host + options.path)
}

getToken = function(code, callback) {

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
            callback(parsedJSON.access_token);
        });
    }).end();

}

updateSleeps = function(token, callback) {

    queries.getLatestSleep(1, function(lastTime) {
        
        getSleeps(token, lastTime, callback);
    });
        
}

getSleeps = function(token, time, callback) {

    count = 0;
    var options = {
        host: 'jawbone.com',
        path: '/nudge/api/v.1.1/users/@me/sleeps?updated_after=' + time,
        headers: {'Authorization': 'Bearer ' + token}
    }

    https.request(options, function(response) {

        var body = '';

        response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {
            var parsedJSON = JSON.parse(body).data;
            if (parsedJSON.links && parsedJSON.links.next) {
                count++;
                getSleepsPage(token, parsedJSON.links.next, function(data) {
                    callback(parsedJSON.items.concat(data));
                });
            }
            else {
                callback(parsedJSON.items);
            }
        });
    }).end();

}

getSleepsPage = function(token, url, callback) {

    url += "0";

    console.log('getting page ' + count + '...');
    var options = {
        host: 'jawbone.com',
        path: url,
        headers: {'Authorization': 'Bearer ' + token}
    };

    https.request(options, function(response){
        
        var body = '';

        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function(){
            var parsedJSON = JSON.parse(body).data;

            if (parsedJSON.links && parsedJSON.links.next) {
                count++;
                getSleepsPage(token, parsedJSON.links.next, function(data){
                    callback(parsedJSON.items.concat(data));
                });
            }
            else{
                callback(parsedJSON.items);
            }
        });
    }).end();

}

getMoves = function(code, callback) {

	var options = {
		host: 'jawbone.com',
		path: '/nudge/api/v.1.1/users/@me/moves',
		headers: {'Authorization': 'Bearer ' + code}
	}

	https.request(options, function(response){

		var body = '';

		response.on('data', function(chunk){
			body += chunk;
		});

		response.on('end', function(){
			callback(body);
		});
	}).end();
}

module.exports.getToken = getToken;
module.exports.getCode = getCode;
module.exports.getSleeps = getSleeps;
module.exports.updateSleeps = updateSleeps;
module.exports.getMoves = getMoves;
