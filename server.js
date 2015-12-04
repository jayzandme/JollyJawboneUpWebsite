var express = require('express');
var https = require('https');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var up = require ('./src/upAPI.js');
var queries = require('./src/queries.js');
var _ = require('underscore');

//Timer Variables for Weekly Challenges Page
var Timer;
var TotalSeconds;

// hosting the server
var host = 'localhost'
var port = 5000;
var app = express()

// frontend rendering 
app.use(bodyParser.json());
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/img'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

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

        userToken = token;
        console.log("user logging in with token:\n" + token);

        // update the user
        up.getUserInfo(token, function(userInfo){
        
            // insert the user info if not already in the database
            queries.findUser(userInfo.xid, function(user) {

                if (!user) {
                    console.log('new user!');
                    userInfo.token = token;
                    queries.insertUser(userInfo, function(userID) {
                        res.redirect('/dashboard?user=' + userID);
                    });
                } else {

                    queries.updateUserToken(user.userID, token, function(user) {
                        res.redirect('/dashboard?user=' + user.userID);
                    });
                }
            });
        }); 

    }); 
});

app.get('/dashboard', function(req, res){

    // user data
    var userID = req.query.user;

    findUserByID(userID, function(user) {

        // var token = req.query.token;
        var token = user.token;
        var updating = 3;
        var doneUpdating = _.after(3, loadData);

        // update the sleeps
        up.updateSleeps(token, userID, function(sleepsData) { 
            console.log('got ' + sleepsData.length + ' sleep events');
            queries.insertSleeps(sleepsData, userID, function() {

                updating--;
                console.log('inserted sleeps')
                doneUpdating();
            });
        });

        // update the moves
        up.updateMoves(token, userID, function(movesData) {
            console.log('got ' + movesData.length + ' move events');
            queries.insertMoves(movesData, userID, function() {

                updating--;
                console.log('inserted moves');
                doneUpdating();
            });
        });

        // update the workouts
        up.updateWorkouts(token, userID, function(workoutsData){
            console.log('got ' + workoutsData.length + ' workout events');
            queries.insertWorkouts(workoutsData, userID, function() {

                updating--;
                console.log('inserted workouts');
                doneUpdating();
            });
        });

        // load all the data for frontend
        function loadData() {
            loadSleepsData(userID, function (sleepsData, 
                                             sleepsMax, 
                                             consecutiveSleepMax) {
                loadMovesData(userID, function (movesData, 
                                                totalSteps, 
                                                consecutiveStepCount, 
                                                movesMax) {
                    loadWorkoutsData(userID, function(workoutsData,
                                                      consecutiveWorkoutCount,
                                                      workoutsMax) {
                        loadAggregateData(userID, function (aggregateData) {

                            res.render('dashboard', 
                                        { sleeps: sleepsData[0],
                                          moves: movesData[0],
                                          workouts: workoutsData[0],
                                          otherData: aggregateData,
                                          userID: userID,
                                          date: aggregateData.date,
                                          showNextDayButton: false
                                        });
                        });
                    });
                });
            });
        }

    });

});

app.get('/dashboardPrevious', function(req, res){
  var userID = req.query.user;
  var dayFormatted = req.query.day;
  var date = Date.parse(dayFormatted);
  var previousDate = new Date(date - 1000*60*60*24);
  var numberPreviousDate = getNumberFromFormatted(previousDate);

  var day = numberPreviousDate;

  loadAggregateData(userID, function(aggregateData){
    loadWorkoutsData(userID, function(workoutsData,
                                      consecutiveWorkoutCount,
                                      workoutsMax) {
      loadOneDay(userID, day, function(oneDaySleeps, oneDayMoves){
         res.render('dashboard', 
          {
            sleeps: oneDaySleeps,
            moves: oneDayMoves,
            workouts: workoutsData[0],
            otherData: aggregateData,
            userID: userID,
            date: getFormattedDate(day),
            showNextDayButton: true
        });
      });
    });
  });
});

