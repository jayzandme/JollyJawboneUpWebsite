var express = require('express');
var https = require('https');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var up = require ('./src/upAPI.js');
var queries = require('./src/queries.js');
var mongoose = require('mongoose');
var cookie = require('cookie');

//Variables for Achievements Page
var returnMovesMax = 0;
var returnSleepsMax = 0;
var returnWorkoutsMax = 0;
var consecutiveStepMax = 0;
var consecutiveSleepMax = 0;
var consecutiveWorkoutMax = 0;
var returnAllTimeMoves = 0;

// user session stuff
var userToken;

// data for frontend
var otherdata;
var returnDataSleeps = [];
var returnDataMoves = [];
var returnDataWorkouts = [];

//Variables for Weekly Challenges Page
var Timer;
var TotalSeconds;
var FriendMoves;
var FriendXid;

var host = 'localhost'
var port = 5000;
var app = express()

app.use(bodyParser.json());
app.use(express.static(__dirname + '/css'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

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

        userToken = token;
        console.log("user logging in with token:\n" + token);

        // update the user
        up.getUserInfo(token, function(userInfo){
        
            // insert the user info if not already in the database
            queries.findUser(userInfo.xid, function(user) {

                if (!user) {
                    console.log('new user!');
                    queries.insertUser(userInfo, function(){});
                }
            });
        });
       
        // update the sleeps
        up.updateSleeps(token, function(sleepsData) { 

            console.log('got ' + sleepsData.length + ' sleep events');
            for (var i = 0; i < sleepsData.length; i++) {
                queries.insertSleep(sleepsData[i])
            }
            console.log('inserted sleeps')
            // update the moves
            up.updateMoves(token, function(movesData) {
                console.log('got ' + movesData.length + ' move events');
                for (var i = 0; i < movesData.length; i++) {
                    queries.insertMove(movesData[i])
                }
                console.log('inserted moves');

                // update the workouts
                up.updateWorkouts(token, function(workoutsData){
                    console.log('got ' + workoutsData.length + ' workout events');
                    for (var i = 0; i < workoutsData.length; i++) {
                        queries.insertWorkout(workoutsData[i])
                    }
                    console.log('inserted workouts');

                    // load all the data for frontend
                    loadAggregateData(function () {
                        loadSleepsData(function () {
                            loadMovesData(function () {
                                loadWorkoutsData(function() {

                                    // display the dashboard
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
                    });
                });
            });
        });
    }); 
});

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/levels', function(req, res){

  //get user's current level from database and when the user started this level
  queries.levelsGetUserLevel(1, function(users){
    var currentLevel = users.level;
    var startedLevelDate = users.dateStartedLevel;
    var daysOnLevel = computeDaysOnLevel(startedLevelDate);
    var goalInfo = [];
    var progress = [];
    var progressNames = [];
    var showNextLevelButton = false;

    //find that level in levels database
    queries.getLevel(currentLevel, function(levels) {

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
      //this will only work for level 1 currently
      for (var i = 0; i < 3; i++){
        var value = goalInfo[i].value;
        var name = goalInfo[i].name
        if (goalInfo[i].type == "moves"){
          if (goalInfo[i].attribute == "steps"){
             queries.levelsGetNumSteps(1, startedLevelDate, value, name, function(moves, value, name){

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
            });
          }
          else if (goalInfo[i].attribute == "distance"){
            queries.levelsGetDistance(1, startedLevelDate, value, name, function(moves, value, name){
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
            });
          }
          
        }
        else if (goalInfo[i].type == "workouts"){
          if (goalInfo[i].attribute == "time"){
            queries.levelsGetTimeWorkouts(1, startedLevelDate, value, name, function(workouts, value, name){
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
                    leftToGoString: "Workout for " + remaining + "more minutes"
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
            });
          }
          else if (goalInfo[i].attribute == "steps"){
            queries.levelsGetStepsWorkouts(1, startedLevelDate, value, name, function(workouts, value, name){
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
                  var remaining = workoutTimeRemaining % 60;
                  progress.push({
                    name: name,
                    goalCompleted: false,
                    percentCompleted: (((workoutStepsValue - workoutStepsRemaining)/workoutStepsValue) * 100).toFixed(2),
                    leftToGoString: "Moves " + remaining + "more steps during a workout!"
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
            });
          }
          else if(goalInfo[i].attribute == "calories"){
            queries.levelsGetCaloriesWorkouts(1, startedLevelDate, value, name, function(workouts, value, name){
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
                    leftToGoString: "Burn " + workoutCaloriesRemaining + "more calories during a workout!"
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
            });
          }

        }
        else if (goalInfo[i].type == "sleeps"){
          if(goalInfo[i].attribute == "asleep_time"){
            queries.levelsGetTimeSleeps(1, startedLevelDate, value, name, function(sleeps, value, name){
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
                    percentCompleted: ((sleepTimeValue - sleepTimeRemaining)/sleepTimeValue) * 100,
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
            });
          }
          else if (goalInfo[i].attribute == "awakenings"){
            queries.levelsGetAwakeningsSleeps(1, startedLevelDate, value, name, function(sleeps, value, name){
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
            });
          }
          else if (goalInfo[i].attribute == "awake"){
            queries.levelsGetTimeAwakeSleeps(1, startedLevelDate, value, name, function(sleeps, value, name){
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
                    percentCompleted: (3600 - sleepAwakeningsOver) / 36,
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
            });
          } 
        }
      }

      setTimeout(function(){
        if (progress[0].goalCompleted && progress[1].goalCompleted && progress[2].goalCompleted){
          showNextLevelButton = true;
          var finishedLevelDate = getDateNumber();
          queries.updateUserLevelInfo(1, currentLevel + 1, finishedLevelDate); 
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
            showNextLevelButton: showNextLevelButton
          });
      }, 500);      
    });
  });  
});

app.get('/newLevel', function(req, res){
  var nextLevelData = {
    goal1Name: null,
    goal2Name: null,
    goal3Name: null,
    newLevelNum: null
  };

  queries.levelsGetUserLevel(1, function(users){
    nextLevelData.newLevelNum = users.level;
    queries.getLevel(nextLevelData.newLevelNum, function(levels){
      nextLevelData.goal1Name = levels.firstGoal;
      nextLevelData.goal2Name = levels.secondGoal;
      nextLevelData.goal3Name = levels.thirdGoal;
    }); 
  });

  setTimeout(function(){
    res.render('newLevel', nextLevelData);
  }, 500)

});

app.get('/viewOldLevel/:i', function(req, res){

  var levelNum = req.params.i;
  var oldLevel = {
    goal1Name: null,
    goal2Name: null,
    goal3Name: null,
    currentLevelNum: null
  };

  queries.levelsGetUserLevel(1, function(users){
    oldLevel.currentLevelNum = users.level;
    queries.getLevel(levelNum, function(levels){
      oldLevel.goal1Name = levels.firstGoal;
      oldLevel.goal2Name = levels.secondGoal;
      oldLevel.goal3Name = levels.thirdGoal;
    }); 
  });

  setTimeout(function(){
    res.render('viewOldLevel', 
      { levelNum: levelNum,
      currentLevelNum: oldLevel.currentLevelNum,
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
  }, 500);
});

app.get('/achievements', function(req,res){

  earnedAchievements = new Array();
    
  if (returnMovesMax>10000){
    earnedAchievements.push("Stepper 1");
    earnedAchievements.push("Take 10000 steps in a day");
  }
  if (returnMovesMax>20000){
    earnedAchievements.push("Stepper 2");
    earnedAchievements.push("Take 20000 steps in a day");
  }
  if (returnMovesMax>30000){
    earnedAchievements.push("Stepper 3");
    earnedAchievements.push("Take 30000 steps in a day");
  }
  if (returnMovesMax>40000){
    earnedAchievements.push("Stepper 4");
    earnedAchievements.push("Take 40000 steps in a day");
  }
  if (returnMovesMax>50000){
    earnedAchievements.push("Stepper 5");
    earnedAchievements.push("Take 50000 steps in a day");
  }
  if (returnMovesMax>60*60*7){
    earnedAchievements.push("Sleeper 1");
    earnedAchievements.push("Sleep at least 7 hours in a day");
  }
  if (returnMovesMax>60*60*8){
    earnedAchievements.push("Sleeper 2");
    earnedAchievements.push("Sleep at least 8 hours in a day");
  }
  if (returnMovesMax>60*60){
    earnedAchievements.push("Workout 1");
    earnedAchievements.push("Workout for 1 hour in a day");
  }
  if (returnMovesMax>60*60*2){
    earnedAchievements.push("Workout 2");
    earnedAchievements.push("Workout for 2 hours in a day");
  }
  if (returnMovesMax>60*60*3){
    earnedAchievements.push("Workout 3");
    earnedAchievements.push("Workout for 3 hours in a day");
  }
  if (returnMovesMax>60*60*5){
    earnedAchievements.push("Workout 4");
    earnedAchievements.push("Workout for 5 hours in a day");
  }
  if (returnMovesMax>60*60*10){
    earnedAchievements.push("Workout 5");
    earnedAchievements.push("Workout for 10 hours in a day");
  }
  if (consecutiveStepMax>=2){
    earnedAchievements.push("Consecutive Stepper 1");
    earnedAchievements.push("Take 10000 steps 2 days in a row");
  }
  if (consecutiveStepMax>=3){
    earnedAchievements.push("Consecutive Stepper 2");
    earnedAchievements.push("Take 10000 steps 3 days in a row");
  }
  if (consecutiveStepMax>=5){
    earnedAchievements.push("Consecutive Stepper 3");
    earnedAchievements.push("Take 10000 steps 5 days in a row");
  }
  if (consecutiveStepMax>=7){
    earnedAchievements.push("Consecutive Stepper 4");
    earnedAchievements.push("Take 10000 steps every day for a week");
  }
  if (consecutiveStepMax>=14){
    earnedAchievements.push("Consecutive Stepper 5");
    earnedAchievements.push("Take 10000 steps every day for 2 weeks");
  }
  if (consecutiveStepMax>=30){
    earnedAchievements.push("Consecutive Stepper 6");
    earnedAchievements.push("Take 10000 steps every day for a month");
  }
  if (consecutiveStepMax>=365){
    earnedAchievements.push("Consecutive Stepper 7");
    earnedAchievements.push("Take 10000 steps every day for a year");
  }
  if (consecutiveSleepMax>=2){
    earnedAchievements.push("Consecutive Sleeper 1");
    earnedAchievements.push("Sleep at least 8 hours for 2 days in a row");
  }
  if (consecutiveSleepMax>=3){
    earnedAchievements.push("Consecutive Sleeper 2");
    earnedAchievements.push("Sleep at least 8 hours for 3 days in a row");
  }
  if (consecutiveSleepMax>=5){
    earnedAchievements.push("Consecutive Sleeper 3");
    earnedAchievements.push("Sleep at least 8 hours for 5 days in a row");
  }
  if (consecutiveSleepMax>=7){
    earnedAchievements.push("Consecutive Sleeper 4");
    earnedAchievements.push("Sleep at least 8 hours every day for a week");
  }
  if (consecutiveSleepMax>=14){
    earnedAchievements.push("Consecutive Sleeper 5");
    earnedAchievements.push("Sleep at least 8 hours every day for 2 weeks");
  }
  if (consecutiveSleepMax>=30){
    earnedAchievements.push("Consecutive Sleeper 6");
    earnedAchievements.push("Sleep at least 8 hours every day for a month");
  }
  if (consecutiveSleepMax>=365){
    earnedAchievements.push("Consecutive Sleeper 7");
    earnedAchievements.push("Sleep at least 8 hours every day for a year");
  }
  if (consecutiveWorkoutMax>=2){
    earnedAchievements.push("Consecutive Workout 1");
    earnedAchievements.push("Log a workout at least 1 hour long for 2 days in a row");
  }
  if (consecutiveWorkoutMax>=3){
    earnedAchievements.push("Consecutive Workout 2");
    earnedAchievements.push("Log a workout at least 1 hour long for 2 days in a row");
  }
  if (consecutiveWorkoutMax>=5){
    earnedAchievements.push("Consecutive Workout 3");
    earnedAchievements.push("Log a workout at least 1 hour long for 2 days in a row");
  }
  if (consecutiveWorkoutMax>=7){
    earnedAchievements.push("Consecutive Workout 4");
    earnedAchievements.push("Log a workout at least 1 hour long every day for a week");
  }
  if (consecutiveWorkoutMax>=14){
    earnedAchievements.push("Consecutive Workout 5");
    earnedAchievements.push("Log a workout at least 1 hour long every day for 2 weeks");
  }
  if (consecutiveWorkoutMax>=30){
    earnedAchievements.push("Consecutive Workout 6");
    earnedAchievements.push("Log a workout at least 1 hour long every day for a month");
  }
  if (consecutiveWorkoutMax>=365){
    earnedAchievements.push("Consecutive Workout 7");
    earnedAchievements.push("Log a workout at least 1 hour long every day for a year");
  }
  if (returnAllTimeMoves>=1000){
    earnedAchievements.push("Total Steps 1");
    earnedAchievements.push("Reached 1,000 total steps");
  }
  if (returnAllTimeMoves>=10000){
    earnedAchievements.push("Total Steps 2");
    earnedAchievements.push("Reached 10,000 total steps");
  }
  if (returnAllTimeMoves>=100000){
    earnedAchievements.push("Total Steps 3");
    earnedAchievements.push("Reached 100,000 total steps");
  }
  if (returnAllTimeMoves>=1000000){
    earnedAchievements.push("Total Steps 4");
    earnedAchievements.push("Reached 1,000,000 total steps");
  }
  if (returnAllTimeMoves>=5000000){
    earnedAchievements.push("Total Steps 5");
    earnedAchievements.push("Reached 5,000,000 total steps");
  }
  if (returnAllTimeMoves>=10000000){
    earnedAchievements.push("Total Steps 6");
    earnedAchievements.push("Reached 10,000,000 total steps");
  }

  //console.log('earnedAchievements: %s', earnedAchievements);
    
  res.render('achievements', 
    earnedAchievements);
});

app.get('/teamPage', function(req, res){

    up.getFriends(userToken, function(friends) {
        
        for (var i = 0; i < friends.length; i++) {
            console.log('friend: ' + i);
            console.log(friends[i].xid);
        }

        res.render('teamPage');
    });
});

app.get('/weeklyChallenges', function(req,res){
  
  //array of weekly challenges
  challenges = new Array();
    
  if (true){
    challenges.push("Take the most steps this week!");
    challenges.push("Log the most sleep this week!");
    challenges.push("Log the most workouts this week!");
  }

  var challengeCount=0;
  var currentChallenge=challenges[challengeCount];


    //set a starting Sunday to build from
    var month = 'Nov'; 
    var date = '15';
    var year = '2015';

    var theDate = month + ' ' + date + ' ' + year;
    var setdate = new Date(theDate);
    var now = new Date();
    

    var now = new Date();
    var midnight = new Date();
    midnight.setHours(24,0,0,0); //midnignt
    while (setdate-now<=0){
    //if (now.getDay()==0 && midnight.getTime() ==Date.now() ){ //is Sunday at midnight
      //iterate challenge
      challengeCount++;
      challengeCount=challengeCount%challenges.length;
      currentChallenge=challenges[challengeCount];
      //iterate setdate
      setdate.setHours(setdate.getHours() + 7*24);
    }
    
    var countdown = (setdate - now)/1000;
    countdown = Math.floor(countdown);

    up.getFriends(userToken, function(friends) {
    userFriends = new Array();   
    userProgress = new Array(); 
    for (var i = 0; i < friends.length; i++) {
        console.log('friend: ' + i);
        console.log(friends[i].xid);
        userFriends.push(friends[i].userID);
        userFriends.push(friends[i].xid);
        userProgress.push('Friend ' + i);
        userProgress.push(friends[i].xid);
    }

 /*   
 if (true){
    userProgress.push("Friend 1");
    userProgress.push("30,000 steps");
  }
  if (true){
    userProgress.push("Friend 2");
    userProgress.push("12,000 steps");
  }
  if (true){
    userProgress.push("Friend 3");
    userProgress.push("1,000 steps");
  }
  */
  
    res.render('weeklyChallenges', 
      {countdown: countdown,
        currentChallenge: currentChallenge,
        }
      );
    });
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

function computeDaysOnLevel(startedLevelDate){
  var formattedStartedLevelDate = getFormattedDate(startedLevelDate);

  var daysOnLevel = 0;

  var today = new Date();
  var todayDay = today.getDate();
  var todayMonth = today.getMonth()+1; //January is 0
  var todayYear = today.getFullYear();

  if(todayDay<10) {
      todayDay='0'+todayDay
  } 

  if(todayMonth<10) {
      todayMonth='0'+todayMonth
  } 
  
  today = todayMonth+'/'+todayDay+'/'+todayYear;

  var diff =  Math.floor(( Date.parse(today) - Date.parse(formattedStartedLevelDate) ) / 86400000);
  
  return diff;
}

function getDateNumber(){
  var today = new Date();
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

// loads the aggregate data for the front end
function loadAggregateData(callback) {

    otherData = {date: null, 
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
    queries.getMovesAggregation(function (results) {
        otherData.stepsAverage = addCommas((results[0].movesAvg).toFixed(2));
        otherData.stepsTotal = addCommas(results[0].stepsTotal);

        // get the sleeps aggregations
        queries.getSleepsAggregation(function (results) {
            var totalSecondsAve = results[0].sleepsAvg;
            var totalSeconds = results[0].sleepsTotal;
            otherData.sleepsTotal = secondsToTimeString(totalSeconds);
            otherData.sleepsAverage = secondsToTimeString(totalSecondsAve);

            // get the workouts agregations 
            queries.getWorkoutsAggregation(function (results){

                otherData.workoutsStepsAverage = 
                    addCommas((results[0].workoutsStepsAvg).toFixed(2));

                otherData.workoutsStepsTotal = 
                    addCommas(results[0].workoutsStepsTotal);

                otherData.workoutsCaloriesAverage = 
                    addCommas((results[0].workoutsCaloriesAvg).toFixed(2));

                otherData.workoutsCaloriesTotal = 
                    addCommas((results[0].workoutsCaloriesTotal).toFixed(2));

                otherData.workoutsTimeAverage = 
                    secondsToTimeString(results[0].workoutsTimeAvg);

                otherData.workoutsTimeTotal = 
                    secondsToTimeString(results[0].workoutsTimeTotal);

                otherData.workoutsDistanceAverage = 
                    (metersToMiles(results[0].workoutsDistanceAvg)).toFixed(2);

                otherData.workoutsDistanceTotal = 
                    addCommas((metersToMiles(results[0].workoutsDistanceTotal)).toFixed(2));

                    // done with getting aggrgations, call callback
                    callback();

            });
        });
    });


}

// load the sleep data for the frontend
function loadSleepsData(callback) {

    queries.getSleeps(1, function(sleeps) {
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
        
        // getSleepAmount
        for (var i = 0; i < sleeps.length; i++){
            if(sleeps[i].duration>returnSleepsMax)
            returnSleepsMax=sleeps[i].duration;
        }
        //consecutiveSleepAmount
        var consecutiveSleepCount=0;
        for (var i = 0; i < sleeps.length; i++){
            if(sleeps[i].duration>60*60*8){
              consecutiveSleepCount++;
            }
            else{
              consecutiveSleepCount=0;
            }
            if (consecutiveSleepCount>consecutiveSleepMax){
              consecutiveSleepMax=consecutiveSleepCount;
            }
        }

        // done getting sleeps data call the callback
        callback();

    }); 
}

// load moves data for the frontend
function loadMovesData(callback) {
    FriendMoves = 0;
    FriendXid = "2hjpAooLN61LYkWC2ca6YQ";
    /*queries.getMoves(FriendXid,function(moves)){
      
    }*/

    returnAllTimeMoves = 0;
    queries.getMoves(1, function(moves) {
        for (var i = 0; i < 10; i++) {
            returnDataMoves.push({
              steps: addCommas(moves[i].steps),
              active_time: secondsToTimeString(moves[i].active_time),
              distance: (metersToMiles(moves[i].distance)).toFixed(2),
              calories: addCommas((moves[i].calories).toFixed(2)),
              percentOfGoal: (moves[i].steps / 10000) * 100
            });
        }
        otherData.date = getFormattedDate(moves[0].date);

        //getStepAmount and consectiveStepCount
        var consecutiveStepCount=0;
        for (var i = 0; i < moves.length; i++){
            if(moves[i].steps>returnMovesMax)
                returnMovesMax=moves[i].steps;

            if(moves[i].steps>10000){
                consecutiveStepCount++;
            }
            else{
                consecutiveStepCount=0;
            }
            if (consecutiveStepCount>consecutiveStepMax){
                consecutiveStepMax=consecutiveStepCount;
            }

            //alltimemoves
            returnAllTimeMoves+=moves[i].steps;
        }


        // done getting moves data call the callback
        callback();

    });
}

// loads the workout data for the front end
function loadWorkoutsData(callback) {

    queries.getWorkouts(1, function(workouts) {
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

        //getWorkoutAmount and consecutive
        var consecutiveWorkoutCount=0;
        for (var i = 0; i < workouts.length; i++){
            if(workouts[i].time>returnWorkoutsMax)
                returnWorkoutsMax=workouts[i].time;

            if(workouts[i].time>60*60){
                consecutiveWorkoutCount++;
            }
            else{
                consecutiveWorkoutCount=0;
            }
            if (consecutiveWorkoutCount>consecutiveWorkoutMax){
                consecutiveWorkoutMax=consecutiveWorkoutCount;
            }
        }
        
        // done getting workouts data, call callback
        callback();
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
