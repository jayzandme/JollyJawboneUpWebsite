<<<<<<< HEAD
var mongoose = require('mongoose');
=======
var mongoose = require("mongoose");
>>>>>>> API-queries
var Schema = mongoose.Schema;

// create a schema
var movesSchema = new mongoose.Schema({
    userID: Number,
    xid: String,
    date: Number,
    steps: Number,
    active_time: Number,
    distance: Number,
    calories: Number,
    time_created: Number,
    time_updated: Number,
    time_completed: Number

});

var Moves = mongoose.model('Moves', movesSchema);

module.exports = Moves;