app.get('/dashboardNext', function(req, res){
  var userID = req.query.user;
  var dayFormatted = req.query.day;
  var date = Date.parse(dayFormatted);
  var nextDate = new Date(date + 1000*60*60*24);
  var numberNextDate = getNumberFromFormatted(nextDate);

  var day = numberNextDate;

  loadAggregateData(userID, function(aggregateData){
    if (day == getNumberFromFormatted(aggregateData.date)){
      loadSleepsData(userID, function (sleepsData, 
                                       sleepsMax, 
                                       consecutiveSleepMax) {
          loadMovesData(userID, function (movesData, 
                                          totalSteps, 
                                          consecutiveStepCount, 
                                          movesMax) {
              loadWorkoutsData(userID, function(workoutsData,
                                                consecutiveWorkoutCount,
                                                workoutsMax) {
                  loadAggregateData(userID, function (aggregateData) {

                      res.render('dashboard', 
                                  { sleeps: sleepsData[0],
                                    moves: movesData[0],
                                    workouts: workoutsData[0],
                                    otherData: aggregateData,
                                    userID: userID,
                                    date: aggregateData.date,
                                    showNextDayButton: false
                                  });
                  });
              });
          });
      });
    }
    else{
      loadWorkoutsData(userID, function(workoutsData,
                                                consecutiveWorkoutCount,
                                                workoutsMax) {
        loadOneDay(userID, day, function(oneDaySleeps, oneDayMoves){    
           res.render('dashboard', 
            {
              sleeps: oneDaySleeps,
              moves: oneDayMoves,
              workouts: workoutsData[0],
              otherData: aggregateData,
              userID: userID,
              date: getFormattedDate(day),
              showNextDayButton: true
          });
        });
      });
    }
  });
});

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/levels', function(req, res){

  var userID = req.query.user;

  //get user's current level from database and when the user started this level
  queries.levelsGetUserLevel(userID, function(users){
    var currentLevel = users.level;
    var startedLevelDate = users.dateStartedLevel;

    loadLevelInfo(userID, currentLevel, startedLevelDate, function(progress, showNextLevelButton, showViewCompletedButton){
        var daysOnLevel = computeDaysOnLevel(startedLevelDate);
        if (progress[0].goalCompleted && progress[1].goalCompleted && progress[2].goalCompleted){
          showNextLevelButton = true;
          var finishedLevelDate = getNumberFromFormatted(null);
          queries.updateUserLevelInfo(userID, currentLevel + 1, finishedLevelDate); 
        }
        res.render('levels', 
          { currentLevel: currentLevel,
            daysOnLevel: daysOnLevel,
            goal1: {
              name: progress[0].name,
              percentComplete: progress[0].percentCompleted,
              leftToGo: progress[0].leftToGoString
            },
            goal2: {
              name: progress[1].name,
              percentComplete: progress[1].percentCompleted,
              leftToGo: progress[1].leftToGoString
            },
            goal3: {
              name: progress[2].name,
              percentComplete: progress[2].percentCompleted,
              leftToGo: progress[2].leftToGoString
            },
            showNextLevelButton: showNextLevelButton,
            showViewCompletedButton: showViewCompletedButton,
            userID: userID
          });
    });
  });  
});

app.get('/newLevel', function(req, res){

    var userID = req.query.user;

    var nextLevelData = {
        goal1Name: null,
        goal2Name: null,
        goal3Name: null,
        newLevelNum: null
    };

    queries.levelsGetUserLevel(userID, function(users){
        nextLevelData.newLevelNum = users.level;
        queries.getLevel(nextLevelData.newLevelNum, function(levels){
            nextLevelData.goal1Name = levels.firstGoal;
            nextLevelData.goal2Name = levels.secondGoal;
            nextLevelData.goal3Name = levels.thirdGoal;

            res.render('newLevel', 
            {
                nextLevelData: nextLevelData,
                userID: userID
            });
        }); 
    });
});

app.get('/viewOldLevel/:i', function(req, res){

  var userID = req.query.user;
  var levelNum = req.params.i;
  var oldLevel = {
    goal1Name: null,
    goal2Name: null,
    goal3Name: null,
    currentLevelNum: null
  };

  queries.levelsGetUserLevel(userID, function(users){
    oldLevel.currentLevelNum = users.level;
    queries.getLevel(levelNum, function(levels){
      oldLevel.goal1Name = levels.firstGoal;
      oldLevel.goal2Name = levels.secondGoal;
      oldLevel.goal3Name = levels.thirdGoal;

      res.render('viewOldLevel', 
        { levelNum: levelNum,
        currentLevelNum: oldLevel.currentLevelNum,
        userID: userID,
        goal1: {
          name: oldLevel.goal1Name,
          percentComplete: 100,
          leftToGo: "Complete!"
        },
        goal2: {
          name: oldLevel.goal2Name,
          percentComplete: 100,
          leftToGo: "Complete!"
        },
        goal3: {
          name: oldLevel.goal3Name,
          percentComplete: 100,
          leftToGo: "Complete"
        },
      });
    }); 
  });
});

