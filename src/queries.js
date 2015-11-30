var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var workouts = require('../databaseSchema/workouts.js');
var users = require('../databaseSchema/users.js');
var _ = require('underscore');
var levels = require('../databaseSchema/levels.js');
var database 
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

database.on('error', function(err) {
    console.log(err.message);
});

database.once('open', function() {
    console.log('mongodb connection open');
});

// clears the database
clearDatabase = function(callback) {
    moves.remove({}, function() {

        console.log('moves removed');
        users.remove({}, function() {

            console.log('users removes');
            sleeps.remove({}, function() {

                console.log('sleeps removes');
                workouts.remove({}, function() {

                    console.log('workouts removed');
                    levels.remove({}, function() {

                        console.log('levels removed');
                        callback();
                    }) 
                })
            })
        })
    });
}

// gets aggregate data for the Moves in the database 
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

// gets aggregate data for the Sleeps in the database
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

// gets aggregate data for the Workouts in the database
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

// inserts an array of sleeps into the database
insertSleeps = function(sleeps, userID, callback) {
    
    var inserted = _.after(sleeps.length, callback);

    if (sleeps.length < 1) {
        callback();
    }

    for (var i = 0; i < sleeps.length; i++) {
        insertSleep(sleeps[i], userID, function() {
            inserted();
        });
    }
}

