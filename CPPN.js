var cppnsNSS = "CPPNs";
var cppnsNS = namespace(cppnsNSS);


cppnsNS.NeuronType =
{
    Input: 0,
    Bias : 1,
    Hidden : 2,
    Output : 3,
    Undefined : 4
};


cppnsNS.INetwork =
{
    SingleStep : function(){},
    MultipleSteps: function(numberOfSteps){},
    /// <summary>
    /// Relax the network. Relaxing refers to activating a network until the amount that signals within
    /// it are changing within a cetain limit, here defined by maxAllowedSignalDelta. Change is the
    /// absolute difference between a neuron's output signals between two successive activations.
    /// </summary>
    /// <param name="maxSteps">The number of timesteps to run the network before we give up.</param>
    /// <param name="maxAllowedSignalDelta"></param>
    /// <returns>False if the network did not relax. E.g. due to oscillating signals.</returns>
    RelaxNetwork: function(maxSteps,maxAllowedSignalDelta) {},

    /// <summary>
    /// Assigns a single input signal value.
    /// </summary>
    /// <param name="index"></param>
    /// <param name="signalValue"></param>
    SetInputSignal: function( index,  signalValue){},

    /// <summary>
    /// Assigns an array of input signals. IF the array is too long then excess signals are ignored.
    /// If too short then the input neurons with no input keep their pre-existing value.
    /// </summary>
    /// <param name="signalArray"></param>
    SetInputSignals: function(signalArray){},

    /// <summary>
    /// If index is greater than the number of output neurons then we loop back to the first neuron.
    /// Therefore we return a value for any given index number >=0.
    /// </summary>
    /// <param name="index"></param>
    /// <returns></returns>
    GetOutputSignal: function(index){},

    /// <summary>
    /// Reset all inter-neuron signals to zero. This is all neurons except the bias neuron.
    /// Useful when performing successive trials on a network.
    /// </summary>
    ClearSignals: function(){},

    InputNeuronCount : function(){},
    OutputNeuronCount : function(){},
    TotalNeuronCount : function(){}
};

//Now we need to define other things like connections and neurons

//more traditional connection type

cppnsNS.Connection = function( sourceID,  targetID,  cWeight)
{
    var sourceNeuronId = sourceID; // These are redundant in normal operation (we have a reference to the neurons)
    var targetNeuronId = targetID;	// but is useful when creating/loading a network.

    var sourceNeuron;
    var weight = cWeight;

    this.SetSourceNeuron = function(neuron)
    {
        sourceNeuron = neuron;
    };

    this.SourceNeuronId = function (source) {  //getter or setter here!
                                      if(source === undefined) return sourceNeuronId;
                                      else sourceNeuronId = source;};
    this.TargetNeuronId = function(target){ //getter or setter here!
                                    if(target === undefined) return targetNeuronId;
                                     else targetNeuronId = target;};

    this.Weight = function () { return weight; };
    this.SourceNeuron = function(){return sourceNeuron;};
};


//simple connection type -- from FloatFastConnection.cs
cppnsNS.FastConnection = function(){};
cppnsNS.FastConnection.prototype =
{
        sourceNeuronIdx : 0,
        targetNeuronIdx : 0,
        weight : 0,
        signal : 0,
        A : 0,
        B : 0,
        C : 0,
        D : 0,
        modConnection: 0,
        learningRate: 0
};

//simple neuron type
cppnsNS.Neuron = function(actFn, neurType, theId){

    var activationFn = actFn;
    var	neuronType = neurType;
    var	id = theId;

    var	outputValue;	// Output signal.
    if(neuronType == cppnsNS.NeuronType.Bias)
        outputValue = 1.0;
    else
        outputValue = 0.0;

    var	outputRecalc;	// The recalculated output is not updated immediately. A complete pass of the network is
    // done using the existing output values, and then we switch the network over to the the
    // recalced values in a second pass. This way we simulate the workings of a parallel network.

    var connectionList = [];// All of the incoming connections to a neuron. The neuron can recalculate it's own output value by iterating throgh this collection.

    //methods for returning private variables

    //for returning private variables
    this.NeuronType = function(){return neuronType;};
    this.Id = function(){return id;};
    this.OutputValue = function(out){   //getter or setter here!
                                        if(out === undefined) return outputValue;
                                        else outputValue = out;};

    this.OutputDelta = function () { return Math.abs(outputValue - outputRecalc); };
    this.ConnectionList = function(){return connectionList;};
    /// <summary>
    /// Recalculate this neuron's output value.
    /// </summary>
    this.Recalc = function(){
    // No recalculation required for input or bias nodes.
        if(neuronType==cppnsNS.NeuronType.Input || neuronType==cppnsNS.NeuronType.Bias)
            return;

        // Iterate the connections and total up the input signal from all of them.
        var accumulator=0;
        var loopBound = connectionList.length;
        for(var i=0; i<loopBound; i++)
        {
            var connection = connectionList[i];
            accumulator += connection.SourceNeuron().OutputValue()* connection.Weight();
        }

        outputRecalc = activationFn.Calculate(accumulator);
    };

    this.UseRecalculatedValue = function(){
        // No recalculation required for input or bias nodes.
        if(neuronType==cppnsNS.NeuronType.Input || neuronType==cppnsNS.NeuronType.Bias)
            return;

        outputValue = outputRecalc;
    };
};

