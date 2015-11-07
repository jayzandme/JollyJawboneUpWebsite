var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var levelsSchema = new mongoose.Schema({
  levelNum: Number,
  levelName: String,          
  firstGoal: String,    //description of goal
  firstGoalNum: Number,   //how to quantify the goal
  firstGoalType: String,  //sleeps, moves, or workouts
  firstGoalDescriptor: String, //for example - steps or active_time (use this when referencing moves object)
  firstGoalProgressTemplate: String,  //for displaying in the html what is left to complete this goal
  secondGoal: String,
  secondGoalNum: Number,
  secondGoalType: String,
  secondGoalDescriptor: String,
  secondGoalProgressTemplate: String,
  thirdGoal: String,
  thirdGoalNum: Number,
  thirdGoalType: String,
  thirdGoalDescriptor: String,
  thirdGoalProgressTemplate: String

});

var Levels = mongoose.model('Levels', levelsSchema);

module.exports = Levels;