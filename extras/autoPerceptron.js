var CPPN = require("../networks/cppn");
var CPPNConnection = require("../networks/cppnConnection.js");
var Perceptron = require("../extras/perceptron.js");
module.exports = AutoPerceptron;

var cppnActivationFactory = require('../activationFunctions/cppnActivationFactory.js');

function AutoPerceptron(
    perceptronOutputs,
    autoEncoderCPPN
    )
{
    //so we create a CPPN with inputs = autoEncoder outputs
    //and outputs = perceptron outputs


    var self = this;

    //our perceptron has 1 bias, and inputs = the number of autoencoder outputs
    var biasCount = 1;
    var pInputCount = autoEncoderCPPN.outputNeuronCount;
    var totalNeurons = biasCount + pInputCount + perceptronOutputs;

    //create fully connected perceptron
    var pConnections = [];

    var activationFunctions = [];

    //random perceptron weights here
    for(var i=0; i < pInputCount + biasCount; i++)
    {
        for(var t=0; t < perceptronOutputs; t++)
            pConnections.push(new CPPNConnection(i, t, 2*Math.random()-1));

        //linear activation for bias + inputs
        activationFunctions.push(cppnActivationFactory.getActivationFunction("Linear"));
    }

    for(var i= biasCount + pInputCount; i < totalNeurons; i++)
    {
        //note than everything is bipolar sigmoid for neurons
        activationFunctions.push(cppnActivationFactory.getActivationFunction("BipolarSigmoid"));
    }

    self.perceptron = new Perceptron(1, autoEncoderCPPN.outputNeuronCount, perceptronOutputs, totalNeurons, pConnections, activationFunctions);
    self.autoEncoder = autoEncoderCPPN;
}