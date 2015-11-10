var express = require('express');
var https = require('https');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var up = require ('./src/upAPI.js');
var queries = require('./src/queries.js');
var mongoose = require('mongoose');

var returnMovesMax = 0;
var returnSleepsMax = 0;
var returnWorkoutsMax = 0;
var consecutiveStepMax = 0;
var consecutiveSleepMax = 0;
var consecutiveWorkoutMax = 0;
var returnAllTimeMoves = 0;

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

        //this inserted a level into the database to initialize it 
        /*level1 = {
          levelNum: 1,
          levelName: "First Level!",          
          firstGoal: "Take 2,000 steps in day",    //description of goal
          firstGoalNum: 2000,   //how to quantify the goal
          firstGoalType: "moves",  //sleeps, moves, or workouts
          firstGoalDescriptor: "steps", //for example - steps or active_time (use this when referencing moves object)
          firstGoalProgressTemplate: null,  //for displaying in the html what is left to complete this goal
          secondGoal: "30 Minute Workout",
          secondGoalNum: 1800,  //seconds
          secondGoalType: "workouts",
          secondGoalDescriptor: "time",
          secondGoalProgressTemplate: null,
          thirdGoal: "Sleep 8 hours",
          thirdGoalNum: 8,  //hours
          thirdGoalType: "sleeps",
          thirdGoalDescriptor: "asleep_time",
          thirdGoalProgressTemplate: null
        }
        queries.insertLevel(level1);*/


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

        queries.getMovesAggregation(function (results) {
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
        }); 

        var returnDataMoves = [];

        queries.getMoves(1, function(moves) {
          for (var i = 0; i < 10; i++){
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

        });

        var returnDataWorkouts = [];

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

/*function goalProgress(value, type, attribute, startedLevelDate){
  var progress = {
    goalCompleted:null,
    percentComplete: null,
    leftToGoString: null
  };

  switch(type){
    case 'sleeps':

      switch(attribute){
        case 'awake_time':
          break;
        case 'asleep_time':
          break;
        case 'awakenings':
          break;
        case 'light':
          break;
        case 'deep':
          break;
        default :
          console.log("Error in sleeps attribute for getting goal progress");
      }

      break;
    case 'moves' :

      switch(attribute){
        case 'steps':
          queries.levelsGetNumSteps(1, startedLevelDate, function(moves){
            var stepsTaken = moves[0].steps;
            var stepsRemaining = value - stepsTaken;
            if (stepsRemaining <= 0){
              progress.goalCompleted = true;
              progress.percentComplete = 100;
              progress.leftToGoString = "Complete!";
            }
            else{
              progress.goalCompleted = false;
              progress.percentComplete = ((value - stepsRemaining)/value) * 100;
              progress.leftToGoString ="Only " + stepsRemaining + "steps to go";
            }
          }); 
          break;
        case 'active_time':
          break;
        case 'distance':
          break;
        case 'calories':
          break;
        default: 
          console.log("Error in moves atrribute for getting goal progress");
      }
      break;

    case 'workouts' :

      switch(atrribute){
        case 'steps':
          break;
        case 'time':
          break;
        case 'distance':
          break;
        case 'calories':
          break;
        case 'intensity':
          break;
        default:
          console.log("Error in workouts attribute for getting goal progress");
      }
      break;

    default:
      console.log("Error in computing goalProgress");
  }
  //console.log(progress)
  setTimeout(function(){
    console.log(progress);
    return progress;
  }, 300);
  //return progress

}*/

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/levels', function(req, res){

  //get user's current level from database and when the user started this level
  var currentLevel = 1;
  var startedLevelDate = "2014419";
  var daysOnLevel = 4;
  var goal1Value, goal1Type, goal1Attribute;
  var goal1, goal2, goal3;
  var goal1Name, goal2Name, goal3Name;
  var goal1CurrentProgress;
  var progress = {
    goalCompleted:null,
    percentComplete: null,
    leftToGoString: null
  };
  var goal2Progress = {
    goalCompleted:null,
    percentComplete: null,
    leftToGoString: null
  };
  var goal3Progress = {
    goalCompleted:null,
    percentComplete: null,
    leftToGoString: null
  };
  var showNextLevelButton = false;

  //find that level in levels database
  queries.getLevel(currentLevel, function(levels) {

    currentLevel = levels.levelNum;
    goal1Name = levels.firstGoal;
    goal2Name = levels.secondGoal;
    goal3Name = levels.thirdGoal;

    goal1Value = levels.firstGoalNum;
    goal1Type = levels.firstGoalType;
    goal1Attribute = levels.firstGoalDescriptor;

    //goal1CurrentProgress = goalProgress(goal1Value, goal1Type, goal1Attribute, startedLevelDate);
    var value = goal1Value;

    //going to have to make queries for daily steps vs. aggregrate steps and such
    queries.levelsGetNumSteps(1, startedLevelDate, function(moves){
      if (moves[0] != null){
        var stepsTaken = moves[0].steps;
        var stepsRemaining = value - stepsTaken;
        if (stepsRemaining <= 0){
          progress.goalCompleted = true;
          progress.percentComplete = 100;
          progress.leftToGoString = "Complete!";
        }
        else{
          progress.goalCompleted = false;
          progress.percentComplete = ((value - stepsRemaining)/value) * 100;
          progress.leftToGoString ="Only " + addCommas(stepsRemaining) + " steps to go";
        }
      }
      else{
        progress.goalCompleted = false;
        progress.percentComplete = 0;
        progress.leftToGoString = "You haven't started this goal!"
      }
    }); 

    goal1CurrentProgress = progress;

    queries.levelsGetTimeWorkouts(1, startedLevelDate, function(workouts){
      if (workouts[0] != null){
        var workoutTimeValue = levels.secondGoalNum;
        var workoutTime = workouts[0].time;
        var workoutTimeRemaining = workoutTimeValue - workoutTime;
        if (workoutTimeRemaining <= 0){
          goal2Progress.goalCompleted = true;
          goal2Progress.percentComplete = 100;
          goal2Progress.leftToGoString = "Complete!"
        }
        else{
          goal2Progress.goalCompleted = false;
          goal2Progress.percentComplete = ((workoutTimeValue - workoutTimeRemaining)/workoutTimeValue) * 100;
          var remaining = workoutTimeRemaining % 60;
          goal2Progress.leftToGoString = "Workout for " + remaining + "more minutes"
        }
      }
      else{
        goal2Progress.goalCompleted = false;
        goal2Progress.percentComplete = 0;
        goal2Progress.leftToGoString = "You haven't started this goal!"
      }
    });

    queries.levelsGetTimeSleeps(1, startedLevelDate, function(sleeps){
      if (sleeps[0] != null){
        var sleepTimeValue = levels.thirdGoalNum * 3600;
        var sleepTime = sleeps[0].duration;
        var sleepTimeRemaining = sleepTimeValue - sleepTime;
        if (sleepTimeRemaining <= 0){
          goal3Progress.goalCompleted = true;
          goal3Progress.percentComplete = 100;
          goal3Progress.leftToGoString = "Complete!"
        }
        else{
          goal3Progress.goalCompleted = false;
          goal3Progress.percentComplete = ((sleepTimeValue - sleepTimeRemaining)/sleepTimeValue) * 100;
          var remaining = sleepTimeRemaining % 60;
          goal3Progress.leftToGoString = remaining + "more minutes of sleep to complete this goal!"
        }
      }
      else{
        goal3Progress.goalCompleted = false;
        goal3Progress.percentComplete = 0;
        goal3Progress.leftToGoString = "You haven't started this goal!"
      }

      if (goal1CurrentProgress.goalCompleted && goal2Progress.goalCompleted && goal3Progress.goalCompleted){
      //this level is complete - go to next level
      //set new level start date
      showNextLevelButton = true;
    }
    });

  });

  setTimeout(function(){
      res.render('levels', 
        { currentLevel: currentLevel,
          daysOnLevel: daysOnLevel,
          goal1: {
            name: goal1Name,
            percentComplete: goal1CurrentProgress.percentComplete,
            leftToGo: goal1CurrentProgress.leftToGoString
          },
          goal2: {
            name: goal2Name,
            percentComplete: goal2Progress.percentComplete,
            leftToGo: goal2Progress.leftToGoString
          },
          goal3: {
            name: goal3Name,
            percentComplete: goal3Progress.percentComplete,
            leftToGo: goal3Progress.leftToGoString
          },
          dataGraphTesting: goal1CurrentProgress.percentComplete,
          showNextLevelButton: showNextLevelButton
        });
    }, 500);
});