app.get('/achievements', function(req,res){

  var userID = req.query.user;
  earnedAchievements = new Array();
  
    earnedAchievements = [];
    
    loadMovesData(userID, function (movesData, 
                                    totalSteps, 
                                    consecutiveStepCount, 
                                    movesMax,
                                    consecutiveStepMax) {
        loadSleepsData(userID, function (sleepsData, 
                                         sleepsMax, 
                                         consecutiveSleepMax) {
            loadWorkoutsData(userID, function(workoutsData,
                                              consecutiveWorkoutCount,
                                              workoutsMax,
                                              consecutiveWorkoutsMax) {

                  stepperRequirements = [
                    10000, 20000, 30000, 40000, 50000
                  ];
                  stepperDescription = [
                    "Take 10000 steps in a day", "Take 20000 steps in a day", "Take 30000 steps in a day", "Take 40000 steps in a day", "Take 50000 steps in a day"
                  ];
                  achievements(movesMax, stepperRequirements, "Stepper", stepperDescription);
                  
                  sleeperRequirements = [
                    60*60*7, 60*60*8
                  ];
                  sleeperDescription = [
                    "Sleep at least 7 hours in a day", "Sleep at least 8 hours in a day"
                  ];
                  achievements(sleepsMax, sleeperRequirements, "Sleeper", sleeperDescription);

                  workoutRequirements = [
                    60*60, 60*60*2, 60*60*3, 60*60*5, 60*60*10
                  ];
                  workoutDescription = [
                    "Workout for 1 hour in a day", "Workout for 2 hours in a day", "Workout for 3 hours in a day", "Workout for 5 hours in a day", "Workout for 10 hours in a day"
                  ];
                  achievements(workoutsMax, workoutRequirements, "Workout", workoutDescription);
                    
                  cStepperRequirements = [
                    2, 3, 5, 7, 14, 30, 365
                  ];
                  cStepperDescription = [
                    "Take 10000 steps 2 days in a row", "Take 10000 steps 3 days in a row", "Take 10000 steps 5 days in a row", "Take 10000 steps 1 week in a row", "Take 10000 steps 2 weeks in a row", "Take 10000 steps 1 month in a row", "Take 10000 steps 1 year in a row"
                  ];
                  achievements(consecutiveStepMax, cStepperRequirements, "Consecutive Stepper", cStepperDescription);

                  cSleepRequirements = [
                    2, 3, 5, 7, 14, 30, 365
                  ];
                  cSleepDescription = [
                    "Sleep at least 8 hours for 2 days in a row", "Sleep at least 8 hours for 3 days in a row", "Sleep at least 8 hours for 5 days in a row", "Sleep at least 8 hours every day for a week", "Sleep at least 8 hours every day for 2 weeks", "Sleep at least 8 hours every day for a month", "Sleep at least 8 hours every day for a year"
                  ];
                  achievements(consecutiveSleepMax, cSleepRequirements, "Consecutive Sleeper", cSleepDescription);

                  cWorkoutRequirements = [
                    2, 3, 5, 7, 14, 30, 365
                  ];
                  cWorkoutDescription = [
                    "Log a workout at least 1 hour long for 2 days in a row", "Log a workout at least 1 hour long for 3 days in a row", "Log a workout at least 1 hour long for 5 days in a row", "Log a workout at least 1 hour long every day for a week", "Log a workout at least 1 hour long every day for 2 weeks", "Log a workout at least 1 hour long every day for a month", "Log a workout at least 1 hour long every day for a year"
                  ];
                  achievements(consecutiveWorkoutMax, cWorkoutRequirements, "Consecutive Workout", cWorkoutDescription);

                  allTimeMovesRequirements = [
                    1000, 10000, 100000, 1000000, 5000000, 10000000
                  ];
                  allTimeMovesDescription = [
                    "Reached 1,000 total steps", "Reached 10,000 total steps", "Reached 100,000 total steps", "Reached 1,000,000 total steps", "Reached 5,000,000 total steps", "Reached 10,000,000 total steps"
                  ];
                  achievements(totalSteps, allTimeMovesRequirements, "Total Steps", allTimeMovesDescription);

                  var consecArray = [];
                  var consecArrayData = [];
                  var totalArray = [];
                  var totalArrayData = [];
                  var normalArray = [];
                  var normalArrayData = [];
                  for(var i = 0; i < earnedAchievements.length; i+=2){
                    if (earnedAchievements[i].substring(0,4) == "Cons"){
                      consecArray.push(earnedAchievements[i]);
                      consecArrayData.push(earnedAchievements[i+1]);
                    }
                    else if (earnedAchievements[i].substring(0,4) == "Tota"){
                      totalArray.push(earnedAchievements[i]);
                      totalArrayData.push(earnedAchievements[i+1]);
                    }
                    else {
                      normalArray.push(earnedAchievements[i]);
                      normalArrayData.push(earnedAchievements[i+1]);
                    }
                  }

                res.render('achievements', 
                           { 
                             earnedAchievements: earnedAchievements,
                             consecArray: consecArray,
                             consecArrayData: consecArrayData,
                             totalArray: totalArray,
                             totalArrayData: totalArrayData,
                             normalArray: normalArray,
                             normalArrayData: normalArrayData,
                             userID: userID
                           });
            });
        });
    });
});

app.get('/teamPage', function(req, res){

    var userID = req.query.user;
    var allFriends = [];
    var friendStats = [];


    up.getFriends(userToken, function(friends) {
        
        loadFriends(friends, allFriends, function(allFriends) {

            res.render('teamPage', 
            { 
                friends: allFriends,
                userID: userID
            });
        });
    });

});

