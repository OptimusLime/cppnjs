/**
 * Module dependencies.
 */

var utilities = require('../utility/utilities.js');

/**
 * Expose `CPPN`.
 */

module.exports = CPPN;

/**
 * Initialize a new error view.
 *
 * @param {Number} biasNeuronCount
 * @param {Number} inputNeuronCount
 * @param {Number} outputNeuronCount
 * @param {Number} totalNeuronCount
 * @param {Array} connections
 * @param {Array} biasList
 * @param {Array} activationFunctions
 * @api public
 */
function CPPN(
    biasNeuronCount,
    inputNeuronCount,
    outputNeuronCount,
    totalNeuronCount,
    connections,
    biasList,
    activationFunctions
    )
{
    var self = this;

    // must be in the same order as neuronSignals. Has null entries for neurons that are inputs or outputs of a module.
    self.activationFunctions = activationFunctions;

    // The modules and connections are in no particular order; only the order of the neuronSignals is used for input and output methods.
    //floatfastconnections
    self.connections = connections;

    /// The number of bias neurons, usually one but sometimes zero. This is also the index of the first input neuron in the neuron signals.
    self.biasNeuronCount = biasNeuronCount;
    /// The number of input neurons.
    self.inputNeuronCount = inputNeuronCount;
    /// The number of input neurons including any bias neurons. This is also the index of the first output neuron in the neuron signals.
    self.totalInputNeuronCount = self.biasNeuronCount + self.inputNeuronCount;
    /// The number of output neurons.
    self.outputNeuronCount = outputNeuronCount;

    //save the total neuron count for us
    self.totalNeuronCount = totalNeuronCount;

    // For the following array, neurons are ordered with bias nodes at the head of the list,
    // then input nodes, then output nodes, and then hidden nodes in the array's tail.
    self.neuronSignals = [];
    self.modSignals = [];

    // This array is a parallel of neuronSignals, and only has values during SingleStepInternal().
    // It is declared here to avoid having to reallocate it for every network activation.
    self.neuronSignalsBeingProcessed = [];

    //initialize the neuron,mod, and processing signals
    for(var i=0; i < totalNeuronCount; i++){
        //either you are 1 for bias, or 0 otherwise
        self.neuronSignals.push(i < self.biasNeuronCount ? 1 : 0);
        self.modSignals.push(0);
        self.neuronSignalsBeingProcessed.push(0);
    }

    self.biasList = biasList;

    // For recursive activation, marks whether we have finished this node yet
    self.activated = [];
    // For recursive activation, makes whether a node is currently being calculated. For recurrant connections
    self.inActivation = [];
    // For recursive activation, the previous activation for recurrent connections
    self.lastActivation = [];


    self.adjacentList = [];
    self.reverseAdjacentList = [];
    self.adjacentMatrix = [];


    //initialize the activated, in activation, previous activation
    for(var i=0; i < totalNeuronCount; i++){
        self.activated.push(false);
        self.inActivation.push(false);
        self.lastActivation.push(0);

        //then we initialize our list of lists!
        self.adjacentList.push([]);
        self.reverseAdjacentList.push([]);

        self.adjacentMatrix.push([]);
        for(var j=0; j < totalNeuronCount; j++)
        {
            self.adjacentMatrix[i].push(0);
        }
    }

//        console.log(self.adjacentList.length);

    //finally
    // Set up adjacency list and matrix
    for (var i = 0; i < self.connections.length; i++)
    {
        var crs = self.connections[i].sourceIdx;
        var crt = self.connections[i].targetIdx;

        // Holds outgoing nodes
        self.adjacentList[crs].push(crt);

        // Holds incoming nodes
        self.reverseAdjacentList[crt].push(crs);

        self.adjacentMatrix[crs][crt] = connections[i].weight;
    }
}


