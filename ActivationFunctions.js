//requires some helpers

var actNSS = "NEAT.Activation";
var actNS = namespace(actNSS);


//singleton pattern for activation factory -- and it makes the ActivationFunctionFactory globally available
var ActivationFunctionFactory = new function ActivationFunctionFactory()
{
    var instance = this;
    var probabilities = [];
    var functions = [];
    var activationFunctionTable = {};

    ActivationFunctionFactory.getInstance = function()
    {
        return instance;
    };
    this.toString = function()
    {
        return "[object ActivationFunctionFactory]";
    };

    ActivationFunctionFactory.setProbabilities  = function(probs) {
        for(var probKey in probs)
        {
            probabilities.push(probs[probKey]);
            functions.push(this.GetActivationFunction(probKey));
        }
    };

    ActivationFunctionFactory.GetActivationFunction = function(functionString) {

        var activationFunction = activationFunctionTable[functionString];
        if(!activationFunction)
        {
            activationFunction = ActivationFunctionFactory.CreateActivationFunction(functionString);
            activationFunctionTable[functionString] = activationFunction;
        }
        return activationFunction;
    };

    //in javascript it's easy to create an object from a string -- so we have a helper do that part
    ActivationFunctionFactory.CreateActivationFunction = function(functionId)
    {
        // For now the function ID is the name of a class that implements IActivationFunction.
        var className = stringToFunction(actNSS.toString()  + "." + functionId);
        return new className(); // (IActivationFunction)Assembly.GetExecutingAssembly().CreateInstance(className);
    };

    ActivationFunctionFactory.GetRandomActivationFunction = function()
    {
        return functions[Maths.RouletteWheel.SingleThrow(probabilities)];
    };

    return ActivationFunctionFactory;
};

actNS.BipolarSigmoid  = function() {};
actNS.BipolarSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return (2.0 / (1.0 + Math.exp(-4.9 * inputSignal))) - 1.0; },
    FunctionId : function() { return "BipolarSigmoid";  },
    FunctionString : function() { return "2.0/(1.0 + exp(-4.9*inputSignal)) - 1.0"; },
    FunctionDescription : function() { return "bipolar steepend sigmoid"; }
};

actNS.ErrorSign  = function() {  this.error = .0001;};
actNS.ErrorSign.prototype =
{

    Calculate : function(inputSignal) {
        if (inputSignal < 0){
            if (inputSignal < -this.error) return -1;
            else return 0;
        }
        else if (inputSignal > 0){
            if (inputSignal > this.error) return 1;
            else return 0;
        }
        else return 0;
    },
    FunctionId : function() { return "ErrorSign";  },
    FunctionString : function() { return "ErrorSign(x)"; },
    FunctionDescription : function() { return "Returns the sign of the input with some error around 0"; }
};

actNS.Gaussian  = function() {};
actNS.Gaussian.prototype =
{
    Calculate : function(inputSignal) {  return  2 * Math.exp(-Math.pow(inputSignal * 2.5, 2)) - 1;},
    FunctionId : function() { return "Gaussian";  },
    FunctionString : function() { return  "2*e^(-(input*2.5)^2) - 1"; },
    FunctionDescription : function() { return "bimodal gaussian"; }
};

actNS.InverseAbsoluteSigmoid  = function() {};
actNS.InverseAbsoluteSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 0.5 + ((inputSignal / (1.0+Math.abs(inputSignal)))*0.5);},
    FunctionId : function() { return "InverseAbsoluteSigmoid";  },
    FunctionString : function() { return  ""; },
    FunctionDescription : function() { return ""; }
};

actNS.Linear  = function() {};
actNS.Linear.prototype =
{
    Calculate : function(inputSignal) { return Math.abs(inputSignal);},
    FunctionId : function() { return "Linear";  },
    FunctionString : function() { return " abs(x) [min=0, max=1]"; },
    FunctionDescription : function() { return "Linear"; }
};

actNS.Modulus  = function() { this.delta = (2.0 / actNS.Modulus.factor); };
actNS.Modulus.factor = 5;
actNS.Modulus.constant = 10000000;

actNS.Modulus.prototype =
{
    Calculate : function(inputSignal, fact) {
        if(fact === undefined)
        {
            //shift to 0-max#
            inputSignal = ((51 + inputSignal));
            //find modulus (inputSignal>0 <ddelta)
            inputSignal *= actNS.Modulus.constant ;
            inputSignal = (Math.floor(inputSignal)% Math.floor(this.delta * actNS.Modulus.constant));
            inputSignal /= actNS.Modulus.constant ;
            inputSignal = inputSignal * (actNS.Modulus.factor);
            return (inputSignal) - 1;
        }
        else
        {
            var delta = 2.0 / fact;
            inputSignal += 51;
            inputSignal *= actNS.Modulus.constant;
            inputSignal = Math.floor(inputSignal) % Math.floor(delta * actNS.Modulus.constant);
            inputSignal /= actNS.Modulus.constant;
            inputSignal *= fact;
            return inputSignal - 1;
        }
    },
    FunctionId : function() { return "Modulus"; },
    FunctionString : function() { return "Mod" + actNS.Modulus.factor; },
    FunctionDescription : actNS.Modulus.FunctionId
};

