var assert = require('assert');
var should = require('should');
var fs = require('fs');
var util = require('util');

var utilities = require('../utility/utilities.js');
var CPPN = require('../networks/cppn.js');
var cppnConnection = require('../networks/cppnConnection.js');
var cppnActivationFactory = require('../activationFunctions/cppnActivationFactory.js');
var AutoEncodeCPPN = require('../extras/autoencodeCPPN.js');

var pureAdd = require('../extras/pureCPPNAdditions.js');
var adaptAdd = require('../extras/adaptableAdditions.js');

//var start = process.hrtime();
//
//var elapsed_time = function(note){
//    var precision = 3; // 3 decimal places
//    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
////    console.log(elapsed.toFixed(precision) + " ms - " + note); // print message + time
//    start = process.hrtime(); // reset the timer
//    return elapsed.toFixed(precision);
//};

describe('Testing Autoencoders work',function(){

    it('Test reversing CPPN logic', function(done){

        var cppnTests = 100;
        for(var ct = 0; ct < cppnTests; ct++)
        {
            //we'll have a bias, but no connections to it for now
            var biasCount = 1;
            var inputCount = 1 + Math.floor(Math.random()*5);
            var outputCount = inputCount;
            var hiddenCount = 1 + Math.floor(Math.random()*3);


            var totalNeuronCount = biasCount + inputCount + outputCount + hiddenCount;
            var inputStart = biasCount;
            var hiddenStart = biasCount + inputCount + outputCount;
            var outputStart = biasCount + inputCount;



            var connections = [];

            var inAndHiddenToWeight = {};
            //we wire all inputs to all hidden nodes

            for(var i=0; i < inputCount; i++)
            {
                //we take our input, and wire to hidden
                for(var h=0; h < hiddenCount; h++)
                {
                    var ih = i + "," + h;

                    var randomWeight = Math.random();

                    inAndHiddenToWeight[ih] = randomWeight;

                    //we wire up the input to each hidden node with random weight
                    connections.push(new cppnConnection(inputStart + i, hiddenStart + h, randomWeight));
                }
            }

            //we take our hidden nodes, and wire to outputs
            for(var h=0; h < hiddenCount; h++)
            {
                for(var o=0; o < outputCount; o++)
                {
                    var oh = o + "," + h;
                    //should be symmetric to inputs
                    var symWeight = inAndHiddenToWeight[oh];

                    //we wire up the input to each hidden node with random weight
                    connections.push(new cppnConnection(hiddenStart + h, outputStart + o, symWeight));
                }
            }

            var activationFunctions = [];
            for(var i=0; i < biasCount; i++)
            {
                activationFunctions.push(cppnActivationFactory.getRandomActivationFunction());
            }
            //setup random input activations
            for(var i=biasCount; i < outputStart; i++)
            {
                var randomActivation = cppnActivationFactory.getRandomActivationFunction();
                activationFunctions.push(randomActivation)
            }
            //set up our output activations to be = to corresponding symmetric inputs
            for(var i= outputStart; i < hiddenStart; i++)
            {
                //grab activation functions from other neurons
                activationFunctions.push(activationFunctions[i - inputCount]);
            }

            for(var i=hiddenStart; i< totalNeuronCount; i++)
            {
                activationFunctions.push(cppnActivationFactory.getRandomActivationFunction());
            }

            //Now we have a symmetric CPPN, with some number of inputs and outputs equal to each other
            //with 1 hidden layer and all our activation functions
            //ignore biaslist send in empty array
            var autoCPPN = new AutoEncodeCPPN(biasCount, inputCount, outputCount, totalNeuronCount, connections, [], activationFunctions);

            //now we need to test activation
            var activationTests = 100;
            for(var a=0; a < activationTests; a++)
            {

                var inputs = [];
                //let's setup our random inputs
                for(var i=0; i < inputCount; i++)
                {
                    inputs.push(Math.random());
                }

                autoCPPN.forwardCPPN.clearSignals();
                autoCPPN.backwardsCPPN.clearSignals();

                autoCPPN.forwardCPPN.setInputSignals(inputs);
                autoCPPN.backwardsCPPN.setInputSignals(inputs);

                autoCPPN.forwardCPPN.recursiveActivation();
                autoCPPN.backwardsCPPN.recursiveActivation();


                for(var i=0; i < outputCount; i++)
                {
                    autoCPPN.forwardCPPN.getOutputSignal(i).should.equal(autoCPPN.backwardsCPPN.getOutputSignal(i));
                }
            }
        }
        done();
    });
});