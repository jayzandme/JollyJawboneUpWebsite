var mongoose = require('mongoose');
var sleeps = require('./databaseSchema/sleeps.js');
<<<<<<< HEAD
var moves = require('./databaseSchema/moves.js')
=======
var moves = require('./databaseSchema/moves.js');
>>>>>>> API-queries
var users = require('./databaseSchema/users.js');
var database 
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

database.on('error', function(err) {
    console.log(err.message);
});

database.once('open', function() {
    console.log('mongodb connection open');
});

insertSleep = function(sleep) {

   var newSleep = new sleeps({
        userID: 1,
        xid: sleep.xid,
        date: sleep.date,
        time_created: sleep.time_created,
        time_completed: sleep.time_completed,
        title: sleep.title,
        awakenings: sleep.awakenings,
        light: sleep.light,
        awake: sleep.awake,
        duration: sleep.duration
   });

   newSleep.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

insertMove = function(move) {

    var newMove = new moves({
      userID: 1, 
      xid: move.xid,      //unique ID for this event (can get more data with it)
      date: move.date,     //YYYYMMDD (int)
      steps: move.steps,
      active_time: move.active_time,    //in seconds 
      distance: move.distance,       //in meters
      calories: move.calories,
      snapshot_image: move.snapshot_image,     //URI to link of image
      time_created: move.time_created,     //epoch time
      time_updated: move.time_updated,     //epoch time of when this move was last updated
      time_completed: move.time_completed    //epoch time

    });

    newMove.save(function(err, thor) {
        if (err){
            return console.error(err);
        }
    });
}

getSleeps = function(userID) {
    sleeps.find({userID: userID}, function(err, sleeps) {
        if (err) {
            throw err;
        }
        else {
            return sleeps;
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
        steps: move.steps,
        active_time: move.active_time,
        distance: move.distance,
        calories: move.calories
   });

   newMove.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
   });

};

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

module.exports.insertSleep = insertSleep;
module.exports.getSleeps = getSleeps;
<<<<<<< HEAD
module.exports.insertMove = insertMove;
=======
module.exports.getLatestSleep = getLatestSleep;
module.exports.insertMove = insertMove;
module.exports.getLatestMove = getLatestMove;
>>>>>>> API-queries
