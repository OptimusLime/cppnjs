function namespace(namespaceString) {
    var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '';

    for(var i = 0, length = parts.length; i < length; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }

    return parent;
};


var stringToFunction = function(str) {
    var arr = str.split(".");

    var fn = (window || this);
    for (var i = 0, len = arr.length; i < len; i++) {
        fn = fn[arr[i]];
    }

    if (typeof fn !== "function") {
        throw new Error("function not found");
    }

    return  fn;
};

Math.sign = function(input)
{
    if (input < 0) {return -1};
    if (input > 0) {return 1};
    return 0;
};

//a different type of inheritance -- might be easier to read and convert C# code using this model
Function.prototype.inheritsFrom = function( parentClassOrObject ){
    if ( parentClassOrObject.constructor == Function )
    {
        //Normal Inheritance
        this.prototype = new parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject.prototype;
    }
    else
    {
        //Pure Virtual Inheritance
        this.prototype = parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject;
    }
    return this;
};


    /* Example usage of functional inheritance
    * LivingThing = {
     beBorn : function(){
     this.alive = true;
     }
     }
     //
     //
     function Mammal(name){
     this.name=name;
     this.offspring=[];
     }
     Mammal.inheritsFrom( LivingThing );
     Mammal.prototype.haveABaby=function(){
     this.parent.beBorn.call(this);
     var newBaby = new this.constructor( "Baby " + this.name );
     this.offspring.push(newBaby);
     return newBaby;
     }
     //
     //
     function Cat( name ){
     this.name=name;
     }
     Cat.inheritsFrom( Mammal );
     Cat.prototype.haveABaby=function(){
     var theKitten = this.parent.haveABaby.call(this);
     alert("mew!");
     return theKitten;
     }
     Cat.prototype.toString=function(){
     return '[Cat "'+this.name+'"]';
     }
    *
    * */

    /* Simple JavaScript Inheritance
    * By John Resig http://ejohn.org/
    * MIT Licensed.
    */
// Inspired by base2 and Prototype
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

/*
* Example usage
* var Person = Class.extend({
 init: function(isDancing){
 this.dancing = isDancing;
 },
 dance: function(){
 return this.dancing;
 }
 });
 var Ninja = Person.extend({
 init: function(){
 this._super( false );
 },
 dance: function(){
 // Call the inherited version of dance()
 return this._super();
 },
 swingSword: function(){
 return true;
 }
 });
*
* */