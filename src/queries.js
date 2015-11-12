var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var workouts = require('../databaseSchema/workouts.js');
var users = require('../databaseSchema/users.js');
var _ = require('underscore');
var database 
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

database.on('error', function(err) {
    console.log(err.message);
});

database.once('open', function() {
    console.log('mongodb connection open');
});

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
insertSleeps = function(sleeps, callback) {
    
    var inserted = _.after(sleeps.length, callback);

    if (sleeps.length < 1) {
        callback();
    }

    for (var i = 0; i < sleeps.length; i++) {
        insertSleep(sleeps[i], function() {
            inserted();
        });
    }
}

// inserts a sleep into the database
insertSleep = function(sleep, callback) {

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
insertMoves = function(moves, callback) {
    
    var inserted = _.after(moves.length, callback);

    if (moves.length < 1) {
        callback();
    }

    for (var i = 0; i < moves.length; i++) {
        insertMove(moves[i], function() {
            inserted();
            console.log('inserted: ' + i + ' of ' + moves.length);
        });
    }

}

// inserts a move into the database
insertMove = function(move, callback) {

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

   callback();

};

// gets all the moves for a user in the database
getMoves = function(userID, callback){
    var queryVals = moves.find({userID: userID}).sort({_id:-1});

    queryVals.exec(function (err, sleeps) {
        if (err) 
            throw err;
        else {
            callback(sleeps);
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
insertWorkouts = function(workouts, callback) {
    
    var inserted = _.after(workouts.length, callback);

    if (workouts.length < 1) {
        callback();
    }

    for (var i = 0; i < workouts.length; i++) {
        insertWorkout(workouts[i], function() {
            inserted();
        });
    }

}

// inserts a workout into the database
insertWorkout = function(workout, callback) {

   var newWorkout = new workouts({
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

    nextID(function(nextUserID) {

        var newUser = new users({
            userID: nextUserID,
            token: user.token,
            xid: user.xid,
            first: user.first,
            last: user.last,
            level: 0,
            challengeProgress: 0,
            dashboard: ""
        });

        nextUserID++;

        newUser.save(function (err, thor) {
            if (err) {
                return console.error(err);
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
module.exports.insertUser = insertUser;
module.exports.findUser = findUser;