app.get('/newLevel', function(req, res){
  res.render('newLevel');
});

app.get('/achievements', function(req,res){

    var earnedAchievements = new Array();

  if (returnMovesMax>10000){
    stepper1 = {name : "Stepper 1", description : "Take 10000 steps in a day"};
    earnedAchievements.push("stepper1");
  }
  else{
    stepper1 = {name : "Stepper 1", description : "FAILED"};
    earnedAchievements.push("stepper1"); 
  }
  
  if (returnMovesMax>20000){
    stepper2 = {name : "Stepper 2", description : "Take 20000 steps in a day"};
    earnedAchievements.push("stepper2");
  }
  else{
    stepper2 = {name : "Stepper 2", description : "FAILED"};
    earnedAchievements.push("stepper2"); 
  }
  
  if (returnMovesMax>30000){
    stepper3 = {name : "Stepper 3", description : "Take 30000 steps in a day"};
    earnedAchievements.push("stepper3");
  }
  else{
    stepper3 = {name : "Stepper 3", description : "FAILED"};
    earnedAchievements.push("stepper3"); 
  }

  if (returnMovesMax>40000){
    stepper4 = {name : "Stepper 4", description : "Take 40000 steps in a day"};
    earnedAchievements.push("stepper4");
  }
  else{
    stepper4 = {name : "Stepper 4", description : "FAILED"};
    earnedAchievements.push("stepper4"); 
  }

  if (returnMovesMax>50000){
    stepper3 = {name : "Stepper 5", description : "Take 50000 steps in a day"};
    earnedAchievements.push("stepper5");
  }
  else{
    stepper5 = {name : "Stepper 5", description : "FAILED"};
    earnedAchievements.push("stepper5"); 
  }

  if (returnSleepsMax>60*60*7){
    sleeper1 = {name : "Sleeper 1", description : "Sleep at least 7 hours in a day"};
    earnedAchievements.push("sleeper1");
  }
  else{
    sleeper1 = {name : "Sleeper 1", description : "FAILED"};
    earnedAchievements.push("sleeper1"); 
  }

  if (returnSleepsMax>60*60*8){
    sleeper2 = {name : "Sleeper 2", description : "Sleep at least 8 hours in a day"};
    earnedAchievements.push("sleeper2");
  }
  else{
    sleeper2 = {name : "Sleeper 2", description : "FAILED"};
    earnedAchievements.push("sleeper2"); 
  }

  if (returnWorkoutsMax>60*60){
    workout1 = {name : "Workout 1", description : "Workout for 1 hour in a day"};
    earnedAchievements.push("workout1");
  }
  else{
    workout1 = {name : "Workout 1", description : "FAILED"};
    earnedAchievements.push("workout1"); 
  }

  if (returnWorkoutsMax>60*60*2){
    workout2 = {name : "Workout 2", description : "Workout for 2 hours in a day"};
    earnedAchievements.push("workout2");
  }
  else{
    workout2 = {name : "Workout 2", description : "FAILED"};
    earnedAchievements.push("workout2"); 
  }

  if (returnWorkoutsMax>60*60*3){
    workout3 = {name : "Workout 3", description : "Workout for 3 hours in a day"};
    earnedAchievements.push("workout3");
  }
  else{
    workout3 = {name : "Workout 3", description : "FAILED"};
    earnedAchievements.push("workout3"); 
  }

  if (returnWorkoutsMax>60*60*5){
    workout5 = {name : "Workout 5", description : "Workout for 5 hours in a day"};
    earnedAchievements.push("workout5");
  }
  else{
    workout5 = {name : "Workout 5", description : "FAILED"};
    earnedAchievements.push("workout5"); 
  }

  if (returnWorkoutsMax>60*60*10){
    workout8 = {name : "Workout 10", description : "Workout for 10 hours in a day"};
    earnedAchievements.push("workout10");
  }
  else{
    workout10 = {name : "Workout 10", description : "FAILED"};
    earnedAchievements.push("workout10"); 
  }

  if (consecutiveStepMax>=2){
    cstepper1 = {name : "Consecutive Stepper 1", description : "Take 10000 steps 2 days in a row"};
    earnedAchievements.push("cstepper1");
  }
  else{
    cstepper1 = {name : "Consecutive Stepper 1", description : "FAILED"};
    earnedAchievements.push("cstepper1"); 
  }

  if (consecutiveStepMax>=3){
    cstepper2 = {name : "Consecutive Stepper 2", description : "Take 10000 steps 3 days in a row"};
    earnedAchievements.push("cstepper1");
  }
  else{
    cstepper2 = {name : "Consecutive Stepper 2", description : "FAILED"};
    earnedAchievements.push("cstepper2"); 
  }

  if (consecutiveStepMax>=5){
    cstepper3 = {name : "Consecutive Stepper 3", description : "Take 10000 steps 5 days in a row"};
    earnedAchievements.push("cstepper3");
  }
  else{
    cstepper3 = {name : "Consecutive Stepper 3", description : "FAILED"};
    earnedAchievements.push("cstepper3"); 
  }

  if (consecutiveStepMax>=7){
    cstepper4 = {name : "Consecutive Stepper 4", description : "Take 10000 steps every day for a week"};
    earnedAchievements.push("cstepper4");
  }
  else{
    cstepper4 = {name : "Consecutive Stepper 4", description : "FAILED"};
    earnedAchievements.push("cstepper4"); 
  }

  if (consecutiveStepMax>=14){
    cstepper5 = {name : "Consecutive Stepper 5", description : "Take 10000 steps every day for 2 weeks"};
    earnedAchievements.push("cstepper5");
  }
  else{
    cstepper5 = {name : "Consecutive Stepper 5", description : "FAILED"};
    earnedAchievements.push("cstepper5"); 
  }

  if (consecutiveStepMax>=30){
    cstepper6 = {name : "Consecutive Stepper 6", description : "Take 10000 steps every day for a month"};
    earnedAchievements.push("cstepper6");
  }
  else{
    cstepper6 = {name : "Consecutive Stepper 6", description : "FAILED"};
    earnedAchievements.push("cstepper6"); 
  }

  if (consecutiveStepMax>=365){
    cstepper7 = {name : "Consecutive Stepper 7", description : "Take 10000 steps every day for a year"};
    earnedAchievements.push("cstepper7");
  }
  else{
    cstepper7 = {name : "Consecutive Stepper 7", description : "FAILED"};
    earnedAchievements.push("cstepper7"); 
  }

  if (consecutiveSleepMax>=2){
    csleeper1 = {name : "Consecutive Sleeper 1", description : "Sleep at least 8 hours for 2 days in a row"};
    earnedAchievements.push("csleeper1");
  }
  else{
    csleeper1 = {name : "Consecutive Sleeper 1", description : "FAILED"};
    earnedAchievements.push("csleeper1"); 
  }

  if (consecutiveSleepMax>=3){
    csleeper2 = {name : "Consecutive Sleeper 2", description : "Sleep at least 8 hours for 3 days in a row"};
    earnedAchievements.push("csleeper1");
  }
  else{
    csleeper2 = {name : "Consecutive Sleeper 2", description : "FAILED"};
    earnedAchievements.push("csleeper2"); 
  }

  if (consecutiveSleepMax>=5){
    csleeper3 = {name : "Consecutive Sleeper 3", description : "Sleep at least 8 hours for 5 days in a row"};
    earnedAchievements.push("csleeper3");
  }
  else{
    csleeper3 = {name : "Consecutive Sleeper 3", description : "FAILED"};
    earnedAchievements.push("csleeper3"); 
  }

  if (consecutiveSleepMax>=7){
    csleeper4 = {name : "Consecutive Sleeper 4", description : "Sleep at least 8 hours every day for a week"};
    earnedAchievements.push("csleeper4");
  }
  else{
    csleeper4 = {name : "Consecutive Sleeper 4", description : "FAILED"};
    earnedAchievements.push("csleeper4"); 
  }

  if (consecutiveSleepMax>=14){
    csleeper5 = {name : "Consecutive Sleeper 5", description : "Sleep at least 8 hours every day for 2 weeks"};
    earnedAchievements.push("csleeper5");
  }
  else{
    csleeper5 = {name : "Consecutive Sleeper 5", description : "FAILED"};
    earnedAchievements.push("csleeper5"); 
  }

  if (consecutiveSleepMax>=30){
    csleeper6 = {name : "Consecutive Sleeper 6", description : "Sleep at least 8 hours every day for a month"};
    earnedAchievements.push("csleeper6");
  }
  else{
    csleeper6 = {name : "Consecutive Sleeper 6", description : "FAILED"};
    earnedAchievements.push("csleeper6"); 
  }

  if (consecutiveSleepMax>=365){
    csleeper7 = {name : "Consecutive Sleeper 7", description : "Sleep at least 8 hours every day for a year"};
    earnedAchievements.push("csleeper7");
  }
  else{
    csleeper7 = {name : "Consecutive Sleeper 7", description : "FAILED"};
    earnedAchievements.push("csleeper7"); 
  }

  if (consecutiveWorkoutMax>=2){
    cworkout1 = {name : "Consecutive Workout 1", description : "Log a workout at least 1 hour long for 2 days in a row"};
    earnedAchievements.push("cworkout1");
  }
  else{
    cworkout1 = {name : "Consecutive Workout 1", description : "FAILED"};
    earnedAchievements.push("cworkout1"); 
  }

  if (consecutiveWorkoutMax>=3){
    cworkout2 = {name : "Consecutive Workout 2", description : "Log a workout at least 1 hour long for 3 days in a row"};
    earnedAchievements.push("cworkout2");
  }
  else{
    cworkout2 = {name : "Consecutive SleeWorkouter 2", description : "FAILED"};
    earnedAchievements.push("cworkout2"); 
  }

  if (consecutiveWorkoutMax>=5){
    cworkout3 = {name : "Consecutive Workout 3", description : "Log a workout at least 1 hour long for 5 days in a row"};
    earnedAchievements.push("cworkout3");
  }
  else{
    cworkout3 = {name : "Consecutive Workout 3", description : "FAILED"};
    earnedAchievements.push("cworkout3"); 
  }

  if (consecutiveWorkoutMax>=7){
    cworkout4 = {name : "Consecutive Workout 4", description : "Log a workout at least 1 hour long every day for a week"};
    earnedAchievements.push("cworkout4");
  }
  else{
    cworkout4 = {name : "Consecutive Workout 4", description : "FAILED"};
    earnedAchievements.push("cworkout4"); 
  }

  if (consecutiveWorkoutMax>=14){
    cworkout5 = {name : "Consecutive Workout 5", description : "Log a workout at least 1 hour long every day for 2 weeks"};
    earnedAchievements.push("cworkout5");
  }
  else{
    cworkout5 = {name : "Consecutive Workout 5", description : "FAILED"};
    earnedAchievements.push("cworkout5"); 
  }

  if (consecutiveWorkoutMax>=30){
    cworkout6 = {name : "Consecutive Workout 6", description : "Log a workout at least 1 hour long every day for a month"};
    earnedAchievements.push("cworkout6");
  }
  else{
    cworkout6 = {name : "Consecutive Workout 6", description : "FAILED"};
    earnedAchievements.push("cworkout6"); 
  }

  if (consecutiveWorkoutMax>=365){
    cworkout7 = {name : "Consecutive Workout 7", description : "Log a workout at least 1 hour long every day for a year"};
    earnedAchievements.push("cworkout7");
  }
  else{
    cworkout7 = {name : "Consecutive Workout 7", description : "FAILED"};
    earnedAchievements.push("cworkout7"); 
  }

  if (returnAllTimeMoves>=1000){
    asteps1 = {name : "Total Steps 1", description : "Reached 1,000 total steps"};
    earnedAchievements.push("asteps1");
  }
  else{
    asteps1 = {name : "Total Steps 1", description : "FAILED"};
    earnedAchievements.push("asteps1"); 
  }

  if (returnAllTimeMoves>=10000){
    asteps2 = {name : "Total Steps 2", description : "Reached 10,000 total steps"};
    earnedAchievements.push("asteps2");
  }
  else{
    asteps2 = {name : "Total Steps 2", description : "FAILED"};
    earnedAchievements.push("asteps2"); 
  }

  if (returnAllTimeMoves>=100000){
    asteps3 = {name : "Total Steps 3", description : "Reached 100,000 total steps"};
    earnedAchievements.push("asteps3");
  }
  else{
    asteps3 = {name : "Total Steps 3", description : "FAILED"};
    earnedAchievements.push("asteps3"); 
  }

  if (returnAllTimeMoves>=1000000){
    asteps4 = {name : "Total Steps 4", description : "Reached 1,000,000 total steps"};
    earnedAchievements.push("asteps4");
  }
  else{
    asteps4 = {name : "Total Steps 4", description : "FAILED"};
    earnedAchievements.push("asteps4"); 
  }

  if (returnAllTimeMoves>=5000000){
    asteps5 = {name : "Total Steps 5", description : "Reached 5,000,000 total steps"};
    earnedAchievements.push("asteps5");
  }
  else{
    asteps5 = {name : "Total Steps 5", description : "FAILED"};
    earnedAchievements.push("asteps5"); 
  }

  if (returnAllTimeMoves>=10000000){
    asteps6 = {name : "Total Steps 6", description : "Reached 10,000,000 total steps"};
    earnedAchievements.push("asteps6");
  }
  else{
    asteps6 = {name : "Total Steps 6", description : "FAILED"};
    earnedAchievements.push("asteps6"); 
  }
    
  res.render('achievements', 
    earnedAchievements);
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
