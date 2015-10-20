var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var sleepsSchema = new mongoose.Schema({
  userID: Number, 
  xid: String,      //unique ID for this event (can get more data with it)
  date: Number,     //YYYYMMDD (int)
  time_created: Number,     //epoch time
  time_completed: Number,     //epoch time
  title: String,        //ex. '5h 30m'
  awakenings: Number,     //in details  - number of times awakened
  //remSleepTime: Number,
  light: Number,   //in details - seconds
  //deepSleepTime: Number,
  awake: Number,            //in details  - seconds
  duration: Number       //in details  - total time for this sleep event in seconds
  //image: String
});

var Sleeps = mongoose.model('Sleeps', sleepsSchema);

module.exports = Sleeps;
