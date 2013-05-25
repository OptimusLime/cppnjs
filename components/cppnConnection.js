(function(exports, selfBrowser, isBrowser){

    var cppnConnection = exports;

    //more traditional connection type

    cppnConnection.OldConnection = function( sourceID,  targetID,  cWeight)
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
    cppnConnection.CPPNConnection = function(
        sourceIdx,
        targetIdx,
        cWeight
        ){

        var self = this;
        self.sourceIdx =    sourceIdx;
        self.targetIdx =    targetIdx;
        self.weight = cWeight;

        self.signal =0;
        self.a =0;
        self.b =0;
        self.c =0;
        self.d =0;
        self.modConnection=0;
        self.learningRate=0;

    };



    //send in the object, and also whetehr or not this is nodejs
})(typeof exports === 'undefined'? this['cppnjs']['cppnConnection']={}: exports, this, typeof exports === 'undefined'? true : false);
