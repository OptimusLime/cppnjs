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
    //Cos


    cppnActivationFunctions.ActivationFunction = function(functionObj)
    {
        var self = this;
        self.functionID = functionObj.functionID;
        self.functionString = functionObj.functionString;
        self.functionDescription = functionObj.functionDescription;
        self.calculate = functionObj.functionCalculate;
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
            }
        });
    };
    cppnActivationFunctions.Sine  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'Sine',
            functionString: "Sin(2*inputSignal)",
            functionDescription: "Sine function with doubled period",
            functionCalculate: function(inputSignal)
            {
                return Math.sin(2*inputSignal);
            }
         });
    };

    cppnActivationFunctions.Cos  = function(){
        return new cppnActivationFunctions.ActivationFunction({
            functionID:   'Cos',
            functionString: "Cos(2*inputSignal)",
            functionDescription: "Cosine function with doubled period",
            functionCalculate: function(inputSignal)
            {
                return Math.cos(2*inputSignal);
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
            }
        });
    };
    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppnActivationFunctions']={}: exports)//, this, typeof exports === 'undefined'? true : false);
