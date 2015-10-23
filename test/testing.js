var assert = require('assert');
var queries = require('./queries.js');

describe('queries', function() {

    
    // this runs before all tests
    before(function() {
        console.log('testing queries...');
    });

    describe('#getLatestSleep()', function() {
        it('Should get one sleep', function(done) {
            queries.getLatestSleep(1, function(err) {
                if (err) throw err;
                done();
            });
        });
    });

}
