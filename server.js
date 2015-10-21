var express = require('express');
var https = require('https');
var passport = require('passport');
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var up = require ('./upAPI.js');
var queries = require('./queries.js');
var mongoose = require('mongoose');

/*
var MongoDB = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;
MongoDB.on('error', function(err) { 
    console.log(err.message); 
});
MongoDB.once('open', function() {
  console.log("mongodb connection open");
});
*/
var Sleeps = require('./databaseSchema/sleeps.js')

// the token is stored locally for now, it will have to be stored in th database
// eventually
var token;

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

var userToken = ''

var jawboneAuth = {
	clientID: 'bbtI3tvNMBs',
	clientSecret: '5734ad41f828bc7a6196342d2640cca3c3cb9193',
	authorizationURL: 'https://jawbone.com/auth/oauth2/auth',
	tokenURL: 'https://jawbone.com/auth/oauth2/token',
	callbackURL: 'https://localhost:5000/dashboard'
};

app.get('/login/jawbone', function (req, res) {

    res.redirect('https://' + up.getCode());
    res.end;

});

app.get('/token', function (req, res) {

    // store the token in the database
    // console.log(req.query.code);
    up.getToken(req.query.code, function(token) {    
        console.log("user logging in with token\n" + token);
       
        up.updateSleeps(token, function(data) { 

            console.log('got ' + data.length + ' sleep events');
            for (var i = 0; i < data.length; i++) {
                queries.insertSleep(data[i])
            }
        });

		up.getMoves(token, function(data) {
			var MovesData = JSON.parse(data).data;
            console.log('got ' + MovesData.items.length + ' move events');
			//console.log(jawboneMovesData);

		});

        //queries.getSleeps(1);
        
        // display the dashboard page
        res.redirect('/dashboard');
    });
});

var testHold = {testingSleeps: null,
	testingMoves: null};

app.get('/dashboard', function(req, res) {
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
