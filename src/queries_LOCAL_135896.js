var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var workouts = require('../databaseSchema/workouts.js');
var users = require('../databaseSchema/users.js');
var levels = require('../databaseSchema/levels.js');
var database 
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

database.on('error', function(err) {
    console.log(err.message);
});

database.once('open', function() {
    console.log('mongodb connection open');
});

getMovesAggregation = function(callback){ 
    moves.aggregate([ 
        { $group: 
            { _id: '$userID', 
              movesAvg: { $avg: '$steps'},
              stepsTotal: {$sum: '$steps'}
            }
        } ], function(err, results)  {
            if (err){
                throw err
            }
            else {
                callback(results);
            }
        }
    ); 
}

getSleepsAggregation = function(callback){
    sleeps.aggregate([
        { $group:
            {_id: '$userID',
             sleepsAvg: {$avg: '$duration'},
             sleepsTotal: {$sum: '$duration'}
            }

        }], function (err, results){
            if (err){
                throw err
            }
            else {
                callback(results);
            }
        }
    );
}

getWorkoutsAggregation = function(callback) {
    workouts.aggregate([
        { $group:
            {_id: '$userID',
             workoutsStepsAvg: {$avg: '$steps'},
             workoutsCaloriesAvg: {$avg: '$calories'},
             workoutsTimeAvg: {$avg: '$time'},
             workoutsDistanceAvg: {$avg: '$meters'},
             workoutsStepsTotal: {$sum: '$steps'},
             workoutsCaloriesTotal: {$sum: '$calories'},
             workoutsTimeTotal: {$sum: '$time'},
             workoutsDistanceTotal: {$sum: '$meters'}
            }

        }], function (err, results){
            if (err){
                throw err
            }
            else {
                callback(results);
            }
        }
    );
}

insertSleep = function(sleep) {

   var newSleep = new sleeps({
        userID: 1,
        xid: sleep.xid,
        date: sleep.date,
        time_created: sleep.time_created,
        time_completed: sleep.time_completed,
        title: sleep.title,
        awakenings: sleep.details.awakenings,
        light: sleep.details.light,
        deep: sleep.details.deep,
        awake: sleep.details.awake,
        duration: sleep.details.duration,
        asleep_time: sleep.details.asleep_time,
        awake_time: sleep.details.awake_time
   });

   newSleep.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

getSleeps = function(userID, callback){
    var queryVals = sleeps.find({userID: userID}).sort({_id:-1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps);
        }
    });
}

getLatestSleep = function(userID, callback) {
    sleeps.findOne({userID: userID}).sort({time_completed: -1}).exec(
        function(err, sleeps) {

        if(err) {
            throw err;
        }
        else {
            callback(sleeps);
        }
    });
}


insertMove = function(move) {

   var newMove = new moves({
        userID: 1,
        xid: move.xid,
        date: move.date,
        time_created: move.time_created,
        time_updated: move.time_updated,
        time_completed: move.time_completed,
        steps: move.details.steps,
        active_time: move.details.active_time,
        distance: move.details.distance,
        calories: move.details.calories
   });

   newMove.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

getMoves = function(userID, callback){
    var queryVals = moves.find({userID: userID}).sort({_id:-1});

    queryVals.exec(function (err, moves) {
        if (err) 
            throw err;
        else {
            callback(moves);
        }
    });
}

getLatestMove = function(userID, callback) {

    moves.findOne({userID: userID}).sort({time_completed: -1}).exec(
        function(err, moves) {

        if (err) {
            throw err;
        }
        else{
            callback(moves);
        }
    });
}

insertWorkout = function(workout) {

   var newWorkout= new workouts({
        userID: 1,
        xid: workout.xid,
        date: workout.date,
        time_created: workout.time_created,
        time_completed: workout.time_completed,
        title: workout.title,
        steps: workout.details.steps,
        time: workout.details.time,
        meters: workout.details.meters,
        calories: workout.details.calories,
        intensity: workout.details.intensity
   });

   newWorkout.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

getWorkouts = function(userID, callback){
    var queryVals = workouts.find({userID: userID}).sort({_id:-1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps);
        }
    });
}

getLatestWorkout = function(userID, callback) {
    workouts.findOne({userID: userID}).sort({time_completed: -1}).exec(
        function(err, workouts) {

        if(err) {
            throw err;
        }
        else {
            callback(workouts);
        }
    });
}


insertLevel = function(level) {

   var newLevel = new levels({
      levelNum: level.levelNum,
      levelName: level.levelName,          
      firstGoal: level.firstGoal,        //description of goal
      firstGoalNum: level.firstGoalNum,     //how to quantify the goal
      firstGoalType: level.firstGoalType,  //sleeps, moves, or workouts
      firstGoalDescriptor: level.firstGoalDescriptor, //for example - steps or active_time (use this when referencing moves object)
      secondGoal: level.secondGoal,
      secondGoalNum: level.secondGoalNum,
      secondGoalType: level.secondGoalType,  //sleeps, moves, or workouts
      secondGoalDescriptor: level.secondGoalDescriptor, //for example - steps or active_time (use this when referencing moves object)
      thirdGoal: level.thirdGoal,
      thirdGoalNum: level.thirdGoalNum,
      thirdGoalType: level.thirdGoalType,  //sleeps, moves, or workouts
      thirdGoalDescriptor: level.thirdGoalDescriptor, //for example - steps or active_time (use this when referencing moves object)
   });

   newLevel.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

getLevel = function(levelNum, callback) {
    levels.findOne({levelNum: levelNum}).exec(
        function(err, levels) {

        if(err) {
            throw err;
        }
        else {
            callback(levels);
        }
    });
}

//returns all days steps since the user started the level, in order of most steps to least steps
levelsGetNumSteps = function(userID, startedLevelDate, value, name, callback){
    var queryVals = moves.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({steps:-1});

    queryVals.exec(function (err, moves) {
        if (err) 
            throw err;
        else {
            callback(moves, value, name);
        }
    });
}

levelsGetTimeWorkouts = function(userID, startedLevelDate, value, name, callback){
    var queryVals = workouts.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({time:-1});

    queryVals.exec(function (err, workouts) {
        if (err) 
            throw err;
        else {
            callback(workouts, value, name);
        }
    });
}

levelsGetCaloriesWorkouts = function(userID, startedLevelDate, value, name, callback){
    var queryVals = workouts.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({calories:-1});

    queryVals.exec(function (err, workouts) {
        if (err) 
            throw err;
        else {
            callback(workouts, value, name);
        }
    });
}

levelsGetStepsWorkouts = function(userID, startedLevelDate, value, name, callback){
    var queryVals = workouts.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({steps:-1});

    queryVals.exec(function (err, workouts) {
        if (err) 
            throw err;
        else {
            callback(workouts, value, name);
        }
    });
}

levelsGetTimeSleeps = function(userID, startedLevelDate, value, name, callback){
    var queryVals = sleeps.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({duration:-1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps, value, name);
        }
    });
}

levelsGetAwakeningsSleeps = function(userID, startedLevelDate, value, name, callback){
    var queryVals = sleeps.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({awakenings:1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps, value, name);
        }
    });
}

levelsGetTimeAwakeSleeps = function(userID, startedLevelDate, value, name, callback){
    var queryVals = sleeps.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({awake:1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps, value, name);
        }
    });
}

levelsGetDistance = function(userID, startedLevelDate, value, name, callback){
    var queryVals = moves.find({$and: [{userID: userID}, {date: {$gt: startedLevelDate}}]}).sort({distance:-1});

    queryVals.exec(function (err, moves) {
        if (err) 
            throw err;
        else {
            callback(moves,value, name);
        }
    });
}

levelsGetUserLevel = function(userID, callback){
    users.findOne({userID: userID}).exec(
        function(err, user) {

        if(err) {
            throw err;
        }
        else {
            callback(user);
        }
    });
}

insertUser = function(user) {

   var newUser= new users({
      userID: user.userID,
      token: user.token,
      xid: user.xid,
      first: user.first,
      last: user.last,
      username: user.username,
      level: user.level,
      challengeProgress: user.challengeProgress,
      dashboard: user.dashboard,
      dateStartedLevel: user.dateStartedLevel
   });

   newUser.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

updateUserLevelInfo = function(userID, newLevel, startedLevelDate){
    users.update({userID: userID}, {$set:{level: newLevel, dateStartedLevel: startedLevelDate}}).exec(
        function(err, user) {
            if(err) {
                throw err;
            }
    });
}


module.exports.insertSleep = insertSleep;
module.exports.getSleeps = getSleeps;
module.exports.getLatestSleep = getLatestSleep;
module.exports.insertMove = insertMove;
module.exports.getLatestMove = getLatestMove;
module.exports.getMoves = getMoves;
module.exports.insertWorkout = insertWorkout;
module.exports.getLatestWorkout = getLatestWorkout;
module.exports.getWorkouts = getWorkouts;
module.exports.getMovesAggregation = getMovesAggregation;
module.exports.getSleepsAggregation = getSleepsAggregation;
module.exports.getWorkoutsAggregation = getWorkoutsAggregation;
module.exports.insertLevel = insertLevel;
module.exports.getLevel = getLevel;
module.exports.levelsGetNumSteps = levelsGetNumSteps;
module.exports.levelsGetTimeWorkouts = levelsGetTimeWorkouts;
module.exports.levelsGetTimeSleeps = levelsGetTimeSleeps;
module.exports.levelsGetUserLevel = levelsGetUserLevel;
module.exports.insertUser = insertUser;
module.exports.updateUserLevelInfo = updateUserLevelInfo;
module.exports.levelsGetDistance = levelsGetDistance;
module.exports.levelsGetStepsWorkouts = levelsGetStepsWorkouts;
module.exports.levelsGetAwakeningsSleeps = levelsGetAwakeningsSleeps;
module.exports.levelsGetCaloriesWorkouts = levelsGetCaloriesWorkouts;
module.exports.levelsGetTimeAwakeSleeps = levelsGetTimeAwakeSleeps;