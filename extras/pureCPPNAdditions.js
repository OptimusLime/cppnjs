//The purpose of this file is to only extend CPPNs to have additional activation capabilities involving turning
//cppns into a string!

var CPPN = require("../networks/cppn");

//for convenience, you can require pureCPPNAdditions
module.exports = CPPN;

var CPPNPrototype = CPPN.prototype;

CPPNPrototype.createPureCPPNFunctions = function()
{

    var self = this;

    //create our enclosed object for each node! (this way we actually have subnetworks functions setup too
    self.nEnclosed = new Array(self.neuronSignals.length);

    self.bAlreadyEnclosed = new Array(self.neuronSignals.length);
    self.inEnclosure = new Array(self.neuronSignals.length);

    // Initialize boolean arrays and set the last activation signal, but only if it isn't an input (these have already been set when the input is activated)
    for (var i = 0; i < self.nEnclosed.length; i++)
    {
        // Set as activated if i is an input node, otherwise ensure it is unactivated (false)
        self.bAlreadyEnclosed[i] = (i < self.totalInputNeuronCount) ? true : false;
        self.nEnclosed[i] = (i < self.totalInputNeuronCount ? "x" + i : "");

        self.inEnclosure[i] = false;

    }

    // Get each output node activation recursively
    // NOTE: This is an assumption that genomes have started minimally, and the output nodes lie sequentially after the input nodes
    for (var i = 0; i < self.outputNeuronCount; i++){

//            for (var m = 0; m < self.nEnclosed.length; m++)
//            {
//                // Set as activated if i is an input node, otherwise ensure it is unactivated (false)
//                self.bAlreadyEnclosed[m] = (m < self.totalInputNeuronCount) ? true : false;
//                self.inEnclosure[m] = false;
//            }


        self.nrEncloseNode(self.totalInputNeuronCount + i);

    }

//        console.log(self.nEnclosed);

    //now grab our ordered objects
    var orderedObjects = self.recursiveCountThings();

//        console.log(orderedObjects);

    //now let's build our functions
    var nodeFunctions = {};

    var stringFunctions = {};

    var emptyNodes = {};

    for(var i= self.totalInputNeuronCount; i < self.totalNeuronCount; i++)
    {
        //skip functions that aren't defined
        if(!self.bAlreadyEnclosed[i]){
            emptyNodes[i] = true;
            continue;
        }

        var fnString = "return " + self.nEnclosed[i] + ';';
        nodeFunctions[i] = new Function([], fnString);
        stringFunctions[i] = fnString;
    }

    var inOrderAct = [];
    //go through and grab the indices -- no need for rank and things
    orderedObjects.forEach(function(oNode)
    {
        if(!emptyNodes[oNode.node])
            inOrderAct.push(oNode.node);
    });


    var containedFunction = function(nodesInOrder, functionsForNodes, biasCount, outputCount)
    {
        return function(inputs)
        {
            var bias = 1.0;
            var context = {};
            context.rf = new Array(nodesInOrder.length);
            var totalIn = inputs.length + biasCount;

            for(var i=0; i < biasCount; i++)
                context.rf[i] = bias;

            for(var i=0; i < inputs.length; i++)
                context.rf[i+biasCount] = inputs[i];


            for(var i=0; i < nodesInOrder.length; i++)
            {
                var fIx = nodesInOrder[i];
//                console.log('Ix to hit: ' fIx + );
                context.rf[fIx] = (fIx < totalIn ? context.rf[fIx] : functionsForNodes[fIx].call(context));
            }

            return context.rf.slice(totalIn, totalIn + outputCount);
        }
    };

    //this will return a function that can be run by calling var outputs = functionName(inputs);
    var contained =  containedFunction(inOrderAct, nodeFunctions, self.biasNeuronCount, self.outputNeuronCount);

    return {contained: contained, stringFunctions: stringFunctions, arrayIdentifier: "this.rf", nodeOrder: inOrderAct};


//        console.log(self.nEnclosed[self.totalInputNeuronCount + 0].length);
//        console.log('Enclosed nodes: ');
//        console.log(self.nEnclosed);

//        console.log('Ordered: ');
//        console.log(orderedActivation);

};



