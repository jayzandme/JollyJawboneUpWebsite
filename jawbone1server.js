var express = require('express');
var https = require('https');
var passport = require('passport');
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs')

var host = 'localhost'
var port = 5000;
var app = express()

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(passport.initialize());

var jawboneAuth = {
	clientID: 'bbtI3tvNMBs',
	clientSecret: '5734ad41f828bc7a6196342d2640cca3c3cb9193',
	authorizationURL: 'https://jawbone.com/auth/oauth2/auth',
	tokenURL: 'https://jawbone.com/auth/oauth2/token',
	callbackURL: 'https://localhost:5000/sleepdata'
};

app.get('/login/jawbone', 
	passport.authorize('jawbone', {
		scope: ['basic_read', 'sleep_read'],
		failureRedirect: '/'
	})
);

app.get('/sleepdata',
	passport.authorize('jawbone', {
		scope: ['basic_read', 'sleep_read'],
		failureRedirect: '/'
	}), function(req, res) {
		res.render('userdata', req.account);
	}
);

app.get('/', function(req, res) {
	console.log('got to homepage');
	res.render('index');
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
	
	up.sleeps.get({}, function(err, body) {
		if (err) {
			console.log('Error recieving Jawbone UP data');
		} else {
			var jawboneData = JSON.parse(body).data;
			for (var i = 0; i < jawboneData.items.length; i++) {
				var date = jawboneData.items[i].date.toString(),
					year = date.slice(0,4),
					month = date.slice(4,6),
					day = date.slice(6,8),
					timeCreated = jawboneData.items[i].time_created,
					timeCompleted = jawboneData.items[i].time_completed;

				var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
				d.setUTCSeconds(timeCreated);

				jawboneData.items[i].date = day + '/' + month + '/' + year;		//these are also not being changed 
				jawboneData.items[i].title = jawboneData.items[i].title.replace('for ', '');
				jawboneData.items[i].time_created = d;
			}
		return done(null, jawboneData, console.log('Jawbone Up data ready to be displayed.'));
		}
	});
}));

var sslOptions= {
	key: fs.readFileSync('./server.key'),
	cert: fs.readFileSync('./server.crt')
};

var server = https.createServer(sslOptions, app);
server.listen(port, host, function() {
	var host = server.address().address;
	console.log('Up server listening on %s:%s', host, port);
});