app.get('/friend', function(req, res) {

    var userID = req.query.user;
    var friend = req.query.friend;

    loadAggregateData(friend, function (aggregate) {
        queries.findUserByID(friend, function (friendInfo) { 
            res.render('friend',
            {
                friend: friendInfo,
                aggregate: aggregate,
                userID: userID
            });

        });
    });

});

app.get('/weeklyChallenges', function(req,res){

  var userID = req.query.user;
  var allFriends = [];
  var allFriendData = []; //fills this array with relevant data
  var userFriends = []; //fills this array with relevant data
  //var allFriendWorkouts = [];  //array of total workouts of each friend
  
  challenges = new Array(); //array of weekly challenges
    
  if (true){
    challenges.push("Take the most steps this week!");
    //challenges.push("Log the most sleep this week!");
    //challenges.push("Log the most workouts this week!");
  }

  var challengeCount=0;
  var currentChallenge=challenges[challengeCount];

    //set a starting Sunday to build from
    var month = 'Nov'; 
    var date = '16';
    var year = '2015';

    var theDate = month + ' ' + date + ' ' + year;
    var setdate = new Date(theDate);
    var now = new Date();

    //var midnight = new Date();
    //midnight.setHours(24,0,0,0); //midnignt
    while (setdate-now<=0){
    //if (now.getDay()==0 && midnight.getTime() ==Date.now() ){ //is Sunday at midnight
      
      challengeCount++; //iterate challenge
      challengeCount=challengeCount%challenges.length;
      currentChallenge=challenges[challengeCount];


      setdate.setHours(setdate.getHours() + 7*24);  //iterate setdate
    }
    //console.log("\nsetdate start\n"+setdate+"\nsetdate end\n");
    
    var challengeStart = new Date(setdate);
    challengeStart.setDate(challengeStart.getDate()-7);

    //console.log("\nchallengestart start\n"+challengeStart+"\nchallengestart end\n");

    var startDate= challengeStart.getFullYear()+""+(1+challengeStart.getMonth())+""+challengeStart.getDate();

    //console.log("\nstartDate start\n"+startDate+"\nstartDate end\n");
    
    var countdown = (setdate - now)/1000;
    countdown = Math.floor(countdown);
    

    findUserByID(userID, function(user) {
      
      up.getFriends(userToken, function(friends) {
        
        friends.push(user); //add user to end of list of friends
        
        loadFriends(friends, allFriends, function(userFriends) {

            var arr = [];
            
            loadFriendFunction(userFriends, allFriendData, challengeCount, startDate, arr, function(arr) {

              res.render('weeklyChallenges', 
                  { countdown: countdown,
                    currentChallenge: currentChallenge,
                    friends: userFriends,
                    userID: userID,
                    arr: arr
                  });
            });


          });


      });

      
  });
});


function achievements(count, requirements, achievement, description){
  for (i = 1; i<= requirements.length+1; i++){
    if (count>=requirements[i-1]){
      //achievements(returnAllTimeMoves, allTimeMovesRequirements, "Total Steps", allTimeMovesDescription);
      earnedAchievements.push(achievement+" "+i);
      earnedAchievements.push(description[i-1]);
    } 
  }
}

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

