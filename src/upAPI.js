var https = require('https');
var queries = require('./queries.js');
var url = require('url');
var querystring = require('querystring');

// For OAuth 
var client_id = 'bbtI3tvNMBs';
var redirect_uri = encodeURIComponent('https://localhost:5000/token');
var client_secret = '5734ad41f828bc7a6196342d2640cca3c3cb9193';

// for printing purposes
var sleepCount = 1;
var movesCount = 1;

// This return the url for getting the tokenn
getCode = function() {

   var options = {
        host: 'jawbone.com',
        path: '/auth/oauth2/auth?response_type=code&client_id=' + client_id + 
              '&scope=basic_read' + 
              '%20sleep_read' + 
              '%20move_read' +
              '%20workout_read' +
              '%20friends_read&' +
              'redirect_uri=' + redirect_uri
    }

    return (options.host + options.path)
}

// gets a token for the user session
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

// gets all of the users sleeps since they last logged on
updateSleeps = function(token, callback) {

    var time;

    queries.getLatestSleep(0, function(lastSleep) {
        if (lastSleep === null) {
            time = 0;
        }
        else {
            time = lastSleep.time_completed;
        }
        getSleeps(token, time, callback);
    });
        
}

// gets all of the users sleeps since a time
getSleeps = function(token, time, callback) {

    sleepCount = 0;
    time++;
    
    var options = {
        host: 'jawbone.com',
        path: '/nudge/api/v.1.1/users/@me/sleeps?start_time=' + time,
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
                sleepCount++;
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

// gets a page of the users sleeps
getSleepsPage = function(token, page, callback) {

    parsedURL = url.parse(page);
    query = querystring.parse(parsedURL.query);
    query.limit = 100;
    parsedURL.search = querystring.stringify(query);
    page = url.format(parsedURL);

    console.log('getting sleeps page ' + sleepCount + '...');
    var options = {
        host: 'jawbone.com',
        path: page,
        headers: {'Authorization': 'Bearer ' + token}
    };

    https.request(options, function(response){
        
        var body = '';

        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function(){
            var parsedjson = JSON.parse(body).data;

            if (parsedjson.links && parsedjson.links.next) {
                sleepCount++;
                getSleepsPage(token, parsedjson.links.next, function(data){
                    callback(parsedjson.items.concat(data));
                });
            }
            else{
                callback(parsedjson.items);
            }
        });
    }).end();

}

// gets all of a users moves since they last logged on
updateMoves = function(token, callback) {

    var time;

    queries.getLatestMove(0, function(lastMove) {

        if (lastMove === null) {
            time = 0;
        }
        else {
            time = lastMove.time_completed;
        }
        getMoves(token, time, callback);
    });
        
}

// gets all of the users moves since a time
getMoves = function(token, time, callback) {

    movesCount = 0;
    time++;

	var options = {
		host: 'jawbone.com',
		path: '/nudge/api/v.1.1/users/@me/moves?start_time=' + time,
		headers: {'Authorization': 'Bearer ' + token}
	}

	https.request(options, function(response){

		var body = '';

		response.on('data', function(chunk){
			body += chunk;
		});

		response.on('end', function(){
            var parsedJSON = JSON.parse(body).data;
            if (parsedJSON.links && parsedJSON.links.next) {
                movesCount++;
                getMovesPage(token, parsedJSON.links.next, function(data) {
                    callback(parsedJSON.items.concat(data));
                });
            }
            else {
                callback(parsedJSON.items);
            }
		});
	}).end();
}

// gets a page of the users moves
getMovesPage = function(token, page, callback) {

    parsedURL = url.parse(page);
    query = querystring.parse(parsedURL.query);
    query.limit = 100;
    parsedURL.search = querystring.stringify(query);
    page = url.format(parsedURL);

    console.log('getting moves page ' + movesCount + '...');
    var options = {
        host: 'jawbone.com',
        path: page,
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
                movesCount++;
                getMovesPage(token, parsedJSON.links.next, function(data){
                    callback(parsedJSON.items.concat(data));
                });
            }
            else{
                callback(parsedJSON.items);
            }
        });
    }).end();


}

// gets all of a users workouts since they last logged on
updateWorkouts = function(token, callback) {

    var time;

    queries.getLatestWorkout(0, function(lastWorkout) {

        if (lastWorkout === null) {
            time = 0;
        }
        else {
            time = lastWorkout.time_completed;
        }
        getWorkouts(token, time, callback);
    });
        
}

// gets all of a users workouts since a time
getWorkouts = function(token, time, callback) {

    workoutsCount = 0;
    time++;

    var options = {
        host: 'jawbone.com',
        path: '/nudge/api/v.1.1/users/@me/workouts?start_time=' + time,
        headers: {'Authorization': 'Bearer ' + token}
    }

    https.request(options, function(response){

        var body = '';

        response.on('data', function(chunk){
            body += chunk;
        });

        response.on('end', function(){
            var parsedJSON = JSON.parse(body).data;
            if (parsedJSON.links && parsedJSON.links.next) {
                workoutsCount++;
                getWorkoutsPage(token, parsedJSON.links.next, function(data) {
                    callback(parsedJSON.items.concat(data));
                });
            }
            else {
                callback(parsedJSON.items);
            }
        });
    }).end();
}

// gets a page of a users workouts
getWorkoutsPage = function(token, page, callback) {

    parsedURL = url.parse(page);
    query = querystring.parse(parsedURL.query);
    query.limit = 100;
    parsedURL.search = querystring.stringify(query);
    page = url.format(parsedURL);

    console.log('getting workouts page ' + workoutsCount + '...');
    var options = {
        host: 'jawbone.com',
        path: page,
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
                workoutsCount++;
                getWorkoutsPage(token, parsedJSON.links.next, function(data){
                    callback(parsedJSON.items.concat(data));
                });
            }
            else{
                callback(parsedJSON.items);
            }
        });
    }).end();


}

// gets all of a users friends
getFriends = function(token, callback) {

    var options = {
        host: 'jawbone.com',
        path: '/nudge/api/v.1.1/users/@me/friends',
        headers: {'Authorization': 'Bearer ' + token,
                  'Accept': 'application/json'}
    };

    https.request(options, function(response) {

        var body = '';
    
        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function() {
            var parsedJSON = JSON.parse(body).data;
            callback(parsedJSON.items);
        });

    }).end();
}

// get user info
getUserInfo = function(token, callback) {

    var options = {
        host: 'jawbone.com',
        path: '/nudge/api/v.1.1/users/@me',
        headers: {'Authorization': 'Bearer ' + token,
                  'Accept': 'application/json'}
    };

    https.request(options, function(response) {

        var body = '';
        
        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function() {
            var parsedJSON = JSON.parse(body).data;
            callback(parsedJSON);
        });
    }).end();
}

module.exports.getToken = getToken;
module.exports.getCode = getCode;
module.exports.updateSleeps = updateSleeps;
module.exports.updateMoves = updateMoves;
module.exports.updateWorkouts = updateWorkouts;
module.exports.getFriends = getFriends;
module.exports.getUserInfo = getUserInfo;
