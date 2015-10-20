var mongoose = require('mongoose');
var sleeps = require('./databaseSchema/sleeps.js');
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

getSleeps = function(userID) {
    sleeps.find({userID: userID}, function(err, sleeps) {
        if (err) {
            throw err;
        }
        else {
            console.log(sleeps);
        }
    });
}

module.exports.insertSleep = insertSleep;
module.exports.getSleeps = getSleeps;
