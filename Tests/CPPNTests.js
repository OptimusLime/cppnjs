var testsNSS = "Tests";
var testsNS = namespace(testsNSS);

//module("CPPN",{
//    setup : function(){
//        S.open("cppn.html")
//    }
//})

//Pass in the JSON object that was the XML document
//this should be passed in as the head object (TestDoc)
testsNS.CPPNTests = function(jsXDocument)
{
    //grab the test information
    var resultsTest = jsXDocument.results;
    var genome = jsXDocument.genome;
    var genomeType = decNS.NetworkTypeFromJSON(resultsTest.type);

    var cppn = decNS.CPPNFromJSON(genome, genomeType);

    var iInput = parseInt(resultsTest.inputs, 10);
    var iOutput = parseInt(resultsTest.outputs, 10);
    var iStepCount = parseInt(resultsTest.networkSteps, 10);
    //var iTests = parseInt(resultsTest.tests, 10);

    var aTests = resultsTest.result;
    //faInputs have the test inputs
    //faExpected have the expected CPPN results
    var faInputs = [];
    var faExpectedOutputs = [];
    var faOutputs = [];

    //for each of our tests
    for(var t = 0; t < aTests.length; t++)
    {
        var test = aTests[t];

        cppn.ClearSignals();

        //Let's push the inputs into our CPPN
        for(var i=0; i< iInput; i++)
        {
            var iX = "i" + i;
            var fX = parseFloat(test[iX]);
            faInputs.push(fX);
            console.log("In: " + iX + " - " + fX);
            cppn.SetInputSignal(i,fX);
        }

        //now run the network
        cppn.MultipleSteps(iStepCount);

        for(var o=0; o < iOutput; o++)
        {
            var iR = "r" + o;
            var fR = parseFloat(test[iR]);
            faExpectedOutputs.push(fR);
            faOutputs.push(cppn.GetOutputSignal(o));
            console.log("Expected: " + faExpectedOutputs[o] + " Actual: " + faOutputs[o]);
        }
    }
}

/*
test("Copy Test", function(){
    S("#typehere").type("javascript1mvc[left][left][left]\b", function(){
        equals(S("#seewhatyoutyped").text(), "typed javascriptmvc","typing");
    })
    S("#copy").click(function(){
        equals(S("#seewhatyoutyped").text(), "copied javascriptmvc","copy");
    })
})

test("Drag Test", function(){
    S("#drag").drag("#drop", function(){
        equals(S("#drop").text(), "Drags 1", 'drag worked correctly')
    })
})
 */