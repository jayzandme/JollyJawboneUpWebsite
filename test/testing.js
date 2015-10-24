var assert = require('assert');
var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var users = require('../databaseSchema/users.js');
var queries = require('../src/queries.js');
var database
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

// testing variables
var lastSleepTime = -1;
var lastSleepdate = -1;
var lastMoveTime = -1;
var lastMoveDate = -1;

// test the queries file
describe('Testing queries', function() {

    // Test with an empty database
    describe('-Empty database', function() {
        
        before(function() {
            clearDatabase();
        });

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

    // test with a full database
    describe('-Full database', function() {

        before(function() {
            makeDatabase();
        });

        describe('#getLatestSleep()', function() {

            it('Should get latest sleep', function(done) {
                queries.getLatestSleep(1, function(sleep) {
                    assert.equal(sleep.time_completed, lastSleepTime);
                    done();
                });
            });

            it('Should get the proper sleep info', function(done) {
                queries.getLatestSleep(1, function(sleep) {
                    assert.equal(sleep.time_created, lastSleepTime - 50000);
                    assert.equal(sleep.title, 'for 1h 23m');
                    assert.equal(sleep.xid, 'xid goes here');
                    assert.equal(sleep.date, lastSleepDate);
                    done();
                });
            });
        });

        describe('#getLatestMove()', function() {

            it('Should get the latest move', function(done) {
                queries.getLatestMove(1, function(move) {
                    assert.equal(move.time_completed, lastMoveTime);
                    done();
                });
            });

            it('Should get the proper move info', function(done) {
                queries.getLatestMove(1, function(move) {
                    assert.equal(move.time_created, lastMoveTime - 50000);
                    assert.equal(move.xid, 'xid goes here');
                    assert.equal(move.date, lastMoveDate);
                    assert.equal(move.time_updated, lastMoveTime + 50000);
                    done();
                });
            });
        });

    });
});

// clears the database of any data
function clearDatabase() {

   sleeps.find({}).remove().exec(); 
   moves.find({}).remove().exec();
   users.find({}).remove().exec();
}

// Puts test data in the database
function makeDatabase(){
    
    var i;
    
    for(i = 0; i < 100; i++) {
        makeSleep(i);
        makeMove(i);
    }
}

// makes a sleep data based upon the input number
function makeSleep(number) {

    var time_created = parseInt(1435000000 + number * Math.random());
    var time_completed = time_created + 50000;
    var date = 20151000 + parseInt(Math.random() * 30);

    if (time_completed > lastSleepTime) {
        lastSleepTime = time_completed;
        lastSleepDate = date;
    }

    var newSleep = new sleeps({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created, 
        time_completed: time_completed, 
        title: "for 1h 23m"
    });

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

    if (time_completed > lastMoveTime) {
        lastMoveTime = time_completed;
        lastMoveDate = date;
    }

    var newMove = new moves({
        userID: 1,
        xid: "xid goes here",
        date: date,
        time_created: time_created,
        time_updated: time_updated,
        time_completed: time_completed
    });

    newMove.save(function (err, thor) {
        if (err) {
            return console.log(err);
        }
    });
    
}
