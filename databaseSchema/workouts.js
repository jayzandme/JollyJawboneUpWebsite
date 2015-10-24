var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var workoutsSchema = new mongoose.Schema({
  userID: Number, 
  xid: String,              //ID for this event (can get more data with it)
  date: Number,             //YYYYMMDD (int)
  time_created: Number,     //epoch time
  time_completed: Number,   //epoch time
  title: String,            //ex. 'Run'
  steps: Number,            //in details 
  time: Number,            //in details - seconds
  meters: Number,             //in details
  calories: Number,            //in details
  intensity: Number           //in details
});

var Workouts = mongoose.model('Workouts', workoutsSchema);

module.exports = Workouts;