function getNumberFromFormatted(formattedDate){
  if (formattedDate != null){
    var today = new Date(formattedDate);
  }
  else{
    var today = new Date();
  }
  //var today = new Date(formattedDate);
  var todayDay = today.getDate();
  var todayMonth = today.getMonth()+1; //January is 0
  var todayYear = today.getFullYear();

  if(todayDay<10) {
      todayDay='0'+todayDay
  } 

  if(todayMonth<10) {
      todayMonth='0'+todayMonth
  } 


  var todayNumber = parseInt(todayYear, 10) * 10000 + parseInt(todayMonth, 10) * 100 + parseInt(todayDay, 10);
  return todayNumber
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

function computeDaysOnLevel(startedLevelDate){
  var formattedStartedLevelDate = getFormattedDate(startedLevelDate);
  var todayDateNumber = getNumberFromFormatted(null);
  var todayFormatted = getFormattedDate(todayDateNumber);

  var diff =  Math.floor(( Date.parse(todayFormatted) - Date.parse(formattedStartedLevelDate) ) / 86400000);
  
  return diff;
}

function getTitlePrint(title){
  var titlePrint;
  if (title.length == 10){
    titlePrint = title.substring(title.length - 6);
  }
  else if (title.length == 9){
    titlePrint = title.substring(title.length - 5);
  }
  else if (title.length == 7){
    titlePrint = title.substring(title.length - 3);
  }
  else if (title.length == 6){
    titlePrint = title.substring(title.length - 2);
  }
  else{
    titlePrint = 'error';
  }
  return titlePrint;
}

// loads the aggregate data for the front end
function loadAggregateData(userID, callback) {

    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1
    var year = today.getFullYear();

    if (day < 10) {
        day = '0' + day;
    }

    if (month < 10 ) {
        month = '0' + month;
    }

    aggregateData = {date: month + '/' + day + '/' + year, 
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

    // get the moves aggregations
    queries.getMovesAggregation(userID, function (results) {
        aggregateData.stepsAverage = addCommas((results[userID].movesAvg).toFixed(2));
        aggregateData.stepsTotal = addCommas(results[userID].stepsTotal);

        // get the sleeps aggregations
        queries.getSleepsAggregation(userID, function (results) {
            var totalSecondsAve = results[userID].sleepsAvg;
            var totalSeconds = results[userID].sleepsTotal;
            aggregateData.sleepsTotal = secondsToTimeString(totalSeconds);
            aggregateData.sleepsAverage = secondsToTimeString(totalSecondsAve);

            // get the workouts agregations 
            queries.getWorkoutsAggregation(userID, function (results){

                aggregateData.workoutsStepsAverage = 
                    addCommas((results[userID].workoutsStepsAvg).toFixed(2));

                aggregateData.workoutsStepsTotal = 
                    addCommas(results[userID].workoutsStepsTotal);

                aggregateData.workoutsCaloriesAverage = 
                    addCommas((results[userID].workoutsCaloriesAvg).toFixed(2));

                aggregateData.workoutsCaloriesTotal = 
                    addCommas((results[userID].workoutsCaloriesTotal).toFixed(2));

                aggregateData.workoutsTimeAverage = 
                    secondsToTimeString(results[userID].workoutsTimeAvg);

                aggregateData.workoutsTimeTotal = 
                    secondsToTimeString(results[userID].workoutsTimeTotal);

                aggregateData.workoutsDistanceAverage = 
                    (metersToMiles(results[userID].workoutsDistanceAvg)).toFixed(2);

                aggregateData.workoutsDistanceTotal = 
                    addCommas((metersToMiles(results[userID].workoutsDistanceTotal)).toFixed(2));

                // done with getting aggregations, call callback

                queries.getLatestMove(userID, function(lastMove){
                  if (lastMove != null){
                    aggregateData.date = getFormattedDate(lastMove.date);
                  }
                  callback(aggregateData);

                });

            });
        });
    });

}

// load the sleep data for the frontend
function loadSleepsData(userID, callback) {

    var sleepsData = [];
    var sleepsMax = 0;
    var consecutiveSleepMax = 0;

    queries.getSleeps(userID, function(sleeps) {
        for (var i = 0; i < 10; i++) {
          var percentOfGoal;
          var difference = sleeps[i].duration - sleeps[i].awake;
          if (difference > 28800){
            percentOfGoal = 100;
          }
          else{
            percentOfGoal = (difference/ 28800) * 100;
          }

          var title = sleeps[i].title;
          var titlePrint = getTitlePrint(title);

            sleepsData.push( {
                  title: titlePrint,
                  awake_time: epochtoClockTime(sleeps[i].awake_time),
                  asleep_time: epochtoClockTime(sleeps[i].asleep_time),
                  awakenings: sleeps[i].awakenings,
                  lightSleep: secondsToTimeString(sleeps[i].light),
                  deepSleep: secondsToTimeString(sleeps[i].deep),
                  date: getFormattedDate(sleeps[i].date),
                  percentOfGoal: percentOfGoal
            });
        }
        
        // getSleepAmount
        for (var i = 0; i < sleeps.length; i++) {
            if(sleeps[i].duration > sleepsMax)
            sleepsMax = sleeps[i].duration;
        }

        //consecutiveSleepAmount
        var consecutiveSleepCount = 0;
        for (var i = 0; i < sleeps.length; i++) {
            if(sleeps[i].duration> 60 * 60 * 8) {
              consecutiveSleepCount++;
            }
            else {
              consecutiveSleepCount = 0;
            }
            if (consecutiveSleepCount > consecutiveSleepMax) {
              consecutiveSleepMax = consecutiveSleepCount;
            }
        }

        // done getting sleeps data call the callback
        callback(sleepsData, sleepsMax, consecutiveSleepMax);

    }); 
}

// load moves data for the frontend
function loadMovesData(userID, callback) {

    var totalSteps = 0;
    var movesData = [];
    var consecutiveStepCount = 0;
    var movesMax = 0;
    var consecutiveStepMax = 0;

    queries.getMoves(userID, function(moves) {
        for (var i = 0; i < 10; i++) {
          var percentOfGoal;
          if (moves[i].steps > 10000){
            percentOfGoal = 100;
          }
          else{
            percentOfGoal = (moves[i].steps/10000) * 100;
          }
            movesData.push({
              steps: addCommas(moves[i].steps),
              active_time: secondsToTimeString(moves[i].active_time),
              distance: (metersToMiles(moves[i].distance)).toFixed(2),
              calories: addCommas((moves[i].calories).toFixed(2)),
              percentOfGoal: percentOfGoal
            });
        }

        //getStepAmount and consectiveStepCount
        for (var i = 0; i < moves.length; i++){
            if(moves[i].steps > movesMax)
                movesMax = moves[i].steps;

            if(moves[i].steps > 10000){
                consecutiveStepCount++;
            }
            else{
                consecutiveStepCount=0;
            }
            if (consecutiveStepCount > consecutiveStepMax){
                consecutiveStepMax = consecutiveStepCount;
            }

            //alltimemoves
            totalSteps += moves[i].steps;
        }

        // done getting moves data call the callback
        callback(movesData, 
                 totalSteps, 
                 consecutiveStepCount, 
                 movesMax, 
                 consecutiveStepMax
                );

    });
}

// loads the workout data for the front end
function loadWorkoutsData(userID, callback) {

    var consecutiveWorkoutCount = 0;
    var workoutsData = [];
    var workoutsMax = 0;
    var consecutiveWorkoutsMax = 0;

    queries.getWorkouts(userID, function(workouts) {
        for (var i = 0; i < 10; i++){
          var percentOfGoal;
          var distance = metersToMiles(workouts[i].meters);
          if (distance < 3){
            percentOfGoal = (distance / 3) * 100;
          }
          else{
            percentOfGoal = 100;
          }
            workoutsData.push({
              title: workouts[i].title,
              steps: addCommas(workouts[i].steps),
              time: secondsToTimeString(workouts[i].time),
              distance: distance.toFixed(2),
              calories: workouts[i].calories,
              intensity: workouts[i].intensity,
              date: getFormattedDate(workouts[i].date),
              percentOfGoal: percentOfGoal
            });
        }

        //getWorkoutAmount and consecutive
        for (var i = 0; i < workouts.length; i++){
            if(workouts[i].time > workoutsMax)
                workoutsMax = workouts[i].time;

            if(workouts[i].time > 60 * 60){
                consecutiveWorkoutCount++;
            }
            else{
                consecutiveWorkoutCount = 0;
            }
            if (consecutiveWorkoutCount > consecutiveWorkoutsMax){
                consecutiveWorkoutMax = consecutiveWorkoutCount;
            }
        }
        
        // done getting workouts data, call callback
        callback(workoutsData, 
                 consecutiveWorkoutCount,
                 workoutsMax, 
                 consecutiveWorkoutsMax
                );
    });
}

// loads the friends of a user
function loadFriends(friends, allFriends, callback) {

    friend = friends.shift();

    if (friend) {

        queries.findUser(friend.xid, function(user) {
            if (user) {
                allFriends.push(user);
            }
            loadFriends(friends, allFriends, callback);
        });
    }
    else {
        callback(allFriends);
    }
}
//chooses the correct friend function based on challengeCount
function loadFriendFunction(userFriends, allFriendData, challengeCount, startDate, arr, callback) {
  
  var tempFriends=userFriends.slice(0);
  //tempFriends.reverse();

  if (challengeCount==0){ //loadfriendmoves
    loadFriendMoves(tempFriends, allFriendData, startDate, function(allFriendData){
      if(!friend){
        //Sort userFriends and allFriendData
        //probably could make this a function eventually
        var i, l;

        // creating the objects of { name, price } and pushing them into the (unsorted) array
        for(i = 0, l = userFriends.length; i < l; i++) {

            arr.push({
                friend: userFriends[i],
                stat: allFriendData[i]
            });
        }

        // now sorting the array by price, ascending order
        arr.sort(function(a, b) { return b.stat - a.stat; });

        //Reformat Strings to be more readable
        for(i = 0, l = userFriends.length; i < l; i++) {
          arr[i].stat=arr[i].stat+" steps";
        }

        callback(arr);
      }
    });
  }
  else{   //loadfriendsleeps
    loadFriendSleeps(tempFriends, allFriendData, startDate, function(allFriendData){
      if(!friend){
        //Sort userFriends and allFriendData
        //probably could make this a function eventually
        var i, l;

        // creating the objects of { name, price } and pushing them into the (unsorted) array
        for(i = 0, l = userFriends.length; i < l; i++) {

            arr.push({
                friend: userFriends[i],
                stat: allFriendData[i]
            });
        }

        // now sorting the array by price, ascending order
        arr.sort(function(a, b) { return b.stat - a.stat; });

        //Reformat Strings to be more readable
        for(i = 0, l = userFriends.length; i < l; i++) {
          arr[i].stat=secondsToTimeString(arr[i].stat);
        }
        callback(arr);
      }
    });
  }
  //console.log("\n--------------------------\nThis Is All Friend Data: "+allFriendData+"\n-------------------------------------------\n")
  //callback(allFriendData);
  
}

// loads the latest moves of friends of a user
function loadFriendMoves(tempFriends, allFriendData, startDate, callback) {   
    friend = tempFriends.shift();
    if (friend) {
      friendID=friend.userID;
        queries.weeklyGetMoves(friendID, startDate, function(latestMove){
            if (latestMove) {
                //console.log("\nLatestMove Start: \n"+latestMove[0].stepsTotal+"\nLatestMove End \n")
                allFriendData.push(latestMove[0].stepsTotal);
                //allFriendData=allFriendData+latestMove;
            }
            loadFriendMoves(tempFriends, allFriendData, startDate, callback);
        });
    }
    else{
      callback(allFriendData);
    }
}

// loads the latest sleeps of friends of a user
function loadFriendSleeps(tempFriends, allFriendData, startDate, callback) {
    friend = tempFriends.shift();
    if (friend) {
      friendID=friend.userID;
        queries.weeklyGetSleeps(friendID, startDate, function(latestSleep){
            if (latestSleep) {
                allFriendData.push(latestSleep.duration);
            }
            loadFriendSleeps(tempFriends, allFriendData, startDate, callback);
        });
    }
    else {
        callback(allFriendData);
    }
}

function loadOneDay(userID, date, callback){
  var oneDaySleeps = {
    title:null,
    awake_time: null,
    asleep_time: null,
    awakenings: null,
    lightSleep: null,
    deepSleep: null,
    date: null,
    percentOfGoal: null
  }

  var oneDayMoves = {
    steps: null,
    active_time: null,
    distance: null,
    calories: null,
    percentOfGoal: null
  }

  queries.getOneDayMoves(userID, date, function(results){
    //what to do when results are null
    if (results[0] != null){
      var percentOfGoal;
      if (results[0].steps > 10000){
        percentOfGoal = 100;
      }
      else{
        percentOfGoal = (results[0].steps/10000) * 100;
      }

      oneDayMoves = {
        steps: addCommas(results[0].steps),
        active_time: secondsToTimeString(results[0].active_time),
        distance: (metersToMiles(results[0].distance)).toFixed(2),
        calories: addCommas((results[0].calories).toFixed(2)),
        percentOfGoal: percentOfGoal
      }
    }
    
    queries.getOneDaySleeps(userID, date, function(results){
      if(results[0] != null){
        var percentOfGoal;
        var difference = results[0].duration - results[0].awake;
        if (difference > 28800){
          percentOfGoal = 100;
        }
        else{
          percentOfGoal = (difference/ 28800) * 100;
        }

        oneDaySleeps = {
          title: getTitlePrint(results[0].title),
          awake_time: epochtoClockTime(results[0].awake_time),
          asleep_time: epochtoClockTime(results[0].asleep_time),
          awakenings: results[0].awakenings,
          lightSleep: secondsToTimeString(results[0].light),
          deepSleep: secondsToTimeString(results[0].deep),
          date: getFormattedDate(results[0].date),
          percentOfGoal: percentOfGoal
        }
      }
      callback(oneDaySleeps, oneDayMoves);
    });
  });
}

function loadLevelInfo(userID, currentLevel, startedLevelDate, callback){
  queries.getLevel(currentLevel, function(levels) {

    var doneUpdatingLevel = _.after(3, loadLevel);

    var progress = [];
    var progressNames = [];
    var showNextLevelButton = false;
    var showViewCompletedButton = true;
      if (currentLevel == 1){
        showViewCompletedButton = false;
      }
      var goalInfo = [{
        name: levels.firstGoal,
        value: levels.firstGoalNum,
        type: levels.firstGoalType,
        attribute: levels.firstGoalDescriptor
      }, {
        name: levels.secondGoal,
        value: levels.secondGoalNum,
        type: levels.secondGoalType,
        attribute: levels.secondGoalDescriptor
      }, {
        name: levels.thirdGoal,
        value: levels.thirdGoalNum,
        type: levels.thirdGoalType,
        attribute: levels.thirdGoalDescriptor
      }];

      //going to have to make queries for daily steps vs. aggregrate steps and such
      for (var i = 0; i < 3; i++){
        var value = goalInfo[i].value;
        var name = goalInfo[i].name
        if (goalInfo[i].type == "moves"){
          if (goalInfo[i].attribute == "steps"){
             queries.levelsGetNumSteps(userID, startedLevelDate, value, name, function(moves, value, name){
              if (moves[0] != null){
                var stepsTaken = moves[0].steps;
                var stepsRemaining = value - stepsTaken;
                if (stepsRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (((value - stepsRemaining)/value) * 100).toFixed(2),
                    leftToGoString: "Only " + addCommas(stepsRemaining) + " steps to go"
                  })
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                });
              }

              doneUpdatingLevel();
            });
          }
          else if (goalInfo[i].attribute == "distance"){
            queries.levelsGetDistance(userID, startedLevelDate, value, name, function(moves, value, name){
              if (moves[0] != null){
                var distanceTraveled = moves[0].distance;
                var distanceRemaining = value - distanceTraveled;
                if (distanceRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (((value - distanceRemaining)/value) * 100).toFixed(2),
                    leftToGoString: "Only " + (metersToMiles(distanceRemaining)).toFixed(2) + " miles to move"
                  })
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                });
              }
              doneUpdatingLevel();
            });
          }
          
        }
        else if (goalInfo[i].type == "workouts"){
          if (goalInfo[i].attribute == "time"){
            queries.levelsGetTimeWorkouts(userID, startedLevelDate, value, name, function(workouts, value, name){
              if (workouts[0] != null){
                var workoutTimeValue = value;
                var workoutTime = workouts[0].time;
                var workoutTimeRemaining = workoutTimeValue - workoutTime;
                if (workoutTimeRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  var remaining = workoutTimeRemaining % 60;
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: ((workoutTimeValue - workoutTimeRemaining)/workoutTimeValue) * 100,
                    leftToGoString: "Workout for " + remaining + " more minutes"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                });
              }
              doneUpdatingLevel();
            });
          }
          else if (goalInfo[i].attribute == "steps"){
            queries.levelsGetStepsWorkouts(userID, startedLevelDate, value, name, function(workouts, value, name){
              if (workouts[0] != null){
                var workoutStepsValue = value;
                var workoutSteps = workouts[0].steps;
                var workoutStepsRemaining = workoutStepsValue - workoutSteps;
                if (workoutStepsRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  var remaining = workoutStepsRemaining;
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (((workoutStepsValue - workoutStepsRemaining)/workoutStepsValue) * 100).toFixed(2),
                    leftToGoString: "Move " + remaining + " more steps during a workout!"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                });
              }
              doneUpdatingLevel();
            });
          }
          else if(goalInfo[i].attribute == "calories"){
            queries.levelsGetCaloriesWorkouts(userID, startedLevelDate, value, name, function(workouts, value, name){
              if (workouts[0] != null){
                var workoutCaloriesValue = value;
                var workoutCalories = workouts[0].calories;
                var workoutCaloriesRemaining = workoutCaloriesValue - workoutCalories;
                if (workoutCaloriesRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: ((workoutCaloriesValue - workoutCaloriesRemaining)/workoutCaloriesValue) * 100,
                    leftToGoString: "Burn " + workoutCaloriesRemaining + " more calories during a workout!"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                });
              }
              doneUpdatingLevel();
            });
          }

        }
        else if (goalInfo[i].type == "sleeps"){
          if(goalInfo[i].attribute == "asleep_time"){
            queries.levelsGetTimeSleeps(userID, startedLevelDate, value, name, function(sleeps, value, name){
              if (sleeps[0] != null){
                var sleepTimeValue = value * 3600;
                var sleepTime = sleeps[0].duration;
                var sleepTimeRemaining = sleepTimeValue - sleepTime;
                if (sleepTimeRemaining <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  var remaining = (sleepTimeRemaining / 60).toFixed(0);
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (((sleepTimeValue - sleepTimeRemaining)/sleepTimeValue) * 100).toFixed(2),
                    leftToGoString: remaining + " more minutes of sleep to complete this goal!"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                })
              }
              doneUpdatingLevel();
            });
          }
          else if (goalInfo[i].attribute == "awakenings"){
            queries.levelsGetAwakeningsSleeps(userID, startedLevelDate, value, name, function(sleeps, value, name){
              if (sleeps[0] != null){
                var sleepAwakeningsValue = value * 3600;
                var sleepAwakenings = sleeps[0].awakenings;
                var sleepAwakeningsOver = sleepAwakenings - sleepAwakeningsValue;
                if (sleepAwakeningsOver <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (10 - sleepAwakeningsOver) * 10,
                    leftToGoString: "You awakened " + sleepAwakeningsOver + " more times than the goal"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                })
              }
              doneUpdatingLevel();
            });
          }
          else if (goalInfo[i].attribute == "awake"){
            queries.levelsGetTimeAwakeSleeps(userID, startedLevelDate, value, name, function(sleeps, value, name){
              if (sleeps[0] != null){
                var sleepTimeAwakeValue = value;
                var sleepTimeAwake = sleeps[0].awake;
                var sleepTimeOver = sleepTimeAwake - sleepTimeAwakeValue;
                if (sleepTimeOver <= 0){
                  progress.push({
                    name: name,
                    goalCompleted: true,
                    percentCompleted: 100,
                    leftToGoString: "Complete!"
                  });
                }
                else{
                  var remaining = (sleepTimeRemaining / 60).toFixed(0);
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: ((3600 - sleepAwakeningsOver) / 36).toFixed(2),
                    leftToGoString: "You were awake for " + sleepTimeOver % 60 + " minutes over the goal value!"
                  });
                }
              }
              else{
                progress.push({
                  name: name,
                  goalCompleted: false,
                  percentCompleted: 0,
                  leftToGoString: "You haven't started this goal!"
                })
              }
              doneUpdatingLevel();
            });
          } 
        }
      }     
    
      function loadLevel(){
        callback(progress, showNextLevelButton, showViewCompletedButton);
      }
    });
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
