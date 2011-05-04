(function(){

    var extFWName = 'koko',         // Global framework object name
        extFWRef,                   // Global framework object reference
        emptyFunc = function(){};

    var scriptQueue = [],           // Queue for all scripts waiting to be loaded
        scriptQueueIdx = 0,         // Index pointing to the next place in the script queue to place a script - used for dependency checking
        scriptLoadCount = 0;        // Integer indicating the number of scripts currently being loaded

    var eventQueue = [],            // Queue for all events waiting to be dispatched
        eventQueueIdx = 0,          // Index pointing to the next place in the event queue to place an event - used for dependency checking
        eventDispatchCount = 0,     // Integer indicating the number of events currently being dispatched
        eventListeners = [];        // Collection of event listener objects to be traveresed upon event dispatch

    // Debugging system implimentation
    // Overrides existing console.log functionality for non-firebug debuggers
    // Allows for debugging information to be toggled on/off at will for development purposes
    var console = { debug : false, queue : [], loading : false,
        log : function() {            
            if (this.debug === true) {
                this.queue.push(arguments);
                if (!this.loading) {
                    if (typeof window.console === 'undefined') {
                        this.loading = true;
                        koko.require('http://getfirebug.com/firebug-lite.js', function() { this.loading = false; });
                    }
                    else { while (this.queue.length > 0) { window.console.log(this.queue.shift()); } }
                }
            }
        }
    };

    // Utility function to see if the passed in object is an instance of any of the classes in the given class array
    var _isInstanceOf = function(obj, classArray) {
        
        if (typeof obj !== 'object') { throw 'Error: Call to isInstanceOf requires object in arg[1]'; }
        if (!(classArray instanceof Array)) { throw 'Error: Call to isInstanceOf requires classArray to be of type Array'; }
        
        for (var i = 0, c; typeof (c = classArray[i++]) !== 'undefined';) {
            if (obj instanceof c) return true;
        }
        
        return false;
    };
    
    // Utility function giving objects augment ability
    var _augment = function(augObj) {
        var obj = {}, prop;
        for (prop in this) {
            obj[prop] = this[prop];
        }
        for (prop in augObj) {
            obj[prop] = augObj[prop];
        }
        return obj;
    };

    // Loads a given script by appending a new script element to the document head
    var _loadScript = function(scriptObj) {
        
        var script = scriptObj.script = document.createElement('script');
        script.src = scriptObj.src;
        script.type = 'text/javascript';
        script.onload = _onScriptLoad(scriptObj);
        
        script.onreadystatuschange = function(status) { 
            if (status === 'complete') { 
                script.onload.call(this); 
            }
        };
        
        script.onerror = scriptObj.onerror || script.onload;
        scriptLoadCount++;
        document.getElementsByTagName('head')[0].appendChild(script);
        
    };

    // Defines onload handler for a script object
    var _onScriptLoad = function(scriptObj) {
        
        return function() {
            
            document.getElementsByTagName('head')[0].removeChild(scriptObj.script);
            
            if (scriptObj.callbackInt === false) {
                
                scriptLoadCount--;
                
                if (scriptObj.async === false) { setTimeout(_loadNextScript, 10); }
                
                if (typeof scriptObj.callback === 'function') { 
                    scriptObj.callback.call(scriptObj.context, arguments); 
                }
                
            }
            
        };
        
    };

    // Retrieves next script in the script queue and loads it
    var _loadNextScript = function() {
        
        if (scriptQueue.length) {
            
            if (scriptLoadCount === 0 || scriptQueue[0].async === true) {     
                scriptQueueIdx = 0;
                _loadScript(scriptQueue.shift());
            }
            else { setTimeout(_loadNextScript, 10); }
            
        }
        
    };
    
    // Creates an internal callback for scripts that require one
    var _createIntCallback = function(scriptObj) {
        
        var intCallback;
        
        while(typeof extFWRef[intCallback = 'callback' + Math.floor(Math.random(Date.now())*101)] !== 'undefined'){}
        
        extFWRef[intCallback] = function() {
            
            scriptLoadCount--;
            
            if (scriptObj.async === false) { setTimeout(_loadNextScript, 10); }
            
            if (typeof scriptObj.callback === 'function') {
                
                try { 
                    scriptObj.callback.apply(scriptObj.context, arguments); 
                }
                catch (e) {
                    if (typeof scriptObj.onerror === 'function') {
                        scriptObj.onerror.call(scriptObj.context, e);
                    }
                }
                
            }
            
            delete extFWRef[intCallback];
            
        };
        
        return intCallback;
        
    };
    
    // Wrapped reference to the loadScript function
    // Used as a wrapper for setTimeout calls
    var _loadScriptWrapper = function(scriptObj) { return function() { _loadScript(scriptObj); }; };

    // Loads an external script or array of scripts (local or remote), then performs a callback if supplied
    // Callback can be defined as onload (default), or as an internal callback to be fired by a webservice after script load (isCallbackInt param)
    // Scripts are defaulted to be asynchronous, though this can be changed by parameter
    // Synchronous scripts are queued to be processed later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately after queing synchronous scripts
    var loadScript = function(scriptURLs, options, async, callbackInt) {

        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to queueScripts requires scriptURLs to queue'; }
        if (typeof scriptURLs === 'string') { scriptURLs = (scriptURLs.replace(' ', '')).split(','); }
        if (typeof options === 'undefined') { options = {}; }
        if (typeof async !== 'boolean') { async = true; }
        if (typeof callbackInt !== 'boolean') { callbackInt = false; }
        
        var context = (typeof options.context === 'undefined') ? this : options.context;
        options.augment = _augment;

        for (var scriptURL; typeof (scriptURL = scriptURLs.shift()) !== 'undefined';) {
            
            var scriptObj = {'src':scriptURL,'options':options,'async':async,'callbackInt':callbackInt,'onerror':options.onerror};
            
            if (scriptURLs.length === 0) {
                scriptObj.callback = options.callback;
                scriptObj.context = context;
            }
            
            if (callbackInt === true) { scriptObj.src += extFWName + '.' + _createIntCallback(scriptObj); }

            if (async === false) {
                scriptQueue.splice(scriptQueueIdx++, 0, scriptObj);
                if (scriptQueue.length === 1) { setTimeout(_loadNextScript, 10); }
            } 
            else { setTimeout(_loadScriptWrapper(scriptObj), 10); }
            
        }

    };
    
    // Loads external script (local or remote) synchronously
    // Callback is automatically executed on script load completion
    var require = function(scriptURLs, options) {
        
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to require requires URL to load'; }
        if (typeof options === 'undefined') { options = {}; }
        
        loadScript(scriptURLs, options, true, options.callbackInt);
        
    };
    
    // Loads external JSON-encoded data (local or remote) that has been wrapped by a callback
    // Callback is automatically executed on script load completion
    var loadJSONP = function(scriptURLs, options) {
        
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to loadJSONP requires URL to load'; }
        if (typeof options === 'undefined') { options = {}; }
        
        loadScript(scriptURLs, options, options.async, true);
        
    };

    // Dispatches an event
    // Events are dispatched only if the name meets the format criteria: Class:Name:Method
    var _dispatchEvent = function(eventObj) {
        
        var eventNameParts, eventFunc;
        
        if ((eventNameParts = eventObj.eventName.split(':')).length < 3) { throw 'Error: Event names must be of the format Class:Name:Method'; }
        
        var eventDestType = eventNameParts[0],              // destination type/class
            eventDestName = eventNameParts[1],              // event destination name
            eventDestFunc = eventNameParts[2].split('.');   // event destination function - includes base function and optional subroutine

        for (var i = 0, listener; typeof (listener = eventListeners[i++]) !== 'undefined';) {
            
            if (_isInstanceOf(listener, eventObj.dispatchDeny) === false && (listener.type === eventDestType) && (listener.name === eventDestName)) {
                
                if (typeof (eventFunc = listener[eventDestFunc[0]]) === 'function') {
                    
                    if (typeof eventDestFunc[1] === 'function') { eventFunc = eventFunc[eventDestFunc[1]]; }
                    
                    eventDispatchCount++;
                    
                    try {
                        eventFunc.call(listener, eventObj.options);
                    }
                    catch (e) {
                        if (typeof eventObj.onerror === 'function') {eventObj.onerror.call(eventObj.context, e); }
                        else { console.log(e); }
                    }
                    
                    eventDispatchCount--;
                    
                }
                
            }
            
        }
        
        if (eventObj.async === false) { setTimeout(dispatchNextEvent, 10); }
        
    };

    // Waits for all scripts to be loaded and then executes a callback
    // Used for event dispatch purposes, as no event can be dispatched until scripts are loaded
    var waitForScripts = function(callback) {
        
        if (scriptQueue.length === 0 && scriptLoadCount === 0) { setTimeout(callback, 10); }
        else { setTimeout(function(){ waitForScripts(callback); }, 10); }

    };

    // Retrieves next event from the event queue and dispatches it
    var dispatchNextEvent = function() {
        
        eventQueueIdx = 0;
        var nextEvent = eventQueue.shift();
        
        if (typeof nextEvent !== 'undefined') { setTimeout(_dispatchEventWrapper(nextEvent), 10); }
        
    };

    // Wrapped reference to dispatchEvent
    // Used as a wrapper for setTimout calls
    var _dispatchEventWrapper = function(eventObj) {
        return function() { waitForScripts(function() { _dispatchEvent(eventObj); }); };
    };

    // Dispatches an event or array of events and performs a callback if supplied
    // Events are defaulted to be asynchronous, though this can be overridden by parameter
    // Synchronous events are queued to be processed later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately after queing synchronous events
    var dispatchEvent = function(eventNames, options, dispatchDeny) {
        
        if (typeof eventNames === 'undefined') { throw 'Error: Call to queueEvents requires eventName'; }
        if (typeof eventNames === 'string') { eventNames = (eventNames.replace(' ', '')).split(','); }
        if (typeof options === 'undefined') { options = {}; }
        
        options.augment = _augment;
        
        var async = (typeof options.async !== 'boolean') ? true : options.async;
        var callback = (typeof options.callback !== 'function') ? emptyFunc : options.callback;
        var context = (typeof options.context === 'undefined') ? this : options.context;

        for (var eventName; typeof (eventName = eventNames.shift()) !== 'undefined';) {
            
            var eventObj = {'eventName':eventName,'options':options,'async':async,'dispatchDeny':dispatchDeny,'onerror':options.onerror};
            
            if (eventNames.length === 0) {
                eventObj.callback = callback;
                eventObj.context = context;
            }

            if (async === false) {
                eventQueue.splice(eventQueueIdx++, 0, eventObj);
                if (eventQueue.length === 1) { setTimeout(dispatchNextEvent, 10); }
            }
            else { setTimeout(_dispatchEventWrapper(eventObj), 10); }
            
        }

    };
    
    // Allows for otherwise static variables to become dynamic setters/getters
    // Includes methods for notifying observers of changes
    var observable = function(initValue) {
        
        var _value = initValue;
        var _observers = [];

        var onchange = function() {
            for (var i = 0, observer; typeof (observer = _observers[i++]) !== 'undefined';) {
                observer.call(this, _value);
            }
        };
        
        var newFunc = function(value, callback, context) {
            if (typeof value !== 'undefined') { onchange(_value = value); }
            if (typeof callback === 'function') { callback.call(context || this, _value); }
            return _value;
        };
        
        newFunc.bind = function(observer) { _observers.push(observer); };
        
        return newFunc;
        
    };

    // Mixin that extends event management capability to all MVA classes
    var EventManager = function(dispatchDeny) {
        
        // Allows each MVA object to dispatch MVA events
        this.dispatchEvent = function(eventName, options) {
            dispatchEvent(eventName, options, dispatchDeny);
        };
        
        // Registers this MVA object as an event listener so it is able to accept incoming events
        eventListeners.push(this);
        
    };

    // Mixin that defines standard attributes of all MVA classes
    // Event management capability is appended by cloning the EventManager mixin function as opposed to class inheritance
    var MVAClass = function(classType, className, classDef, dispatchDeny) {
        if (typeof classType !== 'undefined') { this.type = classType; } else { throw 'Error: Class type required to create a new class.'; }
        if (typeof className === 'string') { this.name = className; } else { throw 'Error: Class name required to create a new class.'; }
        EventManager.call(this, dispatchDeny || []);
        if (typeof classDef === 'function') { classDef.call(this); }
    };
    
    // Available MVA classes that can be instantiated as objects for event-driven communication
    // These classes are created by appending functionality through cloning the MVAClass mixin function as opposed to class inheritance
    var View = function(className, classDef) { MVAClass.call(this, 'View', className, classDef, [Model]); };
    var Model = function(className, classDef) { MVAClass.call(this, 'Model', className, classDef, [View]); };
    var Adapter = function(className, classDef){ MVAClass.call(this, 'Adapter', className, classDef); };

    // Defines the external framework object methods
    return (extFWRef = this[extFWName] = {
        'View': function(className, classDef) { return new View(className, classDef); },
        'Model': function(className, classDef) { return new Model(className, classDef); },
        'Adapter': function(className, classDef) { return new Adapter(className, classDef); },
        'loadScript': loadScript,
        'require': require,
        'loadJSONP': loadJSONP,
        'console': console,
        'observable': observable
    });

})();