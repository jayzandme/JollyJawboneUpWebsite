var express = require('express');
var https = require('https');
var passport = require('passport');
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var up = require ('./src/upAPI.js');
var queries = require('./src/queries.js');
var mongoose = require('mongoose');


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

    up.getToken(req.query.code, function(token) {    
        console.log("user logging in with token:\n" + token);
       
        up.updateSleeps(token, function(sleepsData) { 

            console.log('got ' + sleepsData.length + ' sleep events');
            for (var i = 0; i < sleepsData.length; i++) {
                queries.insertSleep(sleepsData[i])
            }
            console.log('inserted sleeps')
        });

        up.updateMoves(token, function(movesData) {
            console.log('got ' + movesData.length + ' move events');
            for (var i = 0; i < movesData.length; i++) {
                queries.insertMove(movesData[i])
            }
            console.log('inserted moves');
        });

        up.updateWorkouts(token, function(workoutsData){
            console.log('got' + workoutsData.length + ' workout events');
            for (var i = 0; i < workoutsData.length; i++) {
                queries.insertWorkout(workoutsData[i])
            }
            console.log('inserted workouts');
        });

        var otherData = {date: null, 
                         stepsAverage: null
                        };

        queries.getAverageSteps(function (results) {
            otherData.stepsAverage = results[0].movesAvg;
        });

        var returnDataSleeps = [];

        queries.getSleeps(1, function(sleeps) {
            for (var i = sleeps.length - 10; i < sleeps.length; i++) {
                returnDataSleeps.push({
                    title: sleeps[i].title,
                      time_created: epochtoClockTime(sleeps[i].time_created),
                      time_completed: epochtoClockTime(sleeps[i].time_completed)
                });
            }
        });

        var returnDataMoves = [];

        queries.getMoves(1, function(moves) {
          for (var i = moves.length - 10; i < moves.length; i++){
                    returnDataMoves.push({
                      steps: moves[i].steps
                    });
          }
          otherData.date = getFormattedDate('' + moves[moves.length - 1].date);
        });

        function getFormattedDate(dateString) {
          console.log(dateString)
          var year = dateString.substring(0, 4)
          var month = dateString.substring(4, 6);
          var day = dateString.substring(6, 8);
          var formattedDate = month + "/" + day + "/" + year;
          return formattedDate
        }

        var returnDataWorkouts = [];

        queries.getWorkouts(1, function(workouts) {
          for (var i = workouts.length - 10; i < workouts.length; i++){
                    returnDataWorkouts.push({
              title: workouts[i].title
            });
          }

          app.get('/dashboard', function(req, res){
            res.render('dashboard', 
              { sleeps: returnDataSleeps[returnDataSleeps.length - 1],
                moves: returnDataMoves[returnDataMoves.length - 1],
                workouts: returnDataWorkouts[returnDataWorkouts.length - 1],
                otherData: otherData
              });
            });
            res.redirect('/dashboard');
        });
        
    });
});

app.get('/', function(req, res) {
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

function epochtoClockTime(epochTime){
  var date = new Date(0);
  date.setUTCSeconds(epochTime);
  clockTime = getClockTime(date);
  return clockTime;
}

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
