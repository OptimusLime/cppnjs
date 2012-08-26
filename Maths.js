
var nss = "Maths";
Maths = {};
var ns = namespace(nss);

//class FastRandom


//class Math Exceptions

//Class RandLib

//Class Roulette Wheel

ns.RouletteWheel = {};

/// <summary>
/// A simple single throw routine.
/// </summary>
/// <param name="probability">A probability between 0..1 that the throw will result in a true result.</param>
/// <returns></returns>
ns.RouletteWheel.SingleThrow = function(probability)
{
    return (Math.random() <= probability ? true : false)
};
/// <summary>
/// Performs a single throw for a given number of outcomes with equal probabilities.
/// </summary>
/// <param name="numberOfOutcomes"></param>
/// <returns>An integer between 0..numberOfOutcomes-1. In effect this routine selects one of the possible outcomes.</returns>
ns.RouletteWheel.SingleThrowEven = function(numberOfOutcomes)
{
    var probability= 1.0 / numberOfOutcomes;
    var accumulator=0;
    var throwValue = Math.random();

    for(var i=0; i<numberOfOutcomes; i++)
    {
        accumulator+=probability;
        if (throwValue <= accumulator) {
            return i;
        }
    }

    throw new Error("Lib.Maths.SingleThrowEven() - invalid outcome.");
};

    /// <summary>
    /// Performs a single thrown onto a roulette wheel where the wheel's space is unevenly divided.
    /// The probabilty that a segment will be selected is given by that segment's value in the 'probabilities'
    /// array. The probabilities are normalised before tossing the ball so that their total is always equal to 1.0.
    /// </summary>
    /// <param name="probabilities"></param>
    /// <returns></returns>
ns.RouletteWheel.SingleThrow = function(probabilities)
{
    var pTotal=0;	// Total probability

    //-----
    for(var i=0; i<probabilities.length; i++)
        pTotal+=probabilities[i];

    //----- Now throw the ball and return an integer indicating the outcome.
    var throwValue = random.NextDouble() * pTotal;
    var accumulator=0;

    for(var j=0; j<probabilities.Length; j++)
    {
        accumulator+=probabilities[j];

        if(throwValue<=accumulator)
            return j;
    }
    throw new Error("PeannutLib.Maths.SingleThrow() - invalid outcome.");

};


    /// <summary>
    /// Similar in functionality to SingleThrow(double[] probabilities). However the 'probabilities' array is
    /// not normalised. Therefore if the total goes beyond 1 then we allow extra throws, thus if the total is 10
    /// then we perform 10 throws.
    /// </summary>
    /// <param name="probabilities"></param>
    /// <returns></returns>
ns.RouletteWheel.MultipleThrows = function(probabilities)
    {
        var pTotal=0;	// Total probability
        var numberOfThrows;

        //----- Determine how many throws of the ball onto the wheel.
        for(var i=0; i<probabilities.length; i++)
            pTotal+=probabilities[i];

        // If total probabilty is > 1 then we take this as meaning more than one throw of the ball.
        var pTotalInteger = Math.floor(pTotal);
        var pTotalRemainder = pTotal - pTotalInteger;
        numberOfThrows = pTotalInteger;

        if(Math.random() <= pTotalRemainder)
            numberOfThrows++;

        //----- Now throw the ball the determined number of times. For each throw store an integer indicating the outcome.
        var outcomes = [];// new int[numberOfThrows];

        for(var j=0; j<numberOfThrows; j++)
        {
            //need to make sure we have objects in our outcomes
            outcomes.push(0);
            var throwValue = Math.random() * pTotal;
            var accumulator=0;

            for(var k=0; k<probabilities.length; k++)
            {
                accumulator+=probabilities[k];

                if(throwValue<=accumulator)
                {
                    outcomes[j] = k;
                    break;
                }
            }
        }

        return outcomes;
    };


//Class Value Mutation
