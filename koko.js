(function(){
    
    var extFWName = 'koko',         // Global framework object name
        extFWRef,                   // Global framework object reference
        emptyFunc = function(){};   // Reference to empty function for defaults usage

    var scriptQueue = [],           // Queue for all scripts waiting to be loaded
        scriptQueueIdx = 0,         // Index pointing to the next place in the script queue to place a script - used for dependency checking
        scriptLoadCount = 0;        // Integer indicating the number of scripts currently being loaded

    var eventQueue = [],            // Queue for all events waiting to be dispatched
        eventQueueIdx = 0,          // Index pointing to the next place in the event queue to place an event - used for dependency checking
        eventDispatchCount = 0,     // Integer indicating the number of events currently being dispatched
        eventListeners = [];        // Collection of event listener objects to be traveresed upon event dispatch

    // Debugging system implimentation
    // Overrides existing console.log functionality for non-firebug debuggers
    // Allows for debugging information to be turned on/off at will for development purposes
    var console = {
        debug : true,
        log : function() {
            if (this.debug === true) {
                if (typeof window.console === 'undefined') {
                    alert(arguments);
                } else {
                    window.console.log(arguments);
                }
            }
        }
    };

    // Utility function to see if the passed in object is an instance of any of the classes in the given class array
    var isInstanceOf = function(obj, classArray) {
        if (typeof obj !== 'object') { throw 'Error: Call to isInstanceOf requires object in arg[1]'; }
        if (!(classArray instanceof Array)) { throw 'Error: Call to isInstanceOf requires classArray to be of type Array'; }
        for (var i = 0, c; typeof (c = classArray[i++]) !== 'undefined';) {
            if (obj instanceof c) return true;
        }
        return false;
    };

    // Loads a given script by appending a new script element to the document head
    var loadScript = function(scriptObj) {
        var script = document.createElement('script');
        script.src = scriptObj.src;
        script.type = 'text/javascript';
        script.onload = scriptObj.onload;
        script.onreadystatuschange = function(status) {
            if (status === 'complete') { script.onload.call(this); }
        };
        console.log('Loading:', scriptObj.src);
        scriptLoadCount++;
        document.getElementsByTagName('head')[0].appendChild(script);
    };
    
    // Retrieves next script in the script queue and loads it
    var loadNextScript = function() {
        if (scriptLoadCount === 0 || scriptQueue[0].async === true) {
            scriptQueueIdx = 0;
            var nextScript = scriptQueue.shift();
            if (typeof nextScript !== 'undefined') {
                loadScript(nextScript);
            }
        } else {
            setTimeout(loadNextScript, 10);
        }
    };
    
    // Defines onload handler for a script object
    var onScriptLoad = function(scriptObj) {
        return function() {
            console.log('Loaded:', scriptObj.src);
            if (scriptObj.isCallbackInt === false) {
                scriptLoadCount--;
                if (scriptObj.async === false) { setTimeout(loadNextScript, 10); }
                if (typeof scriptObj.callback === 'function') { scriptObj.callback.call(scriptObj.context, arguments); }
            }
        };
    };
    
    // Creates an internal callback for scripts that require one
    var createIntCallback = function(scriptObj) {
        var intCallback;
        while(typeof extFWRef[intCallback = 'callback' + Math.floor(Math.random(Date.now())*101)] !== 'undefined'){}
        extFWRef[intCallback] = function() {
            console.log('Internal Callback:', intCallback);
            scriptLoadCount--;
            if (scriptObj.async === false) { setTimeout(loadNextScript, 10); }
            if (typeof scriptObj.callback === 'function') { scriptObj.callback.apply(scriptObj.context, arguments); }
            delete extFWRef[intCallback];
        };
        return intCallback;
    };
    
    // Internal implimentation of the loadScript function
    // Used as a wrapper for setTimeout calls
    var _loadScript = function(scriptObj) {
        return function() {
            loadScript(scriptObj);
        };
    };

    // Loads an external script or array of scripts (local or remote) and performs a callback if supplied
    // Callback can be defined as explicitly onload, or as an internal callback to be fired by a webservice after script load
    // Synchronous scripts are queued to be processed later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately and monitors the queue for new scripts
    var loadScripts = function(scriptURLs, async, callback, context, isCallbackInt) {
        
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to queueScripts requires scriptURLs to queue'; }
        if (typeof scriptURLs === 'string') { scriptURLs = (scriptURLs.replace(' ', '')).split(','); }
        if (typeof async === 'undefined') { async = false; }
        if (typeof context === 'undefined') { context = this; }
        if (typeof isCallbackInt !== 'boolean') { isCallbackInt = false; }

        for (var scriptURL; typeof (scriptURL = scriptURLs.shift()) !== 'undefined';) {
            var scriptObj = {'src':scriptURL,'async':async};
            if (scriptURLs.length === 0 || isCallbackInt === true) {
                scriptObj.callback = callback;
                scriptObj.context = context;
            }
            
            scriptObj.isCallbackInt = isCallbackInt;
            if (isCallbackInt === true) { scriptObj.src += extFWName + '.' + createIntCallback(scriptObj); }
            
            scriptObj.onload = onScriptLoad(scriptObj);

            if (async === false) {
                scriptQueue.splice(scriptQueueIdx++, 0, scriptObj);
                if (scriptQueue.length === 1) { setTimeout(loadNextScript, 10); }
            } else {
                setTimeout(_loadScript(scriptObj), 10);
            }
        }

    };
    
    // Loads external script (local or remote) synchronously
    // Callback is automatically executed on script load completion
    var require = function(scriptURLs, callback, context, isCallbackInt) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to require requires URL to load'; }
        if (typeof context === 'undefined') { context = this; }
        if (typeof isCallbackInt === 'undefined') { isCallbackInt = false; }
        loadScripts(scriptURLs, false, callback, context, isCallbackInt);
    };
    
    // Loads external JSON-encoded data (local or remote) that has been wrapped by a callback
    // Callback is automatically executed on script load completion
    var loadJSONP = function(scriptURLs, callback, context, async) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to loadJSONP requires URL to load'; }
        if (typeof async === 'undefined') { async = true; }
        if (typeof context === 'undefined') { context = this; }
        loadScripts(scriptURLs, async, callback, context, true);
    };

    // Dispatches an event
    // Events are dispatched only if the name meets the format criteria: Class:Name:Method
    var dispatchEvent = function(eventObj) {
        var eventNameParts, eventFunc;
        if ((eventNameParts = eventObj.eventName.split(':')).length < 3) { throw 'Error: Event names must be of the format Class:Name:Method'; }
        var eventDestType = eventNameParts[0],  // destination type/class
            eventDestName = eventNameParts[1],  // event destination name
            eventDestFunc = eventNameParts[2];  // event destination function
        console.log('dispatching', eventObj.eventName);
        for (var i = 0, listener; typeof (listener = eventListeners[i++]) !== 'undefined';) {
            if (isInstanceOf(listener, eventObj.dispatchDeny) === false && (listener.type === eventDestType) && (listener.name === eventDestName) && typeof (eventFunc = listener[eventDestFunc]) !== 'undefined') {
                eventDispatchCount++;
                eventFunc.call(listener, eventObj.eventData, eventObj.callback, eventObj.context);
                eventDispatchCount--;
            }
        }
        if (eventObj.async === false) { setTimeout(dispatchNextEvent, 10); }
    };

    // Waits for all scripts to be loaded and then executes a callback
    // Used for event dispatch purposes, as no event can be dispatched until scripts are loaded
    var waitForScripts = function(callback) {
        if (scriptQueue.length === 0 && scriptLoadCount === 0) {
            setTimeout(callback, 10);
        } else {
            setTimeout(function(){ waitForScripts(callback); }, 10);
        }
    };

    // Retrieves next event from the event queue and dispatches it
    var dispatchNextEvent = function() {
        eventQueueIdx = 0;
        var nextEvent = eventQueue.shift();
        if (typeof nextEvent !== 'undefined') {
            setTimeout(_dispatchEvent(nextEvent), 10);
        }
    };

    // Internal implimentation of dispatchEvent
    // Used as a wrapper for setTimout calls
    var _dispatchEvent = function(eventObj) {
        return function() {
            waitForScripts(function() {
                dispatchEvent(eventObj);
            });
        };
    };

    // Dispatches an event or array of events and performs a callback if supplied
    // Events are defaulted to be asynchronous, though this can be overridden by parameter
    // Synchronous events are queued to be processed later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately and monitors the queue for new events
    var dispatchEvents = function(eventNames, eventData, callback, context, async, dispatchDeny) {
        if (typeof eventNames === 'undefined') { throw 'Error: Call to queueEvents requires eventName'; }
        if (typeof eventNames === 'string') { eventNames = (eventNames.replace(' ', '')).split(','); }
        if (typeof context === 'undefined') { context = this; }
        if (typeof async === 'undefined') { async = true; }

        for (var eventName; typeof (eventName = eventNames.shift()) !== 'undefined';) {
            var eventObj = {'eventName':eventName,'eventData':eventData,'dispatchDeny':dispatchDeny,'async':async};
            if (eventNames.length === 0) {
                eventObj.callback = callback;
                eventObj.context = context;
            }

            if (async === false) {
                eventQueue.splice(eventQueueIdx++, 0, eventObj);
                if (eventQueue.length === 1) { setTimeout(dispatchNextEvent, 10); }
            } else {
                setTimeout(_dispatchEvent(eventObj), 10);
            }

        }
    };

    // Mixin that extends event management capability to all MVA classes
    var EventManager = function(dispatchDeny) {
        
        // Allows each MVA object to dispatch MVA events
        this.dispatchEvent = function(eventName, eventData, callback, context, async) {
            dispatchEvents(eventName, eventData, callback, context, async, dispatchDeny);
        };
        
        // Registers this MVA object as an event listener so it is able to accept incoming events
        eventListeners.push(this);
        
    };

    // Mixin that defines standard attributes of all MVA classes
    // Event management capability is appended by cloning the EventManager mixin function as opposed to class inheritance
    var MVAClass = function(classType, className, classDef, dispatchDeny) {
        if (typeof classType !== 'undefined') { this.type = classType; } else { throw 'Error: Class type required to create a new class.'; }
        if (typeof className !== 'undefined') { this.name = className; } else { throw 'Error: Class name required to create a new class.'; }
        if (typeof classDef !== 'undefined') { classDef.call(this); }
        EventManager.call(this, dispatchDeny || []);
    };
    
    // Available MVA classes that can be instantiated as objects for event-driven communication
    // These classes are created by appending functionality through cloning the MVAClass mixin function as opposed to class inheritance
    var View = function(className, classDef) { MVAClass.call(this, 'View', className, classDef, [Model]); };
    var Model = function(className, classDef) { MVAClass.call(this, 'Model', className, classDef, [View]); };
    var Adapter = function(className, classDef){ MVAClass.call(this, 'Adapter', className, classDef); };

    // Defines the external framework object methods
    return (extFWRef = this[extFWName] = {
        'defineView': function(className, classDef) { return new View(className, classDef); },
        'defineModel': function(className, classDef) { return new Model(className, classDef); },
        'defineAdapter': function(className, classDef) { return new Adapter(className, classDef); },
        'loadScript': loadScripts,
        'require': require,
        'loadJSONP': loadJSONP
    });

})();

koko.require('http://getfirebug.com/firebug-lite.js');