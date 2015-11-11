var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new mongoose.Schema({
  userID: Number, 
  token: String,
  xid: String,          //unique ID for this user
  first: String,        //first name for the user
  last: String,         //last name for the user
  username: String,
  level: Number,
  challengeProgress: Number,
  dashboard: String,
  dateStartedLevel: Number
});

var User = mongoose.model('User', userSchema);

module.exports = User;