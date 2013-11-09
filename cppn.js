var cppnjs = {};

//export the cppn library
module.exports = cppnjs;

//CPPNs
cppnjs.cppn = require('./networks/cppn.js');

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