/// <summary>
/// Using RelaxNetwork erodes some of the perofrmance gain of FastConcurrentNetwork because of the slightly
/// more complex implemementation of the third loop - whe compared to SingleStep().
/// </summary>
/// <param name="maxSteps"></param>
/// <param name="maxAllowedSignalDelta"></param>
/// <returns></returns>
CPPN.prototype.relaxNetwork = function(maxSteps, maxAllowedSignalDelta)
{
    var self = this;
    var isRelaxed = false;
    for (var j = 0; j < maxSteps && !isRelaxed; j++) {
        isRelaxed = self.singleStepInternal(maxAllowedSignalDelta);
    }
    return isRelaxed;
};

CPPN.prototype.setInputSignal = function(index, signalValue)
{
    var self = this;
    // For speed we don't bother with bounds checks.
    self.neuronSignals[self.biasNeuronCount + index] = signalValue;
};

CPPN.prototype.setInputSignals = function(signalArray)
{
    var self = this;
    // For speed we don't bother with bounds checks.
    for (var i = 0; i < signalArray.length; i++)
        self.neuronSignals[self.biasNeuronCount + i] = signalArray[i];
};

//we can dispense of this by accessing neuron signals directly
CPPN.prototype.getOutputSignal = function(index)
{
    // For speed we don't bother with bounds checks.
    return this.neuronSignals[this.totalInputNeuronCount + index];
};

//we can dispense of this by accessing neuron signals directly
CPPN.prototype.clearSignals = function()
{
    var self = this;
    // Clear signals for input, hidden and output nodes. Only the bias node is untouched.
    for (var i = self.biasNeuronCount; i < self.neuronSignals.length; i++)
        self.neuronSignals[i] = 0.0;
};

//    cppn.CPPN.prototype.TotalNeuronCount = function(){ return this.neuronSignals.length;};

CPPN.prototype.recursiveActivation = function(){

    var self = this;
    // Initialize boolean arrays and set the last activation signal, but only if it isn't an input (these have already been set when the input is activated)
    for (var i = 0; i < self.neuronSignals.length; i++)
    {
        // Set as activated if i is an input node, otherwise ensure it is unactivated (false)
        self.activated[i] = (i < self.totalInputNeuronCount) ? true : false;
        self.inActivation[i] = false;
        if (i >= self.totalInputNeuronCount)
            self.lastActivation[i] = self.neuronSignals[i];
    }

    // Get each output node activation recursively
    // NOTE: This is an assumption that genomes have started minimally, and the output nodes lie sequentially after the input nodes
    for (var i = 0; i < self.outputNeuronCount; i++)
        self.recursiveActivateNode(self.totalInputNeuronCount + i);

};


CPPN.prototype.recursiveActivateNode = function(currentNode)
{
    var self = this;
    // If we've reached an input node we return since the signal is already set
    if (self.activated[currentNode])
    {
        self.inActivation[currentNode] = false;
        return;
    }

    // Mark that the node is currently being calculated
    self.inActivation[currentNode] = true;

    // Set the presignal to 0
    self.neuronSignalsBeingProcessed[currentNode] = 0;

    // Adjacency list in reverse holds incoming connections, go through each one and activate it
    for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
    {
        var crntAdjNode = self.reverseAdjacentList[currentNode][i];

        //{ Region recurrant connection handling - not applicable in our implementation
        // If this node is currently being activated then we have reached a cycle, or recurrant connection. Use the previous activation in this case
        if (self.inActivation[crntAdjNode])
        {
            //console.log('using last activation!');
            self.neuronSignalsBeingProcessed[currentNode] += self.lastActivation[crntAdjNode]*self.adjacentMatrix[crntAdjNode][currentNode];
//                    parseFloat(
//                    parseFloat(self.lastActivation[crntAdjNode].toFixed(9)) * parseFloat(self.adjacentMatrix[crntAdjNode][currentNode].toFixed(9)).toFixed(9));
        }

        // Otherwise proceed as normal
        else
        {
            // Recurse if this neuron has not been activated yet
            if (!self.activated[crntAdjNode])
                self.recursiveActivateNode(crntAdjNode);

            // Add it to the new activation
            self.neuronSignalsBeingProcessed[currentNode] +=  self.neuronSignals[crntAdjNode] *self.adjacentMatrix[crntAdjNode][currentNode];
//                    parseFloat(
//                    parseFloat(self.neuronSignals[crntAdjNode].toFixed(9)) * parseFloat(self.adjacentMatrix[crntAdjNode][currentNode].toFixed(9)).toFixed(9));
        }
        //} endregion
    }

    // Mark this neuron as completed
    self.activated[currentNode] = true;

    // This is no longer being calculated (for cycle detection)
    self.inActivation[currentNode] = false;

//        console.log('Current node: ' + currentNode);
//        console.log('ActivationFunctions: ');
//        console.log(self.activationFunctions);
//
//        console.log('neuronSignals: ');
//        console.log(self.neuronSignals);
//
//        console.log('neuronSignalsBeingProcessed: ');
//        console.log(self.neuronSignalsBeingProcessed);
    // Set this signal after running it through the activation function
    self.neuronSignals[currentNode] = self.activationFunctions[currentNode].calculate(self.neuronSignalsBeingProcessed[currentNode]);
//            parseFloat((self.activationFunctions[currentNode].calculate(parseFloat(self.neuronSignalsBeingProcessed[currentNode].toFixed(9)))).toFixed(9));

};


