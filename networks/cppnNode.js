/**
 * Module dependencies.
 */
var NodeType = require("../types/nodeType");

/**
 * Expose `cppnNode`.
 */

module.exports = cppnNode;

/**
 * Initialize a new cppnNode.
 *
 * @param {String} actFn
 * @param {String} neurType
 * @param {String} nid
 * @api public
 */

function cppnNode(actFn, neurType, nid){

    var self = this;

    self.neuronType = neurType;
    self.id = nid;
    self.outputValue = (self.neuronType == NodeType.bias ? 1.0 : 0.0);
    self.activationFunction = actFn;

}