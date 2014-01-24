var CPPN = require("../networks/cppn");
//default all the variables that need to be added to handle adaptable activation
var cppnPrototype = CPPN.prototype;

module.exports = CPPN;

//perceptron is just like CPPN, except the learning rate and what have you

cppnPrototype.learningRate = .1;
cppnPrototype.superviseError = function(correctOutputs)
{
    var self = this;
    //we've been given some wrong information!
    if(correctOutputs.length != self.outputNeuronCount)
    {
        var outputStart = self.totalInputNeuronCount;
        for(var o=0; o < correctOutputs.length; o++)
        {
            var correct = correctOutputs[o];
            var guess = self.getOutputSignal(o);

            var error = guess - correct;

            for(var c=0; c < self.connections.length; c++)
            {
                if(self.connections[c].targetIdx == outputStart + o)
                {
                    var src = self.connections[c].sourceIdx;
                    //if we're the target output, we need to adjust weights according to their contribution

                    //I belive this assuming all inputs are [0,1] -- might have to adjust accordingly when not that way
                    var deltaW = self.learningRate*error*self.neuronSignals[src];
                    self.connections[c].weight = self.connections[c].weight + deltaW;
                }
            }
        }
    }
}
