var queries = require('./src/queries.js');

level1 = {
    levelNum: 1,
    levelName: "First Level!",
    firstGoal: "Take 2,000 steps in day", //description of goal
    firstGoalNum: 2000, //how to quantify the goal
    firstGoalType: "moves", //sleeps, moves, or workouts
    firstGoalDescriptor: "steps", //for example - steps or active_time (use this when referencing moves object)
    secondGoal: "30 Minute Workout",
    secondGoalNum: 1800, //seconds
    secondGoalType: "workouts",
    secondGoalDescriptor: "time",
    thirdGoal: "Sleep 8 hours",
    thirdGoalNum: 8, //hours
    thirdGoalType: "sleeps",
    thirdGoalDescriptor: "asleep_time"
}

queries.insertLevel(level1);

level2 = {
    levelNum: 2,
    levelName: "Second Level!",
    firstGoal: "Move 3 miles in a day", //description of goal
    firstGoalNum: 4828, //this is the number of meters //how to quantify the goal
    firstGoalType: "moves", //sleeps, moves, or workouts
    firstGoalDescriptor: "distance", //for example - steps or active_time (use this when referencing moves object)
    secondGoal: "Take 5,000 steps during a workout",
    secondGoalNum: 5000, //steps
    secondGoalType: "workouts",
    secondGoalDescriptor: "steps",
    thirdGoal: "Wake up zero times in the night",
    thirdGoalNum: 0,
    thirdGoalType: "sleeps",
    thirdGoalDescriptor: "awakenings"
}
queries.insertLevel(level2);

level3 = {
      levelNum: 3,
      levelName: "Third Level!",          
      firstGoal: "Take 15000 in a day",    //description of goal
      firstGoalNum: 15000, //how to quantify the goal
      firstGoalType: "moves",  //sleeps, moves, or workouts
      firstGoalDescriptor: "steps", //for example - steps or active_time (use this when referencing moves object)
      secondGoal: "Burn 300 calories during a workout",
      secondGoalNum: 300,  //steps
      secondGoalType: "workouts",
      secondGoalDescriptor: "calories",
      thirdGoal: "Be awake for less than 10 minutes",
      thirdGoalNum: 600,  
      thirdGoalType: "sleeps",
      thirdGoalDescriptor: "awake"
    }

queries.insertLevel(level3);

