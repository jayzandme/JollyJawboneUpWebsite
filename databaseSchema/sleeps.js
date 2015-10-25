var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var sleepsSchema = new mongoose.Schema({
  userID: Number, 
  xid: String,              //ID for this event (can get more data with it)
  date: Number,             //YYYYMMDD (int)
  time_created: Number,     //epoch time
  time_completed: Number,   //epoch time
  title: String,            //ex. '5h 30m'
  awakenings: Number,       //in details - number of times awakened
  light: Number,            //in details - seconds
  deep: Number,             //in details - seconds
  awake: Number,            //in details - seconds
  duration: Number,         //in details - time for this sleep event in seconds
  asleep_time: Number,      //in details - time fall asleep in epoch time
  awake_time: Number        //in details - time woke up in epoch time
});

var Sleeps = mongoose.model('Sleeps', sleepsSchema);

module.exports = Sleeps;
