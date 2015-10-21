var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var movesSchema = new mongoose.Schema({
  userID: Number, 
  xid: String,      //unique ID for this event (can get more data with it)
  date: Number,     //YYYYMMDD (int)
  steps: Number,
  active_time: Number,    //in seconds 
  distance: Number,       //in meters
  calories: Number,
  snapshot_image: String,     //URI to link of image
  time_created: Number,     //epoch time
  time_updated: Number,     //epoch time of when this move was last updated
  time_completed: Number    //epoch time
});

var Moves = mongoose.model('Moves', movesSchema);

module.exports = Moves;