CPPNPrototype.nrEncloseNode = function(currentNode)
{
    var self = this;

    // If we've reached an input node we return since the signal is already set

//        console.log('Checking: ' + currentNode);
//        console.log('Total: ');
//        console.log(self.totalInputNeuronCount);


    if (currentNode < self.totalInputNeuronCount)
    {
        self.inEnclosure[currentNode] = false;
        self[currentNode] = 'this.rf[' + currentNode + ']';
        return;
    }
    if (self.bAlreadyEnclosed[currentNode])
    {
        self.inEnclosure[currentNode] = false;
        return;
    }

    // Mark that the node is currently being calculated
    self.inEnclosure[currentNode] = true;

    // Adjacency list in reverse holds incoming connections, go through each one and activate it
    for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
    {
        var crntAdjNode = self.reverseAdjacentList[currentNode][i];

        //{ Region recurrant connection handling - not applicable in our implementation
        // If this node is currently being activated then we have reached a cycle, or recurrant connection. Use the previous activation in this case
        if (self.inEnclosure[crntAdjNode])
        {
            //easy fix, this isn't meant for recurrent networks -- just throw an error!
            throw new Error("Method not built for recurrent networks!");
        }

        // Otherwise proceed as normal
        else
        {

            // Recurse if this neuron has not been activated yet
            if (!self.bAlreadyEnclosed[crntAdjNode])
                self.nrEncloseNode(crntAdjNode);

//                console.log('Next: ');
//                console.log(crntAdjNode);
//                console.log(self.nEnclosed[crntAdjNode]);

            var add = (self.nEnclosed[currentNode] == "" ? "(" : "+");

            //get our weight from adjacency matrix
            var weight = self.adjacentMatrix[crntAdjNode][currentNode];

            //we have a whole number weight!
            if(Math.round(weight) === weight)
                weight = '' + weight + '.0';
            else
                weight = '' + weight;


            // Add it to the new activation
            self.nEnclosed[currentNode] += add + weight + "*" + "this.rf[" + crntAdjNode + "]";

        }
        //} endregion
//            nodeCount++;
    }

    //if we're empty, we're empty! We don't go no where, derrrr
    if(self.nEnclosed[currentNode] === '')
        self.nEnclosed[currentNode] = '0.0';
    else
        self.nEnclosed[currentNode] += ')';

    // Mark this neuron as completed
    self.bAlreadyEnclosed[currentNode] = true;

    // This is no longer being calculated (for cycle detection)
    self.inEnclosure[currentNode] = false;


//        console.log('Enclosed legnth: ' + self.activationFunctions[currentNode].enclose(self.nEnclosed[currentNode]).length);

    self.nEnclosed[currentNode] = self.activationFunctions[currentNode].enclose(self.nEnclosed[currentNode]);

};

CPPNPrototype.recursiveCountThings = function()
{
    var self= this;

    var orderedActivation = {};

    var higherLevelRecurse = function(neuron)
    {
        var inNode = new Array(self.totalNeuronCount);
        var nodeCount = new Array(self.totalNeuronCount);
        var interactCount = new Array(self.totalNeuronCount);

        for(var s=0; s < self.totalNeuronCount; s++) {
            inNode[s] = false;
            nodeCount[s] = 0;
            interactCount[s] = 0;
        }

        var recurseNode = function(currentNode)
        {
            // Mark that the node is currently being calculated
            inNode[currentNode] = true;

            var recurse = {};

            // Adjacency list in reverse holds incoming connections, go through each one and activate it
            for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
            {
                var crntAdjNode = self.reverseAdjacentList[currentNode][i];


                recurse[i] = (nodeCount[crntAdjNode] < nodeCount[currentNode] + 1);

                nodeCount[crntAdjNode] = Math.max(nodeCount[crntAdjNode], nodeCount[currentNode] + 1);

            }
            //all nodes are marked with correct count, let's continue backwards for each one!
            for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
            {
                var crntAdjNode = self.reverseAdjacentList[currentNode][i];

                if(recurse[i])
                // Recurse on it! -- already marked above
                    recurseNode(crntAdjNode);

            }

            //            nodeCount[currentNode] = nodeCount[currentNode] + 1;
            inNode[currentNode] = false;

        };

        recurseNode(neuron);

        return nodeCount;
    };


    var orderedObjects = new Array(self.totalNeuronCount);

    // Get each output node activation recursively
    // NOTE: This is an assumption that genomes have started minimally, and the output nodes lie sequentially after the input nodes
    for (var m = 0; m < self.outputNeuronCount; m++){
        //we have ordered count for this output!

        var olist = higherLevelRecurse(self.totalInputNeuronCount + m);

        var nodeSpecificOrdering  = [];

        for(var n=0; n< olist.length; n++)
        {
            //we take the maximum depending on whether or not it's been seen before
            if(orderedObjects[n])
                orderedObjects[n] = {node: n, rank: Math.max(orderedObjects[n].rank, olist[n])};
            else
                orderedObjects[n] = {node: n, rank: olist[n]};

            nodeSpecificOrdering.push({node: n, rank: olist[n]});
        }

        nodeSpecificOrdering.sort(function(a,b){return b.rank - a.rank;});

        orderedActivation[self.totalInputNeuronCount + m] = nodeSpecificOrdering;
    }


    orderedObjects.sort(function(a,b){return b.rank - a.rank;});
//        console.log(orderedObjects);


    return orderedObjects;

};