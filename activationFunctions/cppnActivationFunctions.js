(function(exports){//, selfBrowser, isBrowser){

    var cppnActivationFunctions = exports;

    //implemented the following:
    //BipolarSigmoid
    //PlainSigmoid
    //Gaussian
    //Linear
    //NullFn
    //Sine
    //StepFunction


    cppnActivationFunctions.ActivationFunction = function(functionObj)
    {
        var self = this;
        self.functionID = functionObj.functionID;
        self.functionString = functionObj.functionString;
        self.functionDescription = functionObj.functionDescription;
        self.calculate = functionObj.functionCalculate;
        self.enclose = functionObj.functionEnclose;
//        console.log('self.calc');
//        console.log(self.calculate);
//        console.log(self.calculate(0));
    };


    cppnActivationFunctions.BipolarSigmoid = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID: 'BipolarSigmoid' ,
            functionString: "2.0/(1.0 + exp(-4.9*inputSignal)) - 1.0",
            functionDescription: "bipolar steepend sigmoid",
            functionCalculate: function(inputSignal)
            {
                return (2.0 / (1.0 + Math.exp(-4.9 * inputSignal))) - 1.0;
            },
            functionEnclose: function(stringToEnclose)
            {
                return "((2.0 / (1.0 + Math.exp(-4.9 *(" + stringToEnclose + ")))) - 1.0)";
            }
        });
    };

    cppnActivationFunctions.PlainSigmoid = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID: 'PlainSigmoid' ,
            functionString: "1.0/(1.0+(exp(-inputSignal)))",
            functionDescription: "Plain sigmoid [xrange -5.0,5.0][yrange, 0.0,1.0]",
            functionCalculate: function(inputSignal)
            {
                return 1.0/(1.0+(Math.exp(-inputSignal)));
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(1.0/(1.0+(Math.exp(-1.0*(" + stringToEnclose + ")))))";
            }
        });
    };

    cppnActivationFunctions.Gaussian  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:  'Gaussian',
            functionString: "2*e^(-(input*2.5)^2) - 1",
            functionDescription:"bimodal gaussian",
            functionCalculate: function(inputSignal)
            {
                return 2 * Math.exp(-Math.pow(inputSignal * 2.5, 2)) - 1;
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(2.0 * Math.exp(-Math.pow(" + stringToEnclose + "* 2.5, 2.0)) - 1.0)";
            }
        });
    };
    cppnActivationFunctions.Linear  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'Linear',
            functionString: "Math.abs(x)",
            functionDescription:"Linear",
            functionCalculate: function(inputSignal)
            {
                return Math.abs(inputSignal);
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(Math.abs(" + stringToEnclose + "))";
            }
        });
    };
    cppnActivationFunctions.NullFn  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'NullFn',
            functionString: "0",
            functionDescription: "returns 0",
            functionCalculate: function(inputSignal)
            {
                return 0.0;
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(0.0)";
            }
        });
    };
    cppnActivationFunctions.Sine2  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'Sine2',
            functionString: "Sin(2*inputSignal)",
            functionDescription: "Sine function with doubled period",
            functionCalculate: function(inputSignal)
            {
                return Math.sin(2*inputSignal);
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(Math.sin(2.0*(" + stringToEnclose + ")))";
            }
        });
    };

    cppnActivationFunctions.Sine  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'Sine',
            functionString: "Sin(inputSignal)",
            functionDescription: "Sine function with normal period",
            functionCalculate: function(inputSignal)
            {
                return Math.sin(inputSignal);
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(Math.sin(" + stringToEnclose + "))";
            }
        });
    };

    cppnActivationFunctions.StepFunction  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:    'StepFunction',
            functionString: "x<=0 ? 0.0 : 1.0",
            functionDescription: "Step function [xrange -5.0,5.0][yrange, 0.0,1.0]",
            functionCalculate: function(inputSignal)
            {
                if(inputSignal<=0.0)
                    return 0.0;
                else
                    return 1.0;
            },
            functionEnclose: function(stringToEnclose)
            {
                return "(((" + stringToEnclose + ') <= 0.0) ? 0.0 : 1.0)';
            }
        });
    };
    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppnActivationFunctions']={}: exports)//, this, typeof exports === 'undefined'? true : false);
