var CPPN = require("../networks/cppn");
var CPPNConnection = require("../networks/cppnConnection.js");

module.exports = AutoEncodeCPPN;

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
function AutoEncodeCPPN(
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

    self.forwardCPPN = new CPPN(biasNeuronCount, inputNeuronCount, outputNeuronCount, totalNeuronCount, connections, biasList, activationFunctions);

    //array to hold our "backwards" connections
    var reverseConnections = [];
    //going to ignore the logic for reversing bias list as it's not currently in use
    var reverseBiasList = [];
    var reverseActivationFunctions = [];

    var highestInput = biasNeuronCount + inputNeuronCount;
    var highestOutput = biasNeuronCount + inputNeuronCount + outputNeuronCount;

    //how does one reverse a CPPN
    //what was once inputs must become outputs and vice versa
    for(var i=0; i < connections.length; i++)
    {
        var c = connections[i];

        //if your source or target ID is NOT a bias
        if(c.sourceIdx >= biasNeuronCount && c.targetIdx >= biasNeuronCount)
        {
            //switch the source and the target, thereby reversing the connection
            var src = c.targetIdx;
            var tgt = c.sourceIdx;

            //one last thing, we'll reorder the nodes to be a proper sequence
            //inputs must now be ordered after outputs (inputs switch places with outputs)
            //so inputs++ while outputs--
            if(src < highestInput)
            {
                //src is an input node
                //in the reverse, they are an output neuron, so let's change this by adding original outputneuron count
                src = src + outputNeuronCount;
            }
            else if(src < highestOutput)
            {
                //src is an output node
                //we adjust outputs to be inputs by simply subtracting the number of actual inputs
                src = src - inputNeuronCount;
            }
            //otherwise, src is a hidden, and nothing has to change with the ordering

            //do the same with targets, see above for explanation
            if(tgt < highestInput){tgt = tgt + outputNeuronCount;}
            else if(tgt < highestOutput){tgt = tgt - inputNeuronCount;}

            //also subtract out the bias count, since there are none in reverse world
            src = src  - biasNeuronCount;
            tgt = tgt  - biasNeuronCount;

            //keep the weights
            var rConn = new CPPNConnection(src, tgt, c.weight);
            reverseConnections.push(rConn);
        }
    }

    //ouputs become inputs, so they go first :)
    for(var i= highestInput; i< highestOutput; i++)
    {
        reverseActivationFunctions.push(activationFunctions[i]);
    }

    //now we make inputs into outputs, so they follow
    for(var i= biasNeuronCount; i< highestInput; i++)
    {
        reverseActivationFunctions.push(activationFunctions[i]);
    }

    //now we add hidden neurons in proper order, heh heh
    for(var i= highestOutput; i < totalNeuronCount; i++)
    {
        reverseActivationFunctions.push(activationFunctions[i]);
    }

    //backwards CPPNs don't have any bias inputs, and also the input and output counts are reversed
    //total neurons = total - bias, since there are zero bias neurons
    self.backwardsCPPN = new CPPN(0, outputNeuronCount, inputNeuronCount, totalNeuronCount-biasNeuronCount, reverseConnections, reverseBiasList, reverseActivationFunctions);

}