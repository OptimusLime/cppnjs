var utils = require('../utility/utilities.js');
var cppnActivationFunctions = require('../activationFunctions/cppnActivationFunctions.js');

var Factory = {};

module.exports = Factory;

Factory.probabilities = [];
Factory.functions = [];
Factory.functionTable= {};

Factory.createActivationFunction = function(functionID)
{
    if(!cppnActivationFunctions[functionID])
        throw new Error("Activation Function doesn't exist!");
    // For now the function ID is the name of a class that implements IActivationFunction.
    return new cppnActivationFunctions[functionID]();

};

Factory.getActivationFunction = function(functionID)
{
    var activationFunction = Factory.functionTable[functionID];
    if(!activationFunction)
    {
//            console.log('Creating: ' + functionID);
//            console.log('ActivationFunctions: ');
//            console.log(cppnActivationFunctions);

        activationFunction = Factory.createActivationFunction(functionID);
        Factory.functionTable[functionID] = activationFunction;
    }
    return activationFunction;

};

Factory.setProbabilities = function(oProbs)
{
    Factory.probabilities = [];//new double[probs.Count];
    Factory.functions = [];//new IActivationFunction[probs.Count];
    var counter = 0;

    for(var key in oProbs)
    {
        Factory.probabilities.push(oProbs[key]);
        Factory.functions.push(Factory.getActivationFunction(key));
        counter++;
    }

};

Factory.defaultProbabilities = function()
{
    var oProbs = {'BipolarSigmoid' :.25, 'Sine':.25, 'Gaussian':.25, 'Linear':.25};
    Factory.setProbabilities(oProbs);
};
Factory.getRandomActivationFunction = function()
{
    if(Factory.probabilities.length == 0)
        Factory.defaultProbabilities();

    return Factory.functions[utils.RouletteWheel.singleThrowArray(Factory.probabilities)];
};

