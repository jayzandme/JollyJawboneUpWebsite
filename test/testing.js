var assert = require('assert');
var queries = require('../src/queries.js');

describe('queries', function() {

    
    // this runs before all tests
    before(function() {
        console.log('clearing database...');
        console.log('inputting test data...');
        console.log('testing queries...');
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
