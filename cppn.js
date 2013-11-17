var cppnjs = {};

//export the cppn library
module.exports = cppnjs;

//CPPNs
cppnjs.cppn = require('./networks/cppn.js');

cppnjs.addGPUExtras = function()
{
    //requires pureCPPN activations
    cppnjs.addPureCPPN();
    require('./extras/gpuAdditions.js');
};

//add GPU extras by default
cppnjs.addGPUExtras();

cppnjs.addAdaptable = function()
{
    require('./extras/adaptableAdditions.js');
};

cppnjs.addPureCPPN = function()
{
  require('./extras/pureCPPNAdditions.js');
};


//nodes and connections!
cppnjs.cppnNode = require('./networks/cppnNode.js');
cppnjs.cppnConnection = require('./networks/cppnConnection.js');

//all the activations your heart could ever hope for
cppnjs.cppnActivationFunctions = require('./activationFunctions/cppnActivationFunctions.js');
cppnjs.cppnActivationFactory = require('./activationFunctions/cppnActivationFactory.js');

//and the utilities to round it out!
cppnjs.utilities = require('./utility/utilities.js');

//exporting the node type
cppnjs.NodeType = require('./types/nodeType.js');