// inserts a sleep into the database
insertSleep = function(sleep, userID, callback) {

   var newSleep = new sleeps({
        userID: userID,
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

   callback();
};

// gets all the sleeps for a user in the database
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

// gets the most recent sleep for a user in the database
getLatestSleep = function(userID, callback) {

    sleeps.findOne({userID: userID}).sort({time_completed: -1}).exec(
        function(err, sleeps) {
            if(err) {
                console.log('error');
                throw err;
            }
            else {
                callback(sleeps);
            }
    });
}


// inserts an array of moves into the database
insertMoves = function(moves, userID, callback) {
    
    var inserted = _.after(moves.length, callback);

    if (moves.length < 1) {
        callback();
    }

    for (var i = 0; i < moves.length; i++) {
        insertMove(moves[i], userID, function() {
            inserted();
        });
    }

}

// inserts a move into the database
insertMove = function(move, userID, callback) {

   var newMove = new moves({
        userID: userID,
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

   callback();

};

// gets all the moves for a user in the database
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

// get the most recent move for a user
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

// inserts an array of workouts into the database
insertWorkouts = function(workouts, userID, callback) {
    
    var inserted = _.after(workouts.length, callback);

    if (workouts.length < 1) {
        callback();
    }

    for (var i = 0; i < workouts.length; i++) {
        insertWorkout(workouts[i], userID, function() {
            inserted();
        });
    }

}

// inserts a workout into the database
insertWorkout = function(workout, userID, callback) {

   var newWorkout = new workouts({
        userID: userID,
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

    callback();

};

// gets all the workouts in the database for the given userID
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

// gets the most recent workout for a user in the database
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

// inserts a user into the database
insertUser = function(user, callback) {

    var today = new Date();
    var todayDay = today.getDate();
    var todayMonth = today.getMonth() + 1;
    var todayYear = today.getFullYear();

    if (todayDay < 10) {
        todayDay = '0' + todayDay;
    } 

    if (todayMonth < 10) {
        todayMonth = '0' + todayMonth;
    } 

    today = parseInt(todayYear, 10) * 10000 + 
            parseInt(todayMonth, 10) * 100 + 
            parseInt(todayDay, 10);

    nextID(function(nextUserID) {

        var newUser = new users({
            userID: nextUserID,
            token: user.token,
            xid: user.xid,
            first: user.first,
            last: user.last,
            level: 1,
            dateStartedLevel: today,
            challengeProgress: 0,
            dashboard: ""
        });

        nextUserID++;

        newUser.save(function (err, thor) {
            if (err) {
                return console.error(err);
            } else {
                callback(nextUserID - 1);
            }
        });
    });
}

// determines if a user is in the database from their xid
// returns their ID
findUser = function(xid, callback) {

    users.findOne({xid: xid}).exec(function(err, user) {
        if (err) {
            throw err;
        } else {
            callback(user);
        }
    });

}

// finds a user given a userID
findUserByID = function(userID, callback) {

    users.findOne({userID: userID}).exec(function(err, user) {
        if (err) {
            throw err;
        } else {
            callback(user);
        }
    });
}

// returns the next userID
function nextID (callback) {
    
    users.findOne({}).sort({userID: -1}).exec(function(err, user) {
        if (err) {
            throw err;
        } else {
            if (user) {
                callback(user.userID + 1);
            } else {
                callback(0);
            }
        }
    });
}

insertLevel = function(level, callback) {

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
        callback();
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
        if (err) {
            console.log(err);
            throw err;
        }
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

updateUserLevelInfo = function(userID, newLevel, startedLevelDate){
    users.update({userID: userID}, {$set:{level: newLevel, dateStartedLevel: startedLevelDate}}).exec(
        function(err, user) {
            if(err) {
                throw err;
            }
    });
}

updateUserToken = function(userID, newToken, callback) {
    users.update({userID : userID}, {$set: {token: newToken}}).exec(
        function (err, user){
            if (err) {
                throw err;
            } else {
                findUserByID(userID, callback);
            }
        });
}

// gets the total steps this week for a user in the database
weeklyGetMoves = function(userID, weekStartDate, callback) {
    var queryVals = moves.aggregate([ 
        {
            $match:
                {userID: userID, date: {$gt: 20151023}} 
        } 
        ,
        { $group: 
            { _id: '$userID', 
              stepsTotal: {$sum: '$steps'}
            }
        } ], function(err, results)  {
            if (err){
                throw err
            }
            else {
                console.log(results)
                callback(results);
            }
        }
    ); 

}


// gets the total sleep this week for a user in the database
weeklyGetSleeps = function(userID, callback) {

    var queryVals = sleeps.find({$and: [{userID: userID}, {date: {$gt: weekStartDate}}]});

    queryVals.exec(function (err, sleeps) {
        if (err) {
            console.log(err);
            throw err;
        }
        else {
            callback(sleeps);
        }
    });
}

module.exports.insertSleep = insertSleep;
module.exports.insertSleeps = insertSleeps;
module.exports.insertMove = insertMove;
module.exports.insertMoves = insertMoves;
module.exports.insertWorkout = insertWorkout;
module.exports.insertWorkouts = insertWorkouts;
module.exports.getSleeps = getSleeps;
module.exports.getLatestSleep = getLatestSleep;
module.exports.getMoves = getMoves;
module.exports.getLatestMove = getLatestMove;
module.exports.getWorkouts = getWorkouts;
module.exports.getLatestWorkout = getLatestWorkout;
module.exports.getMovesAggregation = getMovesAggregation;
module.exports.getSleepsAggregation = getSleepsAggregation;
module.exports.getWorkoutsAggregation = getWorkoutsAggregation;
module.exports.insertLevel = insertLevel;
module.exports.getLevel = getLevel;
module.exports.levelsGetNumSteps = levelsGetNumSteps;
module.exports.levelsGetTimeWorkouts = levelsGetTimeWorkouts;
module.exports.levelsGetTimeSleeps = levelsGetTimeSleeps;
module.exports.levelsGetUserLevel = levelsGetUserLevel;
module.exports.updateUserLevelInfo = updateUserLevelInfo;
module.exports.levelsGetDistance = levelsGetDistance;
module.exports.levelsGetStepsWorkouts = levelsGetStepsWorkouts;
module.exports.levelsGetAwakeningsSleeps = levelsGetAwakeningsSleeps;
module.exports.levelsGetCaloriesWorkouts = levelsGetCaloriesWorkouts;
module.exports.levelsGetTimeAwakeSleeps = levelsGetTimeAwakeSleeps;
module.exports.insertUser = insertUser;
module.exports.findUser = findUser;
module.exports.findUserByID = findUserByID;
module.exports.clearDatabase = clearDatabase;
module.exports.updateUserToken = updateUserToken;
module.exports.weeklyGetMoves = weeklyGetMoves;
module.exports.weeklyGetSleeps = weeklyGetSleeps;
