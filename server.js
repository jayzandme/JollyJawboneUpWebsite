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
                         stepsAverage: null,
                         sleepsAverage: null,
                         stepsTotal: null,
                         sleepsTotal: null,
                         workoutsStepsAverage: null,
                         workoutsStepsTotal: null,
                         workoutsCaloriesAverage: null,
                         workoutsCaloriesTotal: null,
                         workoutsTimeAverage: null,
                         workoutsTimeTotal: null,
                         workoutsDistanceAverage: null,
                         workoutsDistanceTotal: null,
                        };

        queries.getStepsAggregation(function (results) {
            otherData.stepsAverage = addCommas((results[0].movesAvg).toFixed(2));
            otherData.stepsTotal = addCommas(results[0].stepsTotal);
        });

        queries.getSleepsAggregation(function (results) {
            var totalSecondsAve = results[0].sleepsAvg;
            var totalSeconds = results[0].sleepsTotal;
            otherData.sleepsTotal = secondsToTimeString(totalSeconds);
            otherData.sleepsAverage = secondsToTimeString(totalSecondsAve);
        });

        queries.getWorkoutsAggregation(function (results){
            otherData.workoutsStepsAverage = addCommas((results[0].workoutsStepsAvg).toFixed(2));
            otherData.workoutsStepsTotal = addCommas(results[0].workoutsStepsTotal);
            otherData.workoutsCaloriesAverage = addCommas((results[0].workoutsCaloriesAvg).toFixed(2));
            otherData.workoutsCaloriesTotal = addCommas((results[0].workoutsCaloriesTotal).toFixed(2));
            otherData.workoutsTimeAverage = secondsToTimeString(results[0].workoutsTimeAvg);
            otherData.workoutsTimeTotal = secondsToTimeString(results[0].workoutsTimeTotal);
            otherData.workoutsDistanceAverage = (metersToMiles(results[0].workoutsDistanceAvg)).toFixed(2);
            otherData.workoutsDistanceTotal = addCommas((metersToMiles(results[0].workoutsDistanceTotal)).toFixed(2));

        });

        var returnDataSleeps = [];

        queries.getSortedSleeps(1, function(sleeps) {
            for (var i = 0; i < 10; i++) {
                returnDataSleeps.push({
                    title: sleeps[i].title,
                      awake_time: epochtoClockTime(sleeps[i].awake_time),
                      asleep_time: epochtoClockTime(sleeps[i].asleep_time),
                      awakenings: sleeps[i].awakenings,
                      lightSleep: secondsToTimeString(sleeps[i].light),
                      deepSleep: secondsToTimeString(sleeps[i].deep),
                      date: getFormattedDate(sleeps[i].date)
                });
            }
        }); 

        var returnDataMoves = [];

        queries.getSortedMoves(1, function(moves) {
          for (var i = 0; i < 10; i++){
                    returnDataMoves.push({
                      steps: addCommas(moves[i].steps),
                      active_time: secondsToTimeString(moves[i].active_time),
                      distance: (metersToMiles(moves[i].distance)).toFixed(2),
                      calories: addCommas((moves[i].calories).toFixed(2))
                    });
          }
          otherData.date = getFormattedDate(moves[0].date);
        });

        var returnDataWorkouts = [];

        queries.getSortedWorkouts(1, function(workouts) {
          for (var i = 0; i < 10; i++){
                    returnDataWorkouts.push({
              title: workouts[i].title,
              steps: addCommas(workouts[i].steps),
              time: secondsToTimeString(workouts[i].time),
              distance: metersToMiles(workouts[i].meters).toFixed(2),
              calories: workouts[i].calories,
              intensity: workouts[i].intensity,
              date: getFormattedDate(workouts[i].date)

            });
          }

          setTimeout(function(){
          app.get('/dashboard', function(req, res){
            res.render('dashboard', 
              { sleeps: returnDataSleeps[0],
                moves: returnDataMoves[0],
                workouts: returnDataWorkouts[0],
                otherData: otherData
              });
            });
            res.redirect('/dashboard');
          }, 1000);
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
   //var timeString = hour + ':' + minute + ':' + second + " " + ap;
   var timeString = hour + ':' + minute + ' ' + ap;
   return timeString;
}

function addCommas(num) {
  //return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getFormattedDate(dateString) {
  dateString = '' + dateString;
  var year = dateString.substring(0, 4)
  var month = dateString.substring(4, 6);
  var day = dateString.substring(6, 8);
  var formattedDate = month + "/" + day + "/" + year;
  return formattedDate
}

function secondsToTimeString(secondsTotal){
  hours = Math.floor(secondsTotal / 3600);
  secondsTotal %= 3600;
  minutes = Math.floor(secondsTotal / 60);
  seconds = secondsTotal % 60;
  return hours + "h " + minutes + "m";
}

function metersToMiles(meters){
  return meters * 0.000621371192;
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
