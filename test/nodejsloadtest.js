var common = require('../cppnjs.js');
var assert = require('assert');
var should = require('should');
var fs = require('fs');

describe('Testing loading of cppnjs in nodejs',function(){

    it('Loading components should work fine', function(done){

        //we should be able to load everything now
//        for(var lib in common.scripts)
//        {
//            for(var script in common.scripts[lib])
//            {
//                var loadedScript = common.loadLibraryFile(lib, script);
//                (loadedScript === undefined).should.not.equal(true);
//            }
//        }

        done();
    });
});