//we need the basic framework for an abstract network
cppnsNS.AbstractNetwork = function(neuronList){

    this.inputNeuronList = []; //new NeuronList();
    this.outputNeuronList = [];//new NeuronList();
    this.LoadNeuronList(neuronList);
};
cppnsNS.AbstractNetwork.inheritsFrom(cppnsNS.INetwork );

cppnsNS.AbstractNetwork.inputNeuronList = [];
cppnsNS.AbstractNetwork.outputNeuronList = [];
cppnsNS.AbstractNetwork.masterNeuronList = [];

cppnsNS.AbstractNetwork.prototype.LoadNeuronList=function(neuronList){
    //can't load something that isn't there!
    if(!neuronList)
        return;

    this.masterNeuronList = neuronList;


    var loopBound = this.masterNeuronList.length;
    for(var j=0; j<loopBound; j++)
    {
        var neuron = this.masterNeuronList[j];

        switch(neuron.NeuronType())
        {
            case cppnsNS.NeuronType.Input:
                this.inputNeuronList.push(neuron);
                break;

            case cppnsNS.NeuronType.Output:
                this.outputNeuronList.push(neuron);
                break;
        }
    }
};
//Methods implemented from INetwork
cppnsNS.AbstractNetwork.prototype.SetInputSignal = function(index, signalValue)
{
    this.inputNeuronList[index].OutputValue(signalValue);// = signalValue;
};

cppnsNS.AbstractNetwork.prototype.SetInputSignals = function(signalArray)
{
    // For speed we don't bother with bounds checks.
    for(var i=0; i<signalArray.length; i++)
        this.inputNeuronList[i].OutputValue(signalArray[i]);// = signalArray[i];
};

cppnsNS.AbstractNetwork.prototype.GetOutputSignal = function(index)
{
    return this.outputNeuronList[index].OutputValue();
};

cppnsNS.AbstractNetwork.prototype.ClearSignals = function()
{
    var loopBound = this.masterNeuronList.length;
    for(var j=0; j<loopBound; j++)
    {
        var neuron = this.masterNeuronList[j];
        if(neuron.NeuronType() != cppnsNS.NeuronType.Bias)
            neuron.OutputValue(0);
    }
};

//Here are the getters
cppnsNS.AbstractNetwork.prototype.InputNeuronCount = function(){ return this.inputNeuronList.length; };
cppnsNS.AbstractNetwork.prototype.OutputNeuronCount = function(){return this.outputNeuronList.length;};
cppnsNS.AbstractNetwork.prototype.MasterNeuronList = function(){return this.masterNeuronList;};

//Now the implementation of the CPPN


cppnsNS.CPPN = function(neuronList){
    //we call the base constructor with the context of this object
    this.parent.constructor.call(this, neuronList);
};

//CPPN inherits from abstract network
cppnsNS.CPPN.inheritsFrom(cppnsNS.AbstractNetwork);

cppnsNS.CPPN.prototype.TotalNeuronCount = function(){return 0;};

cppnsNS.CPPN.prototype.SingleStep = function()
{
    var loopBound = this.masterNeuronList.length;
    for(var j=0; j<loopBound; j++)
        this.masterNeuronList[j].Recalc();

    for(var z=0; z<loopBound; z++)
        this.masterNeuronList[z].UseRecalculatedValue();
};
cppnsNS.CPPN.prototype.MultipleSteps = function(numberOfSteps)
{
    for(var i=0; i<numberOfSteps; i++)
        this.SingleStep();
};
cppnsNS.CPPN.prototype.RelaxNetwork = function(maxSteps,  maxAllowedSignalDelta)
{
    // Perform at least one step.
    this.SingleStep();

    // Now perform steps until the network is relaxed or maxSteps is reached.
    var loopBound;
    var isRelaxed=false;
    for(var i=0; i<maxSteps && !isRelaxed; i++)
    {
        isRelaxed=true;	// Assume true.

        // foreach syntax is 30% slower then this!
        loopBound = this.masterNeuronList.length;
        for(var j=0; j<loopBound; j++)
        {
            var neuron = this.masterNeuronList[j];
            neuron.Recalc();

            // If this flag is set then keep testing neurons. Otherwise there is no need to
            // keep testing.
            if(isRelaxed)
            {
                if(neuron.NeuronType() == cppnsNS.NeuronType.Hidden || neuron.NeuronType() == cppnsNS.NeuronType.Output)
                {
                    if(neuron.OutputDelta() > maxAllowedSignalDelta)
                        isRelaxed=false;
                }
            }
        }

        for(var z=0; z<loopBound; z++)
            this.masterNeuronList[z].UseRecalculatedValue();
    }

    return isRelaxed;
};


