var assert = require('assert');
var should = require('should');
var fs = require('fs');
var util = require('util');

var utilities = require('../utility/utilities.js');
var cppns = require('../cppns/cppn.js');
var cppnConnection = require('../components/cppnConnection.js');
var cppnNode = require('../components/cppnNode.js');
var cppnActivationFactory = require('../activationFunctions/cppnActivationFactory.js');


var start = process.hrtime();

var elapsed_time = function(note){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
//    console.log(elapsed.toFixed(precision) + " ms - " + note); // print message + time
    start = process.hrtime(); // reset the timer
    return elapsed.toFixed(precision);
};


describe('Testing cppns against a known working file',function(){

    it('TestCPPNS(): testing overall cppns', function(done){

        fs.readFile(__dirname  + '/testgenomes.json', 'utf8', function (err,data) {
            if (err) {
                console.log(err);
                throw err;
            }
            //we need to parse the data, and create some cppns!

            var dataObject = JSON.parse(data);

            var testNetworks  = dataObject['networks'];
            for(var i=0; i < testNetworks.length; i++)
            {
                //grab our network, we'll need to parse
                var networkJSON = testNetworks[i];

                var nodesAndConnections = networkJSON['network'];

                var connections = [];
                //turn our connections into actual connections!
                for(var c=0; c< nodesAndConnections.connections.length; c++)
                {
                    var loadedConn = nodesAndConnections.connections[c];
                    connections.push(
                        new cppnConnection.CPPNConnection(loadedConn.sourceNeuronIdx, loadedConn.targetNeuronIdx, loadedConn.weight));
                }

                var activationFunctions = [];
                for(var af =0; af < nodesAndConnections.activationFunctions.length; af++)
                {
                    activationFunctions.push(
                        cppnActivationFactory.Factory.getActivationFunction(nodesAndConnections.activationFunctions[af].FunctionId));
                }

                var cppn = new cppns.CPPN(
                    nodesAndConnections.BiasNeuronCount,
                    nodesAndConnections.InputNeuronCount,
                    nodesAndConnections.OutputNeuronCount,
                    nodesAndConnections.TotalNeuronCount,
                    connections,
                    nodesAndConnections.biasList,
                    activationFunctions
                );
                var dupcppn = new cppns.CPPN(
                    nodesAndConnections.BiasNeuronCount,
                    nodesAndConnections.InputNeuronCount,
                    nodesAndConnections.OutputNeuronCount,
                    nodesAndConnections.TotalNeuronCount,
                    connections,
                    nodesAndConnections.biasList,
                    activationFunctions
                );

                //now fetch our inputs/outputs
                var tests = networkJSON['tests'];
                for(var t=0; t< tests.length; t++)
                {
                    var inputs = tests[t]['inputs'];
                    cppn.clearSignals();
                    cppn.setInputSignals(inputs);

                    dupcppn.clearSignals();
                    dupcppn.setInputSignals(inputs);

                    cppn.neuronSignals[0].should.equal(1);//nodesAndConnections.biasList[0]);

                    for(var check=cppn.biasNeuronCount; check < cppn.inputNeuronCount + cppn.biasNeuronCount; check++){
                        cppn.neuronSignals[check].should.equal(inputs[check-cppn.biasNeuronCount]);
                    }

//                    cppn.recursiveActivation();
                    cppn.multipleSteps(30);
                    dupcppn.recursiveActivation();

                    var outputs = tests[t]['outputs'];
                    for(var o=0; o < outputs.length; o++)
                    {
                        //output signals should be equal, no matter what type of activation
                        cppn.getOutputSignal(o).should.equal(dupcppn.getOutputSignal(o));
                        parseFloat(Math.abs(outputs[o] - dupcppn.getOutputSignal(o)).toFixed(5)).should.be.lessThan(.0001);
//   console.log('Difference: ' + Math.abs(parseFloat(outputs[o].toFixed(8)) - parseFloat(cppn.getOutputSignal(o).toFixed(8))));
//                        console.log('Difference: ' + Math.abs(parseFloat(outputs[o].toFixed(5)) - parseFloat(dupcppn.getOutputSignal(o).toFixed(5))));
//                        console.log('DiffBetween: ' + Math.abs(parseFloat(dupcppn.getOutputSignal(o).toFixed(14)) - parseFloat(cppn.getOutputSignal(o).toFixed(14))));
//                        console.log('OutSignals: ' + cppn.getOutputSignal(o) + ' actual: ' +
//                            outputs[o]);
//                        dupcppn.getOutputSignal(o).should.equal(outputs[o]);
                    }
                }
            }

            done();


//        console.log(data);
        });

    })


    it('CPPN: Test Recursion Check', function(done){

        var testCount = 2000;

        for(var i=0; i< testCount; i++)
        {

            var nodesAndConnections =
            {
                BiasNeuronCount : 1,
                InputNeuronCount : 2 + utilities.next(13),
                OutputNeuronCount : 1 + utilities.next(13),
                biasList : []
            };

            var randomHiddenCount = utilities.next(13);

            nodesAndConnections.TotalNeuronCount  =
                nodesAndConnections.BiasNeuronCount
                + nodesAndConnections.InputNeuronCount
                + nodesAndConnections.OutputNeuronCount
                + randomHiddenCount;




            var activationFunctions = [];
            for(var af =0; af < nodesAndConnections.TotalNeuronCount; af++)
            {
                nodesAndConnections.biasList.push(0);

                activationFunctions.push(
                    cppnActivationFactory.Factory.getRandomActivationFunction());
            }

            //now we create random connections between inputs and outputs, nothing overlapping

            var randomConnectionCount = 20 + utilities.next(20);

            var existingConnections = {};
            var nodes = [], connections = [];
            var src, tgt;
            for(var c=0; c < randomConnectionCount; c++)
            {

                var inOutOrHidOut = (randomHiddenCount ? utilities.next(2) : 1);

                //src are the inputs/bias!
                src = (inOutOrHidOut ?
                    utilities.next(nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount)
                    :
                    nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount + nodesAndConnections.OutputNeuronCount +
                    utilities.next(randomHiddenCount));

                //hit anything above bias and input to be safe

                //we hit the outputs only!
                tgt = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount + utilities.next(nodesAndConnections.OutputNeuronCount);



                var cs = '' + src + ',' + tgt;
                if(!existingConnections[cs])
                {
                    existingConnections[cs] = true;
                    connections.push(
                        new cppnConnection.CPPNConnection(src, tgt, (utilities.next(2)*2 -1) * utilities.nextDouble()));
                }
            }



//            console.log('Connections: ');
//            console.log(connections);
//            console.log('N and C settings: ');
//            console.log('RandoHidden : ' + randomHiddenCount);
//            console.log(nodesAndConnections);
//

            var cppn = new cppns.CPPN(
                nodesAndConnections.BiasNeuronCount,
                nodesAndConnections.InputNeuronCount,
                nodesAndConnections.OutputNeuronCount,
                nodesAndConnections.TotalNeuronCount,
                connections,
                nodesAndConnections.biasList,
                activationFunctions
            );


            cppn.isRecursive().should.not.equal(true);



            var hidInOrOutIn = (randomHiddenCount ? utilities.next(2) : 0);


            if(hidInOrOutIn){
                //source is a hidden node
                src = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount
                    + nodesAndConnections.OutputNeuronCount + utilities.next(randomHiddenCount);
            }
            else
            {
                //source is an output
                src = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount
                    +  utilities.next(nodesAndConnections.OutputNeuronCount);
            }

            //target is an input any one!
            tgt = utilities.next(nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount);

            connections.push(new cppnConnection.CPPNConnection(src, tgt, (utilities.next(2)*2 -1) * utilities.nextDouble()));

            cppn = new cppns.CPPN(
                nodesAndConnections.BiasNeuronCount,
                nodesAndConnections.InputNeuronCount,
                nodesAndConnections.OutputNeuronCount,
                nodesAndConnections.TotalNeuronCount,
                connections,
                nodesAndConnections.biasList,
                activationFunctions
            );

            //we added recursion, gee golly we should know
            cppn.isRecursive().should.equal(true);

            //let's be a little more sneaky
            //remove that last connection, and let's make a true loop that's not so easy to detect
            connections.pop();


            //pick two random non input nodes, make sure connection to and from exists -- boo yah recurrent

            var recurrentCount = 1 + utilities.next(3);
            for(var r= 0; r < recurrentCount; r++)
            {
                //graba random or hidden node
                src =  nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount + utilities.next(randomHiddenCount + nodesAndConnections.OutputNeuronCount);


                //graba random or hidden node
                tgt = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount
                    + utilities.next(randomHiddenCount + nodesAndConnections.OutputNeuronCount);

                var cs = '' + src + ',' + tgt;
                if(!existingConnections[cs])
                {
                    existingConnections[cs] = true;
                    connections.push(
                        new cppnConnection.CPPNConnection(src, tgt, (utilities.next(2)*2 -1) * utilities.nextDouble()));
                }
                cs = '' + tgt + ',' + src;
                if(!existingConnections[cs])
                {
                    existingConnections[cs] = true;
                    connections.push(
                        new cppnConnection.CPPNConnection(tgt, src, (utilities.next(2)*2 -1) * utilities.nextDouble()));
                }
                //we must make sure one of these connections is connected to an output


                if(utilities.next(2))
                    src = tgt;

                //we make the target a random output
                //graba random or hidden node
                tgt = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount
                    + utilities.next(nodesAndConnections.OutputNeuronCount);

                //now we wire up one of our nodes to some target, ensuring that they get looped in somewhere
                //if we randomly connected to nodes, no guarantee that's not it's own circuit, which never would be detected
                cs = '' + src + ',' + tgt;
                if(!existingConnections[cs])
                {
                    existingConnections[cs] = true;
                    connections.push(
                        new cppnConnection.CPPNConnection(src, tgt, (utilities.next(2)*2 -1) * utilities.nextDouble()));
                }

            }

            cppn = new cppns.CPPN(
                nodesAndConnections.BiasNeuronCount,
                nodesAndConnections.InputNeuronCount,
                nodesAndConnections.OutputNeuronCount,
                nodesAndConnections.TotalNeuronCount,
                connections,
                nodesAndConnections.biasList,
                activationFunctions
            );

//            console.log('Connections: ' );
//            console.log(connections);
//
//            console.log('NodeConn : ' );
//            console.log(nodesAndConnections);

            //we added recursion, gee golly we should know
            cppn.isRecursive().should.equal(true);

        }


        done();

    });



    it('CPPN: Test Function Builder', function(done){


        var testCount = 100;

        var avgSpeedup = 0;
        var speedCount = 0;
        for(var i=0; i< testCount; i++)
        {

            //we need to make some cppns, nothing recurrent please!
            var nodesAndConnections =
            {
                BiasNeuronCount : 1,
                InputNeuronCount : 2 + utilities.next(23),
                OutputNeuronCount : 1 + utilities.next(23),
                biasList : []
            };

            var randomHiddenCount = utilities.next(22);

            nodesAndConnections.TotalNeuronCount  =
                nodesAndConnections.BiasNeuronCount
                    + nodesAndConnections.InputNeuronCount
                    + nodesAndConnections.OutputNeuronCount
                    + randomHiddenCount;


            var activationFunctions = [];
            for(var af =0; af < nodesAndConnections.TotalNeuronCount; af++)
            {
                nodesAndConnections.biasList.push(0);

                activationFunctions.push(
                    cppnActivationFactory.Factory.getRandomActivationFunction());
            }

            //now we create random connections between inputs and outputs, nothing overlapping

            var randomConnectionCount = 5 + utilities.next(15);

            var existingConnections = {};
            var nodes = [], connections = [];
            var src, tgt;
            for(var c=0; c < randomConnectionCount; c++)
            {

                var inOutOrHidOut = (randomHiddenCount ? utilities.next(2) : 1);

                //src are the inputs/bias!
                src = (inOutOrHidOut ?
                    utilities.next(nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount)
                    :
                    nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount + nodesAndConnections.OutputNeuronCount +
                        utilities.next(randomHiddenCount));

                //hit anything above bias and input to be safe

                //we hit the outputs only!
                tgt = nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount + utilities.next(nodesAndConnections.OutputNeuronCount);



                var cs = '' + src + ',' + tgt;
                if(!existingConnections[cs])
                {
                    existingConnections[cs] = true;
                    connections.push(
                        new cppnConnection.CPPNConnection(src, tgt, (utilities.next(2)*2 -1) * utilities.nextDouble()));
                }
            }

            var cppn = new cppns.CPPN(
                nodesAndConnections.BiasNeuronCount,
                nodesAndConnections.InputNeuronCount,
                nodesAndConnections.OutputNeuronCount,
                nodesAndConnections.TotalNeuronCount,
                connections,
                nodesAndConnections.biasList,
                activationFunctions
            );


            cppn.isRecursive().should.not.equal(true);


            var inputs = [];
            for(var n=nodesAndConnections.BiasNeuronCount; n < nodesAndConnections.BiasNeuronCount + nodesAndConnections.InputNeuronCount; n++)
                inputs.push("x" + n);

//            console.log(nodesAndConnections);
//            console.log(activationFunctions);
//            console.log(connections);

            var enclosures = cppn.recursiveEnclosure();

            for(var e=0; e< enclosures.length; e++)
            {
                var enclosure = enclosures[e];
                var usedInputs = enclosure.inputs;
                var eFunction = enclosure.function;

//                console.log('Used inputs: ' + util.inspect(usedInputs));
//                console.log("inputs: " + util.inspect(inputs, {depth:null}));
//                console.log("enclosure: " + util.inspect(enclosure.function, {depth:null}));
//                console.log("function: " + util.inspect(eFunction, {depth:null}));

                //let's test our functions!

                var functionTests = 100;
                for(var f=0; f< functionTests; f++)
                {

                    var tempIns = [];
                    for(var n=0; n < nodesAndConnections.InputNeuronCount; n++)
                        tempIns.push(utilities.nextDouble());
//
//                    elapsed_time("Start CPPN");
//                    var outCPPN;
//                    for(var m=0; m<10000; m++){
//                        cppn.clearSignals();
//                        cppn.setInputSignals(tempIns);
//                        cppn.recursiveActivation();
//                        outCPPN = cppn.getOutputSignal(e);
//                    }
//                    var cppnTime = elapsed_time("End CPPN");
//                    cppnTime = 0;
//
//
//
//                    elapsed_time("start function");
//                    var outFunction;
//                    for(var m=0; m<10000; m++){
//                        outFunction= eFunction.apply(eFunction, tempIns);
//                    }
//                    var funTime = elapsed_time("end function");
//
//                    avgSpeedup += cppnTime/funTime;
//                    speedCount ++;

                    cppn.clearSignals();
                    cppn.setInputSignals(tempIns);
                    cppn.recursiveActivation();
                    var outCPPN = cppn.getOutputSignal(e);
                    var outFunction= eFunction.apply(eFunction, tempIns);

                    outFunction.should.equal(outCPPN);
                }
//                console.log("inputs: " + util.inspect(tempIns, {depth:null}));
//                console.log('outCPPN: ' + outCPPN);
//                console.log('outfun: ' + outFunction);

           }


        }

//        console.log('Fun Speedup? : ' + avgSpeedup/speedCount);


        done();
    });



    });