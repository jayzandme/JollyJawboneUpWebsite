var assert = require('assert');
var mongoose = require('mongoose');
var sleeps = require('../databaseSchema/sleeps.js');
var moves = require('../databaseSchema/moves.js');
var users = require('../databaseSchema/users.js');
var queries = require('../src/queries.js');
var database
    = mongoose.connect('mongodb://localhost:27017/myappdatabase').connection;

describe('Testing queries', function() {
 
    describe('Empty database', function() {
        
        before(function() {
            clearDatabase();
        });

        describe('#getLatestSleep()', function() {

            it('Should\'t break if no data', function(done){
                queries.getLatestSleep(1, function(sleep) {
                    done();
                });
            });

        });
    });

    describe('Full database', function() {

        before(function() {
            makeDatabase();
        });

        describe('#getLatestSleep()', function() {

            it('Should get latest sleep', function(done) {
                queries.getLatestSleep(1, function(sleep) {
                    assert.equal(sleep.time_completed, 1445427900);
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

}

// makes a move data based upon the input number
function makeMove(number) {

}
