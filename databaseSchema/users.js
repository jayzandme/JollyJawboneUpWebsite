var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new mongoose.Schema({

    userID: Number,
    token: String,
    name: String,
    username: String,
    level: Number,
    challengeProgress: Number,
    levelProgress: Number,
    dashboard: String

});

var Users = mongoose.model('Users', userSchema);

module.exports = Users;
