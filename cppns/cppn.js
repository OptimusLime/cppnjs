(function(exports, selfBrowser, isBrowser){

    var cppn = exports;
    var common = isBrowser ? selfBrowser['common'] : require('../cppnjs.js');
    var utilities = common.loadLibraryFile('cppnjs', 'utilities');

    cppn.CheckDependencies = function()
    {
        utilities = common.loadLibraryFile('cppnjs', 'utilities');
    };

    exports.CheckDependencies = function()
    {
        if(!isBrowser)
            return;

        utilities = selfBrowser['utilities'];
    };

    cppn.CPPN = function( biasNeuronCount,
                          inputNeuronCount,
                          outputNeuronCount,
                          totalNeuronCount,
                          connections,
                          biasList,
                          activationFunctions){

        var self = this;

        self.a = 0;
        self.b = 0;
        self.c = 0;
        self.d = 0;
        self.learningRate = 0;
        self.pre = 0;
        self.post = 0;

        self.adaptable = false;
        self.modulatory = false;

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
    };
    /// <summary>
    /// This function carries out a single network activation.
    /// It is called by all those methods that require network activations.
    /// </summary>
    /// <param name="maxAllowedSignalDelta">
    /// The network is not relaxed as long as the absolute value of the change in signals at any given point is greater than this value.
    /// Only positive values are used. If the value is less than or equal to 0, the method will return true without checking for relaxation.
    /// </param>
    /// <returns>True if the network is relaxed, or false if not.</returns>
    cppn.CPPN.prototype.singleStepInternal = function(maxAllowedSignalDelta)
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
            var coordinates = new float[4];
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
                        self.connections[i].weight = 5.0 * utilities.sign(self.connections[i].weight);
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
                        self.connections[i].weight = 5.0 * utilities.sign(self.connections[i].weight);
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


    cppn.CPPN.prototype.singleStep = function(finished)
    {
        var self = this;
        self.singleStepInternal(0.0); // we will ignore the value of this function, so the "allowedDelta" argument doesn't matter.
        if (finished)
        {
            finished(null);
        }
    };

    cppn.CPPN.prototype.multipleSteps = function(numberOfSteps)
    {
        var self = this;
        for (var i = 0; i < numberOfSteps; i++) {
            self.singleStep();
        }
    };

    /// <summary>
    /// Using RelaxNetwork erodes some of the perofrmance gain of FastConcurrentNetwork because of the slightly
    /// more complex implemementation of the third loop - whe compared to SingleStep().
    /// </summary>
    /// <param name="maxSteps"></param>
    /// <param name="maxAllowedSignalDelta"></param>
    /// <returns></returns>
    cppn.CPPN.prototype.relaxNetwork = function(maxSteps, maxAllowedSignalDelta)
    {
        var self = this;
        var isRelaxed = false;
        for (var j = 0; j < maxSteps && !isRelaxed; j++) {
            isRelaxed = self.singleStepInternal(maxAllowedSignalDelta);
        }
        return isRelaxed;
    };

    cppn.CPPN.prototype.setInputSignal = function(index, signalValue)
    {
        var self = this;
        // For speed we don't bother with bounds checks.
        self.neuronSignals[self.biasNeuronCount + index] = signalValue;
    };

    cppn.CPPN.prototype.setInputSignals = function(signalArray)
    {
        var self = this;
        // For speed we don't bother with bounds checks.
        for (var i = 0; i < signalArray.length; i++)
            self.neuronSignals[self.biasNeuronCount + i] = signalArray[i];
    };

    //we can dispense of this by accessing neuron signals directly
    cppn.CPPN.prototype.getOutputSignal = function(index)
    {
        // For speed we don't bother with bounds checks.
        return this.neuronSignals[this.totalInputNeuronCount + index];
    };

    //we can dispense of this by accessing neuron signals directly
    cppn.CPPN.prototype.clearSignals = function()
    {
        var self = this;
        // Clear signals for input, hidden and output nodes. Only the bias node is untouched.
        for (var i = self.biasNeuronCount; i < self.neuronSignals.length; i++)
            self.neuronSignals[i] = 0.0;
    };

//    cppn.CPPN.prototype.TotalNeuronCount = function(){ return this.neuronSignals.length;};

    cppn.CPPN.prototype.recursiveActivation = function(){

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


    cppn.CPPN.prototype.recursiveActivateNode = function(currentNode)
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


    cppn.CPPN.prototype.isRecursive = function()
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

    cppn.CPPN.prototype.recursiveCheckRecursive = function(currentNode)
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


    cppn.CPPN.prototype.recursiveEnclosure = function(){

        var self = this;

        var functions = [];
        self.inEnclose = [];

        // Initialize boolean arrays and set the last activation signal, but only if it isn't an input (these have already been set when the input is activated)
        for (var i = 0; i < self.neuronSignals.length; i++)
        {
            // Set as activated if i is an input node, otherwise ensure it is unactivated (false)
            self.inEnclose.push(false);
        }

        var inputs = [];

        for(var i=self.biasNeuronCount; i < self.totalInputNeuronCount; i++)
            inputs.push('x' + i);


        // Get each output node activation recursively
        // NOTE: This is an assumption that genomes have started minimally, and the output nodes lie sequentially after the input nodes
        for (var i = 0; i < self.outputNeuronCount; i++){
            var usedInputs = [];
            var fString = self.beginningFunction()
                 + self.recursiveEncloseNode(self.totalInputNeuronCount + i)
                + ';';

            for(var ins =0; ins < inputs.length; ins++)
            {
               if(fString.indexOf(inputs[ins]) !== -1)
               {
                   usedInputs.push(inputs[ins]);
               }
            }

            functions.push({inputs: usedInputs, functionString: fString, function: new Function(inputs, fString)});
        }
        return functions;

    };
    cppn.CPPN.prototype.beginningFunction = function()
    {
        var biasString = '';
        for(var b=0; b < this.biasNeuronCount; b++)
            biasString += 'var x' + b + ' = 1.0;';

        //mwahahahaha - set our bias object!
        return biasString + 'return ';

    };
    cppn.CPPN.prototype.doesContain = function(arr, obj)
    {
        for(var i=0; i < arr.length; i++)
        {
            if(arr[i] === obj)
                return true;
        }
        return false;
    }
    cppn.CPPN.prototype.recursiveEncloseNode = function(currentNode)
    {
        var self = this;

        if(currentNode < self.totalInputNeuronCount)
            return "x" + currentNode;

        self.inEnclose[currentNode] = true;

        var compiledFunction = '';

        // Adjacency list in reverse holds incoming connections, go through each one and activate it
        for (var i = 0; i < self.reverseAdjacentList[currentNode].length; i++)
        {
            var crntAdjNode = self.reverseAdjacentList[currentNode][i];

            if(self.inEnclose[crntAdjNode])
            {
                console.log('Current and recursive: ');
                console.log(self.reverseAdjacentList[currentNode]);
                console.log(self.isRecursive());
                console.log(self);

                console.log('Did hit recursive?')
                self.clearSignals();
                self.setInputSignals([1.0,1.0,1.0]);
                self.recursiveActivation();
                console.log('in between thse?')
                //don't enclose this node, since we've detected a loop here, abandon it!
                throw new Error("Method not built for recurrent networks!")
            }

            var recursedFunction = self.recursiveEncloseNode(crntAdjNode);

            //if wer're non-empty, add some weigths and what have you!
            if(recursedFunction !== ''){

                var weight = self.adjacentMatrix[crntAdjNode][currentNode];
                //we have a whole number weight!
                if(Math.round(weight) === weight)
                    weight = '' + weight + '.0';
                else
                    weight = '' + weight;

                compiledFunction +=  (i === 0 ? '(' : ' + ') + weight + '*' + recursedFunction;
            }
        }

        //if we're empty, we're empty! We don't go no where, derrrr
        if(compiledFunction === '')
            compiledFunction = '0.0';
        else
            compiledFunction += ')';

//        self.inEnclose[currentNode] = false;

        //otherwise, return our object activated
        return self.activationFunctions[currentNode].enclose(compiledFunction);
    };

//    var nodeCount = 0;

    cppn.CPPN.prototype.nrEnclose = function()
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



    cppn.CPPN.prototype.nrEncloseNode = function(currentNode)
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


    cppn.CPPN.prototype.recursiveCountThings = function()
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



//        self.rf = [];
//        for(var tn =0; tn < self.totalNeuronCount; tn++)
//            self.rf.push(0.0);




//        for(var m=0; m < 128*128; m++)
//        {
//            var inputs = [1.0, Math.random(),Math.random(),Math.random()];
//
//            var onlyNeurons = [].slice.call(inputs);
//            onlyNeurons.shift();
//
//            self.clearSignals();
//            self.setInputSignals(onlyNeurons);
//            self.recursiveActivation();
//
//            var outs = activationFunction(onlyNeurons);
//            for(var i=0; i < outs.length; i++)
//            {
//
//                if(outs[i] != self.getOutputSignal(i))
//                {
//                    console.log('New Act: '  + outs[i]);
//                    console.log("Old Act: " + self.getOutputSignal(i));
//
//                }
//            }

//            for(var i=0; i < self.totalInputNeuronCount; i++)
//            {
//                self.rf[i] = (i < self.totalInputNeuronCount ? inputs[i] : 0.0);
//            }
//
//
//            var orderForOutput = orderedObjects;//orderedActivation[self.totalInputNeuronCount];
//
//            for(var o=0; o < orderForOutput.length; o++)
//            {
//                var oNode = orderForOutput[o];
//                var nodeIx = oNode.node;
//
//                //either it's our inputs, and we just set them up
//                if(nodeIx >= self.totalInputNeuronCount)
//                    self.rf[nodeIx] = nodeFunctions[nodeIx].call(self);
//
//
//                var fDiff = (self.rf[nodeIx] - self.neuronSignals[nodeIx]);
//                if(Math.abs(fDiff)> 0.0)
//                {
//                    console.log('NodeNotMatched: ' + nodeIx);
//                    console.log(self.reverseAdjacentList[nodeIx]);
//                    console.log('Out: ' + fDiff);
//
//                    var iConns = [];
//                    for(var c=0; c < self.connections.length; c++)
//                    {
//                        var sConn = self.connections[c];
//                        if(sConn.targetIdx == nodeIx)
//                        {
//                            iConns.push(sConn);
//                        }
//                    }
//                    console.log('Incoming connections: ');
//                    console.log(iConns);
//
//                }
////                console.log('Out: ' + self.rf[nodeIx]);
////                console.log('Act: ' + self.neuronSignals[nodeIx]);
//
//
//    //            console.log('Node: '+ nodeIx + ' Rank: ' + oNode.rank);
//    //            console.log(self.rf[nodeIx]);
//
//            }
//
//            for(var o=0; o < self.outputNeuronCount; o++){
//
//                var oDiff = (self.rf[self.totalInputNeuronCount + o] - self.getOutputSignal(o));
//                if(Math.abs(oDiff)> 0.0)
//                {
//            //        console.log(self.rf);
//                    console.log('Act os: ' + self.getOutputSignal(o));
//                    console.log('End rf: ' + self.rf[self.totalInputNeuronCount]);
//                }
//            }
//        }


//        var objToSort = [];
//
//        for(var o=0; o < olist.length; o++)
//        {
//            if you aren't the output we're interested, but you have a zero count, then you is doin sumtin wrong
//            if(o != m && olist[o] == 0)
//                continue;
//
//            objToSort.push({node: o, rank: olist[o]});
//        }
//
//        we want descending order!
//        objToSort.sort(function(a,b){return b.rank - a.rank;});

//        console.log(objToSort);
//        console.log('Check ordering: ');
//        console.log(orderedActivation);

    };




    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppn']={}: exports, this, typeof exports === 'undefined'? true : false);
