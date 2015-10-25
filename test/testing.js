var assert = require('assert');
var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var users = require('../databaseSchema/users.js');
var workout = require('../databaseSchema/workouts.js');
var queries = require('../src/queries.js');
var database
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

// testing variables
var testSleeps = [];
var lastSleep = {
    time_completed: -1
    };

var testMoves = [];
var lastMove = {
    time_completed: -1
    };

var testWorkouts = [];
var lastWorkout = {
    time_completed: -1
    };

// test the queries file
describe('Testing queries', function() {

    setTimeout(function() {

        clearDatabase();
        console.log('cleared database');

        // Test with an empty database
        describe('-Empty database', function() {
            
            describe('#getLatestSleep()', function() { 
                it('Should\'t break if no data', function(done) {
                    queries.getLatestSleep(1, function(sleep) {
                        assert.equal(sleep, null);
                        done();
                    });
                });
            });

            describe('#getLatestMove()', function() {

                it('Shouldn\'t break if no data', function(done) {
                    queries.getLatestMove(1, function(move) {
                        assert.equal(move, null);
                        done();
                    });
                });
            });

        });

        run();
    }, 1000);

    setTimeout( function() {

        // test with a full database
        describe('-Full database', function() {

            before(function() {
                makeDatabase();
            });

            describe('#getLatestSleep()', function() {

                it('Should get latest sleep', function(done) {
                    queries.getLatestSleep(1, function(sleep) {
                        assert.equal(sleep.time_completed, 
                                     lastSleep.time_completed,
                                     'time_completed'
                                    );
                        done();
                    });
                });

                it('Should get the proper sleep info', function(done) {
                    queries.getLatestSleep(1, function(sleep) {
                        assert.equal(sleep.time_created, 
                                     lastSleep.time_created,
                                     'time_created'
                                    );
                        assert.equal(sleep.title, lastSleep.title, 'title');
                        assert.equal(sleep.xid, lastSleep.xid); 
                        assert.equal(sleep.date, lastSleep.date); 
                        done();
                    });
                });
            });

            describe('#getSleeps()', function() {

                it('Should get all the sleeps', function() {
                    sleeps = queries.getSleeps(1, function (sleeps) {    
                    var i = 0;
                    for (i = 0; i < testSleeps.length; i++) {
                        assert.equal(sleeps[i].time_created, 
                                     testSleeps[i].time_created,
                                     'sleep ' + i + ': time_created'
                                     );
                        assert.equal(sleeps[i].title, 
                                     testSleeps[i].title,
                                     'sleep ' + i + ': title'
                                     );
                        assert.equal(sleeps[i].xid, 
                                     testSleeps[i].xid,
                                     'sleep ' + i + ': xid'
                                     );
                        assert.equal(sleeps[i].date, 
                                     testSleeps[i].date,
                                     'sleep ' + i + ': date'
                                     );
                    }
                    }); 
                });
            });

            describe('#getLatestMove()', function() {

                it('Should get the latest move', function(done) {
                    queries.getLatestMove(1, function(move) {
                        assert.equal(move.time_completed, 
                                     lastMove.time_completed,
                                     'time_completed'
                                    );
                        done();
                    });
                });

                it('Should get the proper move info', function(done) {
                    queries.getLatestMove(1, function(move) {
                        assert.equal(move.time_created, 
                                     lastMove.time_completed,
                                     'time_created'
                                    );
                        assert.equal(move.xid, lastMove.xid, 'xid'); 
                        assert.equal(move.date, lastMove.date, 'date'); 
                        assert.equal(move.time_updated, 
                                     lastMove.time_updated,
                                     'time_updated'
                                    );
                        done();
                    });
                });
            });

            describe('#getMoves()', function() {

                it('Should get all the moves', function(done) {
                    queries.getMoves(1, function (moves) {
                        var i = 0;
                        for (i = 0; i < testMoves.length; i++) {
                            assert.equal(moves[i].time_created, 
                                         testMoves[i].time_created,
                                         'move ' + i + ': time_created'
                                         );
                            assert.equal(moves[i].time_updated, 
                                         testMoves[i].time_updated,
                                         'move ' + i + ': time-updated'
                                         );
                            assert.equal(moves[i].title, 
                                         testMoves[i].title,
                                         'move ' + i + ': title'
                                         );
                            assert.equal(moves[i].xid, 
                                         testMoves[i].xid,
                                         'move ' + i + ': xid'
                                         );
                            assert.equal(moves[i].date, 
                                         testMoves[i].date,
                                         'move ' + i + ': date'
                                         );
                        }
                    });
                    done();
                });
            });

            describe('#getLatestWorkout()', function() {

                it('Should get the latest workout', function(done) {
                    queries.getLatestWorkout(1, function(workout) {
                        assert.equal(workout.time_completed, 
                                     lastWorkout.time_completed,
                                     'time_completed is wrong'
                                    );
                        done();
                    });
                });

                it('Should get the proper workout info', function(done) {
                    queries.getLatestWorkout(1, function(workout) {
                        assert.equal(workout.time_created, 
                                     lastWorkout.time_created,
                                     'time_created expected: ' + 
                                     lastWorkout.time_completed + 
                                     ' got: ' + workout.time_completed
                                    );
                        assert.equal(workout.xid, 
                                     lastWorkout.xid,
                                     'xid expected: ' + 
                                     lastWorkout.xid + 
                                     ' got: ' + workout.xid
                                    );
                        assert.equal(workout.date, 
                                     lastWorkout.date,
                                     'date expected: ' + lastWorkout.date + 
                                     ' got: ' + workout.date
                                    );
                        assert.equal(workout.title, 
                                     lastWorkout.title,
                                     'title: expected ' + lastWorkout.title,
                                     ' got: ' + workout.title 
                                    );
                        assert.equal(workout.steps, 
                                     lastWorkout.steps,
                                     'steps: expected ' + lastWorkout.steps,
                                     ' got: ' + workout.steps 
                                    );
                        assert.equal(workout.time, 
                                     lastWorkout.time,
                                     'time: expected ' + lastWorkout.time,
                                     ' got: ' + workout.time 
                                    );
                        assert.equal(workout.meters, 
                                     lastWorkout.meters,
                                     'meters: expected ' + lastWorkout.meters,
                                     ' got: ' + workout.meters 
                                    );
                        assert.equal(workout.calories, 
                                     lastWorkout.calories,
                                     'calories: expected ' + lastWorkout.calories,
                                     ' got: ' + workout.calories
                                    );
                        assert.equal(workout.intensity, 
                                     lastWorkout.intensity,
                                     'intensity: expected ' + lastWorkout.intensity,
                                     ' got: ' + workout.intensity
                                    );
                        done();
                    });
                });
            });

            describe('#getWorkouts()', function() {

                it('Should get all the workout', function(done) {
                    queries.getWorkouts(1, function (workouts) {
                        var i = 0;
                        for (i = 0; i < testWorkouts.length; i++) {
                            assert.equal(workouts[i].time_created, 
                                         testWorkouts[i].time_created,
                                         'workout ' + i + ': time_created'
                                         );
                            assert.equal(workouts[i].time-updated, 
                                         testWorkouts[i].time-updated,
                                         'workout ' + i + ': time-updated'
                                         );
                            assert.equal(workouts[i].title, 
                                         testWorkouts[i].title,
                                         'workout ' + i + ': title'
                                         );
                            assert.equal(workouts[i].xid, 
                                         testWorkouts[i].xid,
                                         'workout ' + i + ': xid'
                                         );
                            assert.equal(workouts[i].date, 
                                         testWorkouts[i].date,
                                         'workout ' + i + ': date'
                                         );
                        }
                    });
                    done();
                });
            });

        });
        run();
    }, 1000);
});

