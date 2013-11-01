//The purpose of this file is to only extend CPPNs to have additional activation capabilities involving mod connections

var cppnConnection = require("../networks/cppnConnection.js");
//default all the variables that need to be added to handle adaptable activation
var connectionPrototype = cppnConnection.prototype;
connectionPrototype.a = 0;
connectionPrototype.b = 0;
connectionPrototype.c = 0;
connectionPrototype.d = 0;
connectionPrototype.modConnection = 0;
connectionPrototype.learningRate = 0;


var CPPN = require("../networks/cppn");
//default all the variables that need to be added to handle adaptable activation
var cppnPrototype = CPPN.prototype;

cppnPrototype.a = 0;
cppnPrototype.b = 0;
cppnPrototype.c = 0;
cppnPrototype.d = 0;
cppnPrototype.learningRate = 0;
cppnPrototype.pre = 0;
cppnPrototype.post = 0;

cppnPrototype.adaptable = false;
cppnPrototype.modulatory = false;


/// <summary>
/// This function carries out a single network activation.
/// It is called by all those methods that require network activations.
/// </summary>
/// <param name="maxAllowedSignalDelta">
/// The network is not relaxed as long as the absolute value of the change in signals at any given point is greater than this value.
/// Only positive values are used. If the value is less than or equal to 0, the method will return true without checking for relaxation.
/// </param>
/// <returns>True if the network is relaxed, or false if not.</returns>
cppnPrototype.singleStepInternal = function(maxAllowedSignalDelta)
{
    var isRelaxed = true;	// Assume true.
    var self = this;
    // Calculate each connection's output signal, and add the signals to the target neurons.
    for (var i = 0; i < self.connections.length; i++) {

        if (self.adaptable)
        {
            if (self.connections[i].modConnection <= 0.0)   //Normal connection
            {
                self.neuronSignalsBeingProcessed[self.connections[i].targetIdx] += self.neuronSignals[self.connections[i].sourceIdx] * self.connections[i].weight;
            }
            else //modulatory connection
            {
                self.modSignals[self.connections[i].targetIdx] += self.neuronSignals[self.connections[i].sourceIdx] * self.connections[i].weight;

            }
        }
        else
        {
            self.neuronSignalsBeingProcessed[self.connections[i].targetIdx] += self.neuronSignals[self.connections[i].sourceIdx] * self.connections[i].weight;

        }
    }

    // Pass the signals through the single-valued activation functions.
    // Do not change the values of input neurons or neurons that have no activation function because they are part of a module.
    for (var i = self.totalInputNeuronCount; i < self.neuronSignalsBeingProcessed.length; i++) {
        self.neuronSignalsBeingProcessed[i] = self.activationFunctions[i].calculate(self.neuronSignalsBeingProcessed[i]+self.biasList[i]);
        if (self.modulatory)
        {
            //Make sure it's between 0 and 1
            self.modSignals[i] += 1.0;
            if (self.modSignals[i]!=0.0)
                self.modSignals[i] = utilities.tanh(self.modSignals[i]);//Tanh(modSignals[i]);//(Math.Exp(2 * modSignals[i]) - 1) / (Math.Exp(2 * modSignals[i]) + 1));
        }
    }
    //TODO Modules not supported in this implementation - don't care


    /*foreach (float f in neuronSignals)
     HyperNEATParameters.distOutput.Write(f.ToString("R") + " ");
     HyperNEATParameters.distOutput.WriteLine();
     HyperNEATParameters.distOutput.Flush();*/

    // Move all the neuron signals we changed while processing this network activation into storage.
    if (maxAllowedSignalDelta > 0) {
        for (var i = self.totalInputNeuronCount; i < self.neuronSignalsBeingProcessed.length; i++) {

            // First check whether any location in the network has changed by more than a small amount.
            isRelaxed &= (Math.abs(self.neuronSignals[i] - self.neuronSignalsBeingProcessed[i]) > maxAllowedSignalDelta);

            self.neuronSignals[i] = self.neuronSignalsBeingProcessed[i];
            self.neuronSignalsBeingProcessed[i] = 0.0;
        }
    } else {
        for (var i = self.totalInputNeuronCount; i < self.neuronSignalsBeingProcessed.length; i++) {
            self.neuronSignals[i] = self.neuronSignalsBeingProcessed[i];
            self.neuronSignalsBeingProcessed[i] = 0.0;
        }
    }

    // Console.WriteLine(inputNeuronCount);

    if (self.adaptable)//CPPN != null)
    {
        var coordinates = [0,0,0,0];
        var modValue;
        var weightDelta;
        for (var i = 0; i < self.connections.length; i++)
        {
            if (self.modulatory)
            {
                self.pre = self.neuronSignals[self.connections[i].sourceIdx];
                self.post = self.neuronSignals[self.connections[i].targetIdx];
                modValue = self.modSignals[self.connections[i].targetIdx];

                self.a = self.connections[i].a;
                self.b = self.connections[i].b;
                self.c = self.connections[i].c;
                self.d = self.connections[i].d;

                self.learningRate = self.connections[i].learningRate;
                if (modValue != 0.0 && (self.connections[i].modConnection <= 0.0))        //modulate target neuron if its a normal connection
                {
                    self.connections[i].weight += modValue*self.learningRate * (self.a * self.pre * self.post + self.b * self.pre + self.c * self.post + self.d);
                }

                if (Math.abs(self.connections[i].weight) > 5.0)
                {
                    self.connections[i].weight = 5.0 * Math.sign(self.connections[i].weight);
                }
            }
            else
            {
                self.pre = self.neuronSignals[self.connections[i].sourceIdx];
                self.post = self.neuronSignals[self.connections[i].targetIdx];
                self.a = self.connections[i].a;
                self.b = self.connections[i].b;
                self.c = self.connections[i].c;

                self.learningRate = self.connections[i].learningRate;

                weightDelta = self.learningRate * (self.a * self.pre * self.post + self.b * self.pre + self.c * self.post);
                connections[i].weight += weightDelta;

                //   Console.WriteLine(pre + " " + post + " " + learningRate + " " + A + " " + B + " " + C + " " + weightDelta);

                if (Math.abs(self.connections[i].weight) > 5.0)
                {
                    self.connections[i].weight = 5.0 * Math.sign(self.connections[i].weight);
                }
            }
        }
    }

    for (var i = self.totalInputNeuronCount; i < self.neuronSignalsBeingProcessed.length; i++)
    {
        self.modSignals[i] = 0.0;
    }

    return isRelaxed;

};


cppnPrototype.singleStep = function(finished)
{
    var self = this;
    self.singleStepInternal(0.0); // we will ignore the value of this function, so the "allowedDelta" argument doesn't matter.
    if (finished)
    {
        finished(null);
    }
};

cppnPrototype.multipleSteps = function(numberOfSteps)
{
    var self = this;
    for (var i = 0; i < numberOfSteps; i++) {
        self.singleStep();
    }
};