CPPN.prototype.isRecursive = function()
{
    var self = this;

    //if we're a hidden/output node (nodeid >= totalInputcount), and we connect to an input node (nodeid <= self.totalInputcount) -- it's recurrent!
    //if we are a self connection, duh we are recurrent
    for(var c=0; c< self.connections.length; c++)
        if((self.connections[c].sourceIdx >= self.totalInputNeuronCount
            && self.connections[c].targetIdx < self.totalInputNeuronCount)
            || self.connections[c].sourceIdx == self.connections[c].targetIdx
            )
            return true;

    self.recursed = [];
    self.inRecursiveCheck = [];


    for(var i=0; i < self.neuronSignals.length; i++)
    {

        self.recursed.push((i < self.totalInputNeuronCount) ? true : false);
        self.inRecursiveCheck.push(false);
    }

    // Get each output node activation recursively
    // NOTE: This is an assumption that genomes have started minimally, and the output nodes lie sequentially after the input nodes
    for (var i = 0; i < self.outputNeuronCount; i++){
        if(self.recursiveCheckRecursive(self.totalInputNeuronCount + i))
        {
//                console.log('Returned one!');
            return true;

        }
    }

    return false;

};

CPPN.prototype.recursiveCheckRecursive = function(currentNode)
{
    var self = this;


//        console.log('Self recursed : '+ currentNode + ' ? ' +  self.recursed[currentNode]);

//        console.log('Checking: ' + currentNode)
    //  If we've reached an input node we return since the signal is already set
    if (self.recursed[currentNode])
    {
        self.inRecursiveCheck[currentNode] = false;
        return false;
    }

    // Mark that the node is currently being calculated
    self.inRecursiveCheck[currentNode] = true;

    // Adjacency list in reverse holds incoming connections, go through each one and activate it
    for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
    {
        var crntAdjNode = self.reverseAdjacentList[currentNode][i];

        //{ Region recurrant connection handling - not applicable in our implementation
        // If this node is currently being activated then we have reached a cycle, or recurrant connection. Use the previous activation in this case
        if (self.inRecursiveCheck[crntAdjNode])
        {
            self.inRecursiveCheck[currentNode] = false;
            return true;
        }

        // Otherwise proceed as normal
        else
        {
            var verifiedRecursive;
            // Recurse if this neuron has not been activated yet
            if (!self.recursed[crntAdjNode])
                verifiedRecursive = self.recursiveCheckRecursive(crntAdjNode);

            if(verifiedRecursive)
                return true;
        }
        //} endregion
    }

    // Mark this neuron as completed
    self.recursed[currentNode] = true;

    // This is no longer being calculated (for cycle detection)
    self.inRecursiveCheck[currentNode] = false;

    return false;
};





(function(exports, selfBrowser, isBrowser){

    var cppn = {CPPN: {}};







    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppn']={}: exports, this, typeof exports === 'undefined'? true : false);
