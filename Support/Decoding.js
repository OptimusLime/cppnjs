//This is for decoding various objects into CPPNs
var decNSS = "Decoding";
var decNS = namespace(decNSS);

decNS.CPPNTypes =
{
    Concurrent : 0,
    Fast : 1,
    OpCode : 2
}

decNS.CPPNFromJSON = function(genomeObject, type)
{
    //So the first thing we have to do is go through the JSON
    //This structure is based on the genome XML from the simulators

    //It looks a little like this after conversion to :
    //genome
    //-neurons
    //--neuron[] - each with: id, layer, bias, activation, type
    //-modules -- usually empty
    //-connections
    //--connection[] - each with: src, target, weight, innovation, A,B,C,D, learningRate
    //END



    switch(type)
    {
        case decNS.CPPNTypes.Concurrent:
            return decNS.ConcurrentCPPNFromJSON(genomeObject);
        case decNS.CPPNTypes.Fast:
        case decNS.CPPNTypes.OpCode:
            console.log("No code for these network to be decoded yet.");
            return null;
    }
};

decNS.NetworkTypeFromJSON = function(xmlString)
{
    switch(xmlString)
    {
        case "ConcurrentNetwork":
            return decNS.CPPNTypes.Concurrent;
        case "FloatFastConcurrentNetwork":
            return decNS.CPPNTypes.Fast;
        case "OpCodeNetwork":
            return decNS.CPPNTypes.OpCode;
        default:
            console.log("Don't know this network type: " + xmlString);
            return null;
    }
}


decNS.NeuronTypeFromJSON = function(xmlString)
{
    switch(xmlString)
    {
        case "in":
            return cppnsNS.NeuronType.Input;
        case "out":
            return cppnsNS.NeuronType.Output;
        case "hid":
            return cppnsNS.NeuronType.Hidden;
        case "bias":
            return cppnsNS.NeuronType.Bias;
        default:
            return cppnsNS.NeuronType.Undefined;
    }

};
decNS.ConcurrentCPPNFromJSON = function(genomeObject)
{
    var cppnNeurons = [];
    var nObj;
    var neuronTable = {};
    //first thing to do, build our neurons list, then populate with our connections
    var jsNeuronArray = genomeObject.neurons.neuron;
    for(var n=0; n < jsNeuronArray.length; n++)
    {
        nObj = jsNeuronArray[n];
        var iNid = parseInt(nObj.id, 10);
        var oActivation = ActivationFunctionFactory.GetActivationFunction(nObj.activationFunction);
        var tType = decNS.NeuronTypeFromJSON(nObj.type);
        //create our neuron from the JSON object (converting to numbers where appropriate -- parsing ints in base ten)
        var neuron = new CPPNs.Neuron(oActivation, tType, iNid);
        //boom we have a neuron, push in into our neuron list
        cppnNeurons.push(neuron);
        //we keep this in int format
        neuronTable[iNid] = neuron;

    }

    var connectionArray = genomeObject.connections.connection;
    var cObj, iSrcId, iTgtId, fWeight;
    for(var c=0; c < connectionArray.length; c++)
    {
        //grab the connection object
        cObj = connectionArray[c];
        //we don't really need to create all these temporary varialbes
        iSrcId = parseInt(cObj['src-id'],10);
        iTgtId = parseInt(cObj['tgt-id'],10);
        fWeight =  parseFloat(cObj.weight);
        //create a new connection, with the source target and weight of our JSON object
        var connection = new CPPNs.Connection(iSrcId, iTgtId ,fWeight);

        connection.SetSourceNeuron(neuronTable[iSrcId]);

        neuronTable[iTgtId].ConnectionList().push(connection);
    }

    //return our CPPN object. WAhoooooo
    return new CPPNs.CPPN(cppnNeurons);
}