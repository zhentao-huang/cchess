/*
    Attach function 'callback' to a known Function object.
    After this function performed, each instance of the
    Function would have a fuction named 'callback', which
    take one argument -- action -- is name of one member 
    function of itself. The return value of 'callback' is
    a Function object which wraps the member function.
 */
exports.applyCallback = function(func)
{
    func.prototype.callback = function(action)
    {
        if (this && this[action] instanceof Function)
        {
            function cbobj(obj, action)
            {
                this.call = function()
                {
                    return obj[action].apply(obj, arguments)
                }
            }
            return new cbobj(this, action).call
        }
        else
        {
            throw new Error("No such method " + action + " for Function " + func.name)
        }
    }
}

/*
   statemachine is a prototype class do what as its name declares
   It's derived from events.EventEmitter
 */

var events = require('events')
function statemachine()
{
    // Derive from events.EventEmitter
    events.EventEmitter.call(this) 

    // Set state table
    // this.entry : the name of entry function
    // this.states : state table of transition
    this.set = function(def)
    {
        if (def)
        {
            this.entry = def.entry
            this.states = def.states

            return;
        }
        throw new Error("State Machine Definitaion Failed " + def)
    }

    this.cancelled = false;
    // Cancel a state machine, make it break out
    this.cancel = function()
    {
        this.cancelled = true
    }

    // Start state machine from specified entry
    // param entry : optional, default is 0, the entry of the state machine
    this.start = function(entry)
    {
        entry = entry ? entry : this.entry
        if (!entry)
        {
            entry = 0
        }
        this.next(entry);
        this.step.apply(this, arguments)
    }

    // Directly transfer to next state before next uv loop
    this.step = function()
    {
        if (this.cancelled) return;
        this.torun.apply(this, arguments);
    }

    // Transit to next state, that would call proc
    this.go = function()
    {
        if (this.cancelled) return;

        if (!this.states && this.host)
        {
            if (this.host.cancelled) return;

            this.host.proc.apply(this.host, arguments);
            return;
        }
                
        this.proc.apply(this, arguments);
    }

    // Transfer to next state in next uv loop
    this.proc = function()
    {
        var obj = this
        var torun = this.torun
        var args = arguments
        function processObj()
        {
            this.call = function()
            {
                if (obj.cancelled) return;
                torun.apply(obj, args);
            }
        }
        process.nextTick(new processObj().call);
    }

    // Setup and return "torun" function, which enable "go" and "step"
    this.next = function(index)
    {
        this.index = index
        // If index < 0, that means the state mahcine should return to its host or shutdown.
        if (index < 0)
        {
            if (this.host)
            {
                this.torun = this.host.result(index * -1)
            }
            else
            {
                this.torun = new Function;
            }
            return this.torun
        }
        // Get next action name from state table
        action = this.states[index][0]
        if (action instanceof String || typeof(action) == 'string')
        {
            // action is a String, maybe a statemachine instance, or a funciton
            var dotpos = action.indexOf('.');
            if (dotpos == -1)
            {

                if (this[action] instanceof statemachine)
                {
                    this[action].host = this
                    this.torun = this[action].callback('start')
                }
                else if (this[action] instanceof Function)
                {
                    this.torun = this.callback(action);
                }
            }
            else //action string contains a '.', the left part should be a statemachine and the right will be a method
            {
                objstr = action.split('.');
                if (objstr.length != 2)
                {
                    throw new Error("Can't understande action " + action);
                }
                
                obj1 = eval(objstr[0]);
                if (obj1 instanceof statemachine)
                {
                    obj1.host = this
                    this.torun = obj1.callback(objstr[1]);
                }
            }
        }
        else if (action instanceof statemachine)
        {
            action.host = this
            this.torun = action.callback('start')
        }

        return this.torun
    }

    this.result = function(option)
    {
        if (this.states == undefined && this.host)
        {
            return this.host.next(this.host.states[this.host.index][option]);
        }
        return this.next(this.states[this.index][option])
    }
    
    this.goemit = function()
    {
        var args = arguments;
        var self = this;
        process.nextTick(function()
            {
                self.emit.apply(self, args);
            });
    }

}

var util = require('util')
util.inherits(statemachine, events.EventEmitter) 

exports.initStateMachine = function(obj)
{
    statemachine.call(obj)
}

exports.applyStateMachine = function(func)
{
    util.inherits(func,statemachine)
    exports.applyCallback(func);
    return func;
}