// clears the database of any data
function clearDatabase() {

   sleeps.find({}).remove().exec(); 
   moves.find({}).remove().exec();
   users.find({}).remove().exec();
   workout.find({}).remove().exec();
}

// Puts test data in the database
function makeDatabase(){
    
    var i;
    
    for(i = 0; i < 100; i++) {
        makeSleep(i);
        makeMove(i);
        makeWorkout(i);
    }
}

// makes a sleep data based upon the input number
function makeSleep(number) {

    var time_created = parseInt(1435000000 + number * Math.random());
    var time_completed = time_created + 50000;
    var date = 20151000 + parseInt(Math.random() * 30);

    var newSleep = new sleeps({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created, 
        time_completed: time_completed, 
        title: "for 1h 23m"
    });

    testSleeps.push({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created, 
        time_completed: time_completed, 
        title: "for 1h 23m"
    });

    if (time_completed > lastSleep.time_completed) {
        lastSleep = testSleeps[testSleeps.length - 1];
    }

    newSleep.save(function (err, thor) {
        if (err) {
            return console.error(err);
        }
    });
}

// makes a move data based upon the input number
function makeMove(number) {
    
    var time_created = parseInt(1435000000 + number * Math.random());
    var time_completed = time_created + 50000;
    var time_updated = time_completed + 50000;
    var date = 20151000 + parseInt(Math.random() * 30);


    var newMove = new moves({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created,
        time_updated: time_updated,
        time_completed: time_completed
    });

    testMoves.push({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created,
        time_updated: time_updated,
        time_completed: time_completed
    });

    if (time_completed > lastMove.time_completed) {
        lastMove = testMoves[testMoves.length - 1];
    }


    newMove.save(function (err, thor) {
        if (err) {
            return console.log(err);
        }
    });
    
}

// makes a workout based upon the input number
function makeWorkout(number) {
    
    var time_created = parseInt(1435000000 + number * Math.random());
    var time_completed = time_created + 50000;
    var date = 20151000 + parseInt(Math.random() * 30);
    var steps = parseInt(Math.random() * 2000);
    var time = parseInt(Math.random() * 4000);
    var meters = parseInt(Math.random() * 5000);
    var calories = parseInt(Math.random() * 600);
    var intensity = parseInt(Math.random() * 5);

    var newWorkout = new workout({
        userID: 1,
        xid: "xid goes here",
        date: date,
        title: 'Run',
        steps: steps,
        time: time,
        meters: meters,
        calories: calories,
        intensity: intensity,
        time_created: time_created,
        time_completed: time_completed
    });

    testWorkouts.push({
        userID: 1,
        xid: "xid goes here",
        date: date,
        title: 'Run',
        steps: steps,
        time: time,
        meters: meters,
        calories: calories,
        intensity: intensity,
        time_created: time_created,
        time_completed: time_completed
    });

    if (time_completed > lastWorkout.time_completed) {
        lastWorkout = testWorkouts[testWorkouts.length - 1];
    }

    newWorkout.save(function (err, thor) {
        if (err) {
            return console.log(err);
        }
    });
    
}

