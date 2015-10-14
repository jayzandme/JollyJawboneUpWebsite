var express = require('express');
var https = require('https');
var passport = require('passport');
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');

var host = 'localhost'
var port = 5000;
var app = express()

app.use(bodyParser.json());
app.use(express.static(__dirname + '/css'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
//app.use('/jquery', express.static(__dirname + '/jquery'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(passport.initialize());

var jawboneAuth = {
	clientID: 'bbtI3tvNMBs',
	clientSecret: '5734ad41f828bc7a6196342d2640cca3c3cb9193',
	authorizationURL: 'https://jawbone.com/auth/oauth2/auth',
	tokenURL: 'https://jawbone.com/auth/oauth2/token',
	callbackURL: 'https://localhost:5000/dashboard'
};


app.get('/login/jawbone', 
	passport.authorize('jawbone', {
		scope: ['basic_read', 'sleep_read'],
		failureRedirect: '/'
	})
);

var testHold = {testingSleeps: null,
	testingMoves: null};

app.get('/dashboard',
	passport.authorize('jawbone', {
		scope: ['basic_read', 'sleep_read'],
		failureRedirect: '/'
	}), function(req, res) {
		//res.render('dashboard', req.account);
		res.render('dashboard', testHold)
	}
);

app.get('/', function(req, res) {
	console.log('got to homepage');
	res.render('index');
});

app.get('/levels', function(req, res){
	res.render('levels');
});

app.get('/achievements', function(req,res){
	res.render('achievements');
});

app.get('/teamPage', function(req, res){
	res.render('teamPage');
});

app.get('/weeklyChallenges', function(req,res){
	res.render('weeklyChallenges');
});

passport.use('jawbone', new JawboneStrategy({
	clientID: jawboneAuth.clientID,
	clientSecret: jawboneAuth.clientSecret,
	authorizationURL: jawboneAuth.authorizationURL,
	tokenURL: jawboneAuth.tokenURL,
	callbackURL: jawboneAuth.callbackURL
}, function(token, refreshToken, profile, done) {
	var options = {
		access_token: token,
		client_id: jawboneAuth.clientID,
		client_secret: jawboneAuth.clientSecret
	},
	up = require('jawbone-up')(options);
	console.log("hello1");

	var jawboneData;

	up.sleeps.get({}, function(err, body) {
		if (err) {
			console.log('Error recieving Jawbone UP  sleep data');
		} 
		else {
			var jawboneData = JSON.parse(body).data;
			/*for (var i = 0; i < jawboneData.items.length; i++) {
				var date = jawboneData.items[i].date.toString(),
					year = date.slice(0,4),
					month = date.slice(4,6),
					day = date.slice(6,8),
					timeCreated = jawboneData.items[i].time_created,
					timeCompleted = jawboneData.items[i].time_completed,
					timeCreatedDate,
					timeCompletedDate,
					timeCreatedFixed,
					timeCompletedFixed;


				timeCreatedDate = new Date(timeCreated * 1000); // The 0 there is the key, which sets the date to the epochc
				timeCompletedDate = new Date(timeCompleted * 1000);
				timeCreatedFixed = getClockTime(timeCreatedDate);
				timeCompletedFixed = getClockTime(timeCompletedDate);

				jawboneData.items[i].date = month + '/' + day + '/' + year;		
				jawboneData.items[i].title = jawboneData.items[i].title.replace('for ', '');
				jawboneData.items[i].time_created = timeCreatedFixed;
				jawboneData.items[i].time_completed = timeCompletedFixed;
			}
			*/
		return done(null, jawboneData, console.log('Jawbone Up sleep data ready to be displayed.'));
		}
	});

}));

function getClockTime(date){
   var now    = new Date(date);
   var hour   = now.getHours();
   var minute = now.getMinutes();
   var second = now.getSeconds();
   var ap = "AM";
   if (hour   > 11) { ap = "PM";             }
   if (hour   > 12) { hour = hour - 12;      }
   if (hour   == 0) { hour = 12;             }
   if (hour   < 10) { hour   = "0" + hour;   }
   if (minute < 10) { minute = "0" + minute; }
   if (second < 10) { second = "0" + second; }
   var timeString = hour + ':' + minute + ':' + second + " " + ap;
   return timeString;
}

var sslOptions= {
	key: fs.readFileSync('./server.key'),
	cert: fs.readFileSync('./server.crt')
};

var server = https.createServer(sslOptions, app);
server.listen(port, host, function() {
	var host = server.address().address;
	console.log('Up server listening on %s:%s', host, port);
});