actNS.NullFn  = function() {};
actNS.NullFn.prototype =
{
    Calculate : function() {  return 0;},
    FunctionId : function() { return "NullFn";  },
    FunctionString : function() { return  ""; },
    FunctionDescription : function() { return "return 0"; }
};

actNS.PlainSigmoid  = function() {};
actNS.PlainSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 1.0/(1.0+(Math.exp(-inputSignal)));},
    FunctionId : function() { return "PlainSigmoid";  },
    FunctionString : function() { return  "1.0/(1.0+(exp(-inputSignal)))"; },
    FunctionDescription : function() { return "Plain sigmoid [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};

actNS.ReducedSigmoid  = function() {};
actNS.ReducedSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 1.0/(1.0+(Math.exp(-0.5*inputSignal)));},
    FunctionId : function() { return "ReducedSigmoid";  },
    FunctionString : function() { return "1.0/(1.0+(exp(-0.5*inputSignal)))"; },
    FunctionDescription : function() { return "Reduced Sigmoid  [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};

actNS.SigmoidApproximation  = function() {};
actNS.SigmoidApproximation.prototype =
{
    Calculate : function(inputSignal) {
        var four = 4.0;
        var one_32nd = 0.03125;

        if(inputSignal<-4.0)
        {
            return 0.0;
        }
        else if(inputSignal<0.0)
        {
            return (inputSignal+four)*(inputSignal+four)*one_32nd;
        }
        else if(inputSignal<4.0)
        {
            return 1.0-(inputSignal-four)*(inputSignal-four)*one_32nd;
        }
        else
        {
            return 1.0;
        }},
    FunctionId : function() { return "SigmoidApproximation";  },
    FunctionString : function() { return ""; },
    FunctionDescription : function() { return "SigmoidApproximation"; }
};

actNS.Sign  = function() {};
actNS.Sign.prototype =
{
    Calculate : function(inputSignal) {
        if (isNaN(inputSignal)) return 0;
        return Math.sign(inputSignal);
    },
    FunctionId : function() { return "Sign";  },
    FunctionString : function() { return "Sign(x)"; },
    FunctionDescription : function() { return "Returns the sign of the input"; }
};

actNS.Sine  = function() {};
actNS.Sine.prototype =
{
    Calculate : function(inputSignal) {  return  Math.sin(2*inputSignal);},
    FunctionId : function() { return "Sine";  },
    FunctionString : function() { return  "Sin(2*inputSignal)"; },
    FunctionDescription : function() { return "Sin function with doubled period";  }
};

actNS.SteepenedSigmoid  = function() {};
actNS.SteepenedSigmoid.prototype =
{
    Calculate : function(inputSignal) {  	return 1.0/(1.0 + Math.exp(-4.9*inputSignal)); },
    FunctionId : function() { return "SteepenedSigmoid";  },
    FunctionString : function() { return  "1.0/(1.0 + exp(-4.9*inputSignal))"; },
    FunctionDescription : function() { return "Steepened sigmoid [xrange -1.0,1.0][yrange, 0.0,1.0]";  }
};

actNS.SteepenedSigmoidApproximation  = function() {};
actNS.SteepenedSigmoidApproximation.prototype =
{
    Calculate : function(inputSignal) {
        var one = 1.0;
        var one_half = 0.5;

        if(inputSignal<-1.0)
        {
            return 0.0;
        }
        else if(inputSignal<0.0)
        {
            return (inputSignal+one)*(inputSignal+one)*one_half;
        }
        else if(inputSignal<1.0)
        {
            return 1.0-(inputSignal-one)*(inputSignal-one)*one_half;
        }
        else
        {
            return 1.0;
        }},
    FunctionId : function() { return "SteepenedSigmoidApproximation";  },
    FunctionString : function() { return ""; },
    FunctionDescription : function() { return "SteepenedSigmoidApproximation"; }
};

actNS.StepFunction  = function() {};
actNS.StepFunction.prototype =
{
    Calculate : function(inputSignal) {
        if(inputSignal<0.0) return 0.0;
        else return 1.0;
    },
    FunctionId : function() { return "StepFunction";  },
    FunctionString : function() { return  "x less than 0 ? 0.0 : 1.0"; },
    FunctionDescription : function() { return  "Step function [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};
