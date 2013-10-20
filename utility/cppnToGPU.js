//this takes in cppn functions, and outputs a shader....
//radical!
//needs to be tested!
(function(exports, selfBrowser, isBrowser){


    var cppnToGPU = exports;


    cppnToGPU.ShaderFragments = {};


    cppnToGPU.ShaderFragments.passThroughVariables =
        [
            "uniform float texelWidth;",
            "uniform float texelHeight;"

        ].join('\n');

        //simple, doesn't do anything but pass on uv coords to the frag shaders
    cppnToGPU.ShaderFragments.passThroughVS =
    [
        cppnToGPU.ShaderFragments.passThroughVariables,
        "varying vec2 passCoord;",

        "void main()	{",
        "passCoord = uv;",
        "gl_Position = vec4( position, 1.0 );",
        "}",
        "\n"
    ].join('\n');

    cppnToGPU.ShaderFragments.passThroughVS3x3 =
        [
            cppnToGPU.ShaderFragments.passThroughVariables,
            "varying vec2 sampleCoords[9];",

            "void main()	{",

                "gl_Position = vec4( position, 1.0 );",

                "vec2 widthStep = vec2(texelWidth, 0.0);",
                "vec2 heightStep = vec2(0.0, texelHeight);",
                "vec2 widthHeightStep = vec2(texelWidth, texelHeight);",
                "vec2 widthNegativeHeightStep = vec2(texelWidth, -texelHeight);",

                "vec2 inputTextureCoordinate = uv;",

                "sampleCoords[0] = inputTextureCoordinate.xy;",
                "sampleCoords[1] = inputTextureCoordinate.xy - widthStep;",
                "sampleCoords[2] = inputTextureCoordinate.xy + widthStep;",

                "sampleCoords[3] = inputTextureCoordinate.xy - heightStep;",
                "sampleCoords[4] = inputTextureCoordinate.xy - widthHeightStep;",
                "sampleCoords[5] = inputTextureCoordinate.xy + widthNegativeHeightStep;",

                "sampleCoords[6] = inputTextureCoordinate.xy + heightStep;",
                "sampleCoords[7] = inputTextureCoordinate.xy - widthNegativeHeightStep;",
                "sampleCoords[8] = inputTextureCoordinate.xy + widthHeightStep;",

            "}",
            "\n"
        ].join('\n');


    cppnToGPU.ShaderFragments.variables =
        [
            "varying vec2 passCoord; ",
            "uniform sampler2D inputTexture; "
        ].join('\n');

    cppnToGPU.ShaderFragments.variables3x3 =
        [
            "varying vec2 sampleCoords[9];",
            "uniform sampler2D inputTexture; "
        ].join('\n');




    //this is a generic conversion from genome to shader
    //nothing pb specific here
    cppnToGPU.fullShaderFromGenome = function(cppn, specificAddFunction)
    {

//        console.log('Decoded!');
//        console.log('Start enclose :)');
        var functionObject = cppn.nrEnclose();
//        console.log('End enclose!');
        //functionobject of the form
//        {contained: contained, stringFunctions: stringFunctions, arrayIdentifier: "this.rf", nodeOrder: inOrderAct};

        var multiInput = cppn.inputNeuronCount >= 27;


        var totalNeurons = cppn.totalNeuronCount;

        var inorderString = "";

        var lastIx = functionObject.nodeOrder[totalNeurons-1];
        functionObject.nodeOrder.forEach(function(ix)
        {
           inorderString += ix +  (ix !== lastIx ? "," : "");
        });

        var defaultVariables = multiInput ? cppnToGPU.ShaderFragments.variables3x3 : cppnToGPU.ShaderFragments.variables;

        //create a float array the size of the neurons
//        var fixedArrayDec = "int order[" + totalNeurons + "](" + inorderString + ");";
        var arrayDeclaration = "float register[" + totalNeurons + "];";


        var beforeFunctionIx = "void f";
        var functionWrap = "(){";

        var postFunctionWrap = "}";

        var repString = functionObject.arrayIdentifier;
        var fns = functionObject.stringFunctions;
        var wrappedFunctions = [];
        for(var key in fns)
        {
            if(key < cppn.totalInputNeuronCount)
                continue;

            //do this as 3 separate lines
            var wrap = beforeFunctionIx + key + functionWrap;
            wrappedFunctions.push(wrap);
            var setRegister = "register[" + key + "] = ";

            var repFn =  fns[key].replace(new RegExp(repString, 'g'), "register");
            //remove all Math. references -- e.g. Math.sin == sin in gpu code
            repFn = repFn.replace(new RegExp("Math.", 'g'), "");
            //we don't want a return function, fs are void
            repFn = repFn.replace(new RegExp("return ", 'g'), "");
            //anytime you see a +-, this actually means -
            //same goes for -- this is a +
            repFn = repFn.replace(new RegExp("\\+\\-", 'g'), "-");
            repFn = repFn.replace(new RegExp("\\-\\-", 'g'), "+");

            wrappedFunctions.push(setRegister + repFn);
            wrappedFunctions.push(postFunctionWrap);
        }

        var activation = [];

        var actBefore, additionalParameters;

        if(cppn.outputNeuronCount == 1)
        {
            actBefore = "float";
            additionalParameters = "";
        }
        else
        {
//            actBefore = "float[" + ng.outputNodeCount + "]";
            actBefore = "void";
            additionalParameters = ", out float[" + cppn.outputNeuronCount + "] outputs";
        }

        actBefore += " activate(float[" +cppn.inputNeuronCount + "] fnInputs" + additionalParameters+ "){";
        activation.push(actBefore);

        var bCount = cppn.biasNeuronCount;

        for(var i=0; i < bCount; i++)
        {
            activation.push('register[' + i + '] = 1.0;');
        }
        for(var i=0; i < cppn.inputNeuronCount; i++)
        {
            activation.push('register[' + (i + bCount) + '] = fnInputs[' + i + '];');
        }

        functionObject.nodeOrder.forEach(function(ix)
        {
            if(ix >= cppn.totalInputNeuronCount)
                activation.push("f"+ix +"();");
        });

        var outputs;

        //if you're just one output, return a simple float
        //otherwise, you need to return an array
        if(cppn.outputNeuronCount == 1)
        {
            outputs = "return register[" + cppn.totalInputNeuronCount + "];";
        }
        else
        {
            var multiOut = [];

//            multiOut.push("float o[" + ng.outputNodeCount + "];");
            for(var i=0; i < cppn.outputNeuronCount; i++)
                multiOut.push("outputs[" + i + "] = register[" + (i + cppn.totalInputNeuronCount) + "];");
//            multiOut.push("return o;");

            outputs = multiOut.join('\n');
        }

        activation.push(outputs);
        activation.push("}");

        var additional = specificAddFunction(cppn);


        return {vertex: multiInput ?
            cppnToGPU.ShaderFragments.passThroughVS3x3 :
            cppnToGPU.ShaderFragments.passThroughVS,
            fragment: [defaultVariables,arrayDeclaration].concat(wrappedFunctions).concat(activation).concat(additional).join('\n')};

    };


})(typeof exports === 'undefined'? this['cppnjs']['cppnToGPU']={}: exports, this, typeof exports === 'undefined'? true : false);

