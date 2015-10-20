var mongoose = require('mongoose');

var database 
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

database.on('error', function(err) {
    console.log(err.message);
});

database.once('open', function() {
    console.log('mongodb connection open');
});

var Sleeps = require('./databaseSchema/sleeps.js');
var Users = require('./databaseSchema/users.js');

insertUser = function(data) {

};
