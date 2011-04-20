(function(){
    
    var extFWName = 'koko',         // Global framework object name
        extFWRef,                   // Global framework object reference
        emptyFunc = function(){};   // Reference to empty function for defaults usage

    var scriptQueue = [],       // Array of queued scripts waiting to be processed
        scriptQueueIdx = 0,     // Index into script queue to keep dependencies in order
        scriptLoading = 0,      // Integer indicating if a script is currently being loaded
        scriptProcTimer;        // Timer handle for script queue processing

    var eventQueue = [],        // Queue for all events waiting to be dispatched
        eventQueueIdx = 0,      // Index pointing to the next place in the event queue to place an event - used for dependency checking
        eventLoadCount = 0,     // Integer indicating the number of events currently being dispatched
        eventProcTimer,         // Event queue processing timer
        eventListeners = [];    // Collection of event listener objects to be traveresed upon event dispatch

    // Utility function to see if the passed in object is an instance of any of the classes in the class array
    var isInstanceOf = function(obj, classArray) {
        if (typeof obj !== 'object') { throw 'Error: Call to isInstanceOf requires object in arg[1]'; }
        if (!(classArray instanceof Array)) { throw 'Error: Call to isInstanceOf requires classArray to be of type Array'; }
        for (var i = 0, c; typeof (c = classArray[i++]) !== 'undefined';) {
            if (obj instanceof c) return true;
        }
        return false;
    };

    // Queues scripts to be processed later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately and monitors the queue for new scripts
    var queueScripts = function(scriptURLs, async, callback, context, isCallbackInt) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to queueScripts requires scriptURLs to queue'; }
        if (typeof scriptURLs === 'string') { scriptURLs = (scriptURLs.replace(' ', '')).split(','); }
        if (typeof async === 'undefined') { async = true; }
        if (typeof context === 'undefined') { context = this; }
        if (typeof isCallbackInt === 'undefined') { isCallbackInt = false; }

        // Add externally-accessible internal callback function to given scripts (for instances of JSONP requests, if needed)
        var intCallback;
        if (isCallbackInt === true) {
            while(typeof extFWRef[intCallback = 'callback' + Math.floor(Math.random(Date.now())*101)] !== 'undefined'){}
            extFWRef[intCallback] = function() {
                if (typeof callback !== 'undefined') { callback.apply(context, arguments); }
                scriptLoading--;
                delete extFWRef[intCallback];
            };
        }

        for (var scriptURL; typeof (scriptURL = scriptURLs.shift()) !== 'undefined';) {
            var scriptObj = {'src':scriptURL, 'async':async, 'isCallbackInt':isCallbackInt};
            if (scriptURLs.length === 0) {
                if (typeof intCallback !== 'undefined') {
                    scriptObj.src += extFWName + '.' + intCallback;
                } else {
                    scriptObj.callback = callback;
                    scriptObj.context = context;
                }
            }
            scriptQueue.splice(scriptQueueIdx++, 0, scriptObj);
        }
        
        scriptProcTimer = setTimeout(procScriptQueue, 11);
        
    };

    // Processes queued scripts in the order they were queued
    // Scripts are processed only if no other script is currently being loaded
    // Uses reference to a single event timer to ensure there is no overlap in queue processing
    var procScriptQueue = function() {
        var nextScript;
        if (scriptQueue.length > 0) {
            if (scriptLoading === 0 || scriptQueue[0].async === true) {
                scriptQueueIdx = 0;
                nextScript = scriptQueue.shift();
                if (nextScript.async === true) { setTimeout(function(){ loadScript(nextScript); }, 11); }
                else loadScript(nextScript);
            }
            scriptProcTimer = setTimeout(procScriptQueue, 11);
        }
    };

    // Loads an external script (local or remote) by appending a script tag to the document head node
    // Executes a callback on script load completion
    // Ensures that scripts with internal callback functions are handled appropriately
    var loadScript = function(scriptObj) {
        var docHead = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = scriptObj.src;
        script.type = 'text/javascript';
        script.onload = function() {
            if (typeof scriptObj.callback !== 'undefined') {
                scriptObj.callback.call(scriptObj.context);
            }
            if (scriptObj.isCallbackInt === false) { scriptLoading--; }
        };
        scriptLoading++;
        docHead.appendChild(script);
    };
    
    // Loads external script (local or remote) synchronously
    // Callback is automatically executed on script load completion
    var require = function(scriptURLs, callback, context) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to require requires URL to load'; }
        if (typeof context === 'undefined') { context = this; }
        queueScripts(scriptURLs, false, callback, context, false);
    };
    
    // Loads external JSON-encoded data (local or remote) that has been wrapped by a callback
    // Callback is automatically executed on script load completion
    var loadJSONP = function(scriptURLs, callback, context, async) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to loadJSONP requires URL to load'; }
        if (typeof async === 'undefined') { async = false; }
        if (typeof context === 'undefined') { context = this; }
        queueScripts(scriptURLs, async, callback, context, true);
    };

    // Queues events to be dispatched later, ensuring that dependencies are handled appropriately
    // Queue processing method is called immediately and monitors the queue for new events
    var queueEvents = function(eventNames, eventData, callback, context, dispatchDeny, async) {
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
            eventQueue.splice(eventQueueIdx++, 0, eventObj);
        }
        eventProcTimer = setTimeout(procEventQueue, 13);
    };

    // Dispatches queued events in the order they were queued
    // Events are dispatched only if no scripts remain to be processed
    // Uses reference to a single event timer to ensure there is no overlap in queue processing
    var procEventQueue = function() {
        var nextEvent;
        if (eventQueue.length > 0) {
            if (scriptQueue.length === 0 && scriptLoading === 0 && (eventQueue[0].async === true || eventLoadCount === 0)) {
                eventQueueIdx = 0;
                nextEvent = eventQueue.shift();
                if (nextEvent.async === true) { setTimeout(function(){ dispatchEvent(nextEvent); }, 13); }
                else dispatchEvent(nextEvent);
            }
            eventProcTimer = setTimeout(procEventQueue, 13);
        }
    };

    // Dispatches an event
    // Events are dispatched only if the name meets the format criteria: Class:Name:Method
    // If the event contains a callback, it is handled appropriately
    var dispatchEvent = function(eventObj) {
        var eventNameParts, eventFunc;
        if ((eventNameParts = eventObj.eventName.split(':')).length < 3) { throw 'Error: Event names must be of the format Class:Name:Method'; }
        var eventDestType = eventNameParts[0],  // destination type/class
            eventDestName = eventNameParts[1],  // event destination name
            eventDestFunc = eventNameParts[2];  // event destination function
        for (var i = 0, listener; typeof (listener = eventListeners[i++]) !== 'undefined';) {
            if (isInstanceOf(listener, eventObj.dispatchDeny) === false && (listener.type === eventDestType) && (listener.name === eventDestName) && typeof (eventFunc = listener[eventDestFunc]) !== 'undefined') {
                eventLoadCount++;
                eventFunc.call(listener, eventObj.eventData, eventObj.callback, eventObj.context);
                eventLoadCount--;
            }
        }
    };

    // Mixin that extends event management capability to all MVA classes
    var EventManager = function(dispatchDeny) {
        
        // Allows each MVA object to dispatch MVA events
        this.dispatchEvent = function(eventName, eventData, callback, context, async) {
            queueEvents(eventName, eventData, callback, context, dispatchDeny, async);
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
        'loadScript': queueScripts,
        'require': require,
        'loadJSONP': loadJSONP
    });

})();