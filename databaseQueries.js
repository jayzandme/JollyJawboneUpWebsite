var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var sleepsSchema = new mongoose.Schema({
  userID: Number, 
  date: Number,
  timeFallAsleep: String,
  timeWokenUp: String,
  awakenings: Number,
  remSleepTime: Number,
  lightSleepTime: Number,
  deepSleepTime: Number,
  timeSpentAwake: Number,
  duration: Number,
  image: String
});

var Sleeps = mongoose.model('Sleeps', sleepsSchema);

module.exports = Sleeps;