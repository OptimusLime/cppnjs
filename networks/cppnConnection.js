/**
 * Module dependencies.
 */
//none

/**
 * Expose `cppnConnection`.
 */

module.exports = cppnConnection;

/**
 * Initialize a new cppnConnection.
 *
 * @param {Number} sourceIdx
 * @param {Number} targetIdx
 * @param {Number} cWeight
 * @api public
 */
//simple connection type -- from FloatFastConnection.cs
function cppnConnection(
    sourceIdx,
    targetIdx,
    cWeight
    ){

    var self = this;
    self.sourceIdx =    sourceIdx;
    self.targetIdx =    targetIdx;
    self.weight = cWeight;
    self.signal =0;

}