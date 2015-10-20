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

insertSleep = function(data) {

   var newSleep = new sleeps({
        userID: 1,
        xid: 'test',
        date: data.date,
        time_created: data.time_created,
        time_completed: data.time_completed,
        title: data.title,
        awakenings: data.awakenings,
        light: data.light,
        awake: data.awake,
        duration: data.duration
   });

   newSleep.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
        console.dir(test);
   }

};
