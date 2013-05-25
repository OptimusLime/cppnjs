(function(exports, selfBrowser, isBrowser){

    var common = isBrowser ? selfBrowser['common'] : require('../cppnjs.js');

    var utilities = common.loadLibraryFile('cppnjs', 'utilities');
    var cppnActivationFunctions =  common.loadLibraryFile('cppnjs', 'cppnActivationFunctions');

    var cppnActivationFactory = exports;

    cppnActivationFactory.CheckDependencies = function()
    {
        utilities = common.loadLibraryFile('cppnjs', 'utilities');
        cppnActivationFunctions =  common.loadLibraryFile('cppnjs', 'cppnActivationFunctions');
    };

    cppnActivationFactory.Factory =
    {
    };

    cppnActivationFactory.Factory.probabilities = [];
    cppnActivationFactory.Factory.functions = [];
    cppnActivationFactory.Factory.functionTable= {};

    cppnActivationFactory.Factory.createActivationFunction = function(functionID)
    {
        if(!cppnActivationFunctions[functionID])
            throw new Error("Activation Function doesn't exist!");
        // For now the function ID is the name of a class that implements IActivationFunction.
        return new cppnActivationFunctions[functionID]();

    };

    cppnActivationFactory.Factory.getActivationFunction = function(functionID)
    {
        var activationFunction = cppnActivationFactory.Factory.functionTable[functionID];
        if(!activationFunction)
        {
//            console.log('Creating: ' + functionID);
//            console.log('ActivationFunctions: ');
//            console.log(cppnActivationFunctions);

            activationFunction = cppnActivationFactory.Factory.createActivationFunction(functionID);
            cppnActivationFactory.Factory.functionTable[functionID] = activationFunction;
        }
        return activationFunction;

    };

    cppnActivationFactory.Factory.setProbabilities = function(oProbs)
    {
        cppnActivationFactory.Factory.probabilities = [];//new double[probs.Count];
        cppnActivationFactory.Factory.functions = [];//new IActivationFunction[probs.Count];
        var counter = 0;

        for(var key in oProbs)
        {
            cppnActivationFactory.Factory.probabilities.push(oProbs[key]);
            cppnActivationFactory.Factory.functions.push(cppnActivationFactory.Factory.getActivationFunction(key));
            counter++;
        }

    };

    cppnActivationFactory.Factory.defaultProbabilities = function()
    {
        var oProbs = {'BipolarSigmoid' :.25, 'Sine':.25, 'Gaussian':.25, 'Linear':.25};
        cppnActivationFactory.Factory.setProbabilities(oProbs);
    };
    cppnActivationFactory.Factory.getRandomActivationFunction = function()
    {
        if(cppnActivationFactory.Factory.probabilities.length == 0)
            cppnActivationFactory.Factory.defaultProbabilities();

        return cppnActivationFactory.Factory.functions[utilities.RouletteWheel.singleThrowArray(cppnActivationFactory.Factory.probabilities)];
    };


    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppnActivationFactory']={}: exports, this, typeof exports === 'undefined'? true : false);
