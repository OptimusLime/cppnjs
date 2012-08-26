//requires some helpers

var nss = "NEAT.Activation";
var ns = namespace(nss);


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
        var className = stringToFunction(nss + "." + functionId);
        return new className(); // (IActivationFunction)Assembly.GetExecutingAssembly().CreateInstance(className);
    };

    ActivationFunctionFactory.GetRandomActivationFunction = function()
    {
        return functions[Maths.RouletteWheel.SingleThrow(probabilities)];
    };

    return ActivationFunctionFactory;
};

ns.BipolarSigmoid  = function() {};
ns.BipolarSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return (2.0 / (1.0 + Math.exp(-4.9 * inputSignal))) - 1.0; },
    FunctionId : function() { return "BipolarSigmoid";  },
    FunctionString : function() { return "2.0/(1.0 + exp(-4.9*inputSignal)) - 1.0"; },
    FunctionDescription : function() { return "bipolar steepend sigmoid"; }
};

ns.ErrorSign  = function() {  this.error = .0001;};
ns.ErrorSign.prototype =
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

ns.Gaussian  = function() {};
ns.Gaussian.prototype =
{
    Calculate : function(inputSignal) {  return  2 * Math.exp(-Math.pow(inputSignal * 2.5, 2)) - 1;},
    FunctionId : function() { return "Gaussian";  },
    FunctionString : function() { return  "2*e^(-(input*2.5)^2) - 1"; },
    FunctionDescription : function() { return "bimodal gaussian"; }
};

ns.InverseAbsoluteSigmoid  = function() {};
ns.InverseAbsoluteSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 0.5 + ((inputSignal / (1.0+Math.abs(inputSignal)))*0.5);},
    FunctionId : function() { return "InverseAbsoluteSigmoid";  },
    FunctionString : function() { return  ""; },
    FunctionDescription : function() { return ""; }
};

ns.Linear  = function() {};
ns.Linear.prototype =
{
    Calculate : function(inputSignal) { return Math.abs(inputSignal);},
    FunctionId : function() { return "Linear";  },
    FunctionString : function() { return " abs(x) [min=0, max=1]"; },
    FunctionDescription : function() { return "Linear"; }
};

ns.Modulus  = function() { this.delta = (2.0 / ns.Modulus.factor); };
ns.Modulus.factor = 5;
ns.Modulus.constant = 10000000;

ns.Modulus.prototype =
{
    Calculate : function(inputSignal, fact) {
        if(fact === undefined)
        {
            //shift to 0-max#
            inputSignal = ((51 + inputSignal));
            //find modulus (inputSignal>0 <ddelta)
            inputSignal *= ns.Modulus.constant ;
            inputSignal = (Math.floor(inputSignal)% Math.floor(this.delta * ns.Modulus.constant));
            inputSignal /= ns.Modulus.constant ;
            inputSignal = inputSignal * (ns.Modulus.factor);
            return (inputSignal) - 1;
        }
        else
        {
            var delta = 2.0 / fact;
            inputSignal += 51;
            inputSignal *= ns.Modulus.constant;
            inputSignal = Math.floor(inputSignal) % Math.floor(delta * ns.Modulus.constant);
            inputSignal /= ns.Modulus.constant;
            inputSignal *= fact;
            return inputSignal - 1;
        }
    },
    FunctionId : function() { return "Modulus"; },
    FunctionString : function() { return "Mod" + ns.Modulus.factor; },
    FunctionDescription : ns.Modulus.FunctionId
};

ns.NullFn  = function() {};
ns.NullFn.prototype =
{
    Calculate : function() {  return 0;},
    FunctionId : function() { return "NullFn";  },
    FunctionString : function() { return  ""; },
    FunctionDescription : function() { return "return 0"; }
};

ns.PlainSigmoid  = function() {};
ns.PlainSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 1.0/(1.0+(Math.exp(-inputSignal)));},
    FunctionId : function() { return "PlainSigmoid";  },
    FunctionString : function() { return  "1.0/(1.0+(exp(-inputSignal)))"; },
    FunctionDescription : function() { return "Plain sigmoid [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};

ns.ReducedSigmoid  = function() {};
ns.ReducedSigmoid.prototype =
{
    Calculate : function(inputSignal) {  return 1.0/(1.0+(Math.exp(-0.5*inputSignal)));},
    FunctionId : function() { return "ReducedSigmoid";  },
    FunctionString : function() { return "1.0/(1.0+(exp(-0.5*inputSignal)))"; },
    FunctionDescription : function() { return "Reduced Sigmoid  [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};

ns.SigmoidApproximation  = function() {};
ns.SigmoidApproximation.prototype =
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

ns.Sign  = function() {};
ns.Sign.prototype =
{
    Calculate : function(inputSignal) {
        if (isNaN(inputSignal)) return 0;
        return Math.sign(inputSignal);
    },
    FunctionId : function() { return "Sign";  },
    FunctionString : function() { return "Sign(x)"; },
    FunctionDescription : function() { return "Returns the sign of the input"; }
};

ns.Sine  = function() {};
ns.Sine.prototype =
{
    Calculate : function(inputSignal) {  return  Math.sin(2*inputSignal);},
    FunctionId : function() { return "Sine";  },
    FunctionString : function() { return  "Sin(2*inputSignal)"; },
    FunctionDescription : function() { return "Sin function with doubled period";  }
};

ns.SteepenedSigmoid  = function() {};
ns.SteepenedSigmoid.prototype =
{
    Calculate : function(inputSignal) {  	return 1.0/(1.0 + Math.exp(-4.9*inputSignal)); },
    FunctionId : function() { return "SteepenedSigmoid";  },
    FunctionString : function() { return  "1.0/(1.0 + exp(-4.9*inputSignal))"; },
    FunctionDescription : function() { return "Steepened sigmoid [xrange -1.0,1.0][yrange, 0.0,1.0]";  }
};

ns.SteepenedSigmoidApproximation  = function() {};
ns.SteepenedSigmoidApproximation.prototype =
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

ns.StepFunction  = function() {};
ns.StepFunction.prototype =
{
    Calculate : function(inputSignal) {
        if(inputSignal<0.0) return 0.0;
        else return 1.0;
    },
    FunctionId : function() { return "StepFunction";  },
    FunctionString : function() { return  "x less than 0 ? 0.0 : 1.0"; },
    FunctionDescription : function() { return  "Step function [xrange -5.0,5.0][yrange, 0.0,1.0]"; }
};
