(function(){
    
    var extFWName = 'koko',         // Global framework object name
        extFWRef,                   // Global framework object reference
        emptyFunc = function(){};   // Reference to empty function for defaults usage

    var scriptQueue = [],       // Array of queued scripts waiting to be processed
        scriptQueueIdx = 0,     // Index into script queue to keep dependencies in order
        scriptLoadCount = 0,    // Counter for the number of scripts currently loading
        scriptProcTimer;        // Timer handle for script queue processing

    var eventQueue = [],        // Queue for all events waiting to be dispatched
        eventQueueIdx = 0,      // Index pointing to the next place in the event queue to place an event - used for dependency checking
        eventLoadCount = 0,     // Integer indicating the number of events currently being dispatched
        eventProcTimer,         // Event queue processing timer
		eventListeners = [];	// Collection of event listener objects to be traveresed upon event dispatch

    // Utility function to see if the passed in object is an instance of any of the classes in the class array
    var isInstanceOf = function(obj, classArray) {
        for (var i = 0, c; (c = classArray[i++]) !== undefined;) {
            if (obj instanceof c) return true;
        }
        return false;
    };

    var queueScripts = function(scriptURLs, callback, callerRef, hasIntCallback) {
        if (typeof scriptURLs === 'undefined') { throw 'Error: Call to queueScripts requires scriptURLs to queue'; }
        if (typeof scriptURLs === 'string') { scriptURLs = (scriptURLs.replace(' ', '')).split(','); }
        scriptQueueIdx = 0;
        for (var scriptURL; (scriptURL = scriptURLs.shift()) !== undefined;) {
            var scriptObj = {'src':scriptURL, 'hasIntCallback':hasIntCallback || false};
            if (scriptURLs.length === 0) {
                scriptObj.callback = callback || emptyFunc;
                scriptObj.callerRef = callerRef || this;
            }
            scriptQueue.splice(scriptQueueIdx++, 0, scriptObj);
        }
        scriptProcTimer = setTimeout(procScriptQueue, 50);
    };
    
    var procScriptQueue = function() {
        if (scriptQueue.length > 0) {
            if (scriptLoadCount === 0) {
                for (var scriptObj; (scriptObj = scriptQueue.shift()) !== undefined;) {
                    loadScript(scriptObj);
                }
            }
            scriptProcTimer = setTimeout(procScriptQueue, 50);
        }
    };
    
    var loadScript = function(scriptObj) {
        var docHead = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = scriptObj.src;
        script.type = 'text/javascript';
        script.onload = function() {
            if(!scriptObj.hasIntCallback) { scriptLoadCount--; }
            if (scriptObj.callback !== undefined) {
                scriptObj.callback.call(scriptObj.callerRef);
            }
        };
        scriptLoadCount++;
        docHead.appendChild(script);
    };
    
    var loadJSON = function(dataURL, callback, callerRef) {
        if (typeof dataURL === 'undefined') { throw 'Error: Call to queueJSON requires jsonURL to queue'; }
        var localCallback;
        while(extFWRef[localCallback = 'callback' + Math.floor(Math.random(Date.now())*101)] !== undefined){}
		extFWRef[localCallback] = function(JSONObj) {
            scriptLoadCount--;
			if (callback !== undefined) { callback.call(callerRef || this, JSONObj); }
			delete extFWRef[localCallback];
		};
        queueScripts(dataURL + extFWName + '.' + localCallback, undefined, undefined, true);
    };

    // Queues events to be synchronously loaded
	// Queue processing method is called immediately and monitors the queue for new events
	var queueEvents = function(eventNames, eventData, callback, callerRef, dispatchDeny) {
		if (eventNames === undefined) return;
		if (typeof eventNames === 'string') { eventNames = (eventNames.replace(' ', '')).split(','); }
		eventQueueIdx = 0;
		for (var eventName; (eventName = eventNames.shift()) !== undefined;) {
            var eventObj = {'eventName':eventName,'eventData':eventData,'dispatchDeny':dispatchDeny};
			if (eventNames.length === 0) {
				eventObj.callback = callback || emptyFunc;
				eventObj.callerRef = callerRef || this;
			}
			eventQueue.splice(eventQueueIdx++, 0, eventObj);
		}
		eventProcTimer = setTimeout(procEventQueue, 20);
	};

    // Dispatches all queued events in the order they were queued
    // Uses reference to a single event timer to ensure there is no overlap in queue processing
	var procEventQueue = function() {
		if (eventQueue.length > 0) {
			if (scriptQueue.length === 0 && scriptLoadCount === 0 && eventLoadCount === 0) {
                for (var eventObj; (eventObj = eventQueue.shift()) !== undefined;) {
				    _dispatchEvent(eventObj);
                }
			}
			eventProcTimer = setTimeout(procEventQueue, 20);
		}
	};

    var _dispatchEvent = function(eventObj) {
        var eventNameParts, eventFunc;
        if((eventNameParts = eventObj.eventName.split(':')).length < 3) { throw 'Error: Event names must be of the format Class:Name:Method'; }
        var eventDestType = eventNameParts[0],    // destination type/class
            eventDestName = eventNameParts[1],    // event destination name
            eventDestFunc = eventNameParts[2];	// event destination function
        if (eventObj.callback !== emptyFunc) {
            eventObj.callback = (function(cb,sc){ 
                return function() {
                    eventLoadCount--;
                    if(cb !== undefined) { cb.apply(sc, arguments); } 
                };
            })(eventObj.callback, eventObj.callerRef);
        }
        for (var i = 0, listener; (listener = eventListeners[i++]) !== undefined;) {
            if(!isInstanceOf(listener, eventObj.dispatchDeny) && (listener.type === eventDestType) && (listener.name === eventDestName) && (eventFunc = listener[eventDestFunc]) !== undefined) {
                if (eventObj.callback !== emptyFunc) { eventLoadCount++; }
                eventFunc.call(listener, eventObj.eventData, eventObj.callback, eventObj.callerRef);
            }
        }
	};

    // Extends event management capability to all MVA classes
	var EventManager = function(dispatchDeny) {

		// Allows each MVA object to dispatch MVA events
		// If the framework is not ready (due to script loading), events are queued for later dispatch
		// Event names must be of the format Class:Name:Method
		this.dispatchEvent = function(eventName, eventData, callback, callerRef) {
            queueEvents(eventName, eventData, callback, callerRef || this, dispatchDeny);
		};

		// Registers this MVA object as an event listener so it is able to accept incoming events
		eventListeners.push(this);
	};

    // Defines standard attributes of all MVA classes
    // Event management capability is appended by cloning the EventManager function as opposed to class inheritance
	var MVAClass = function(classType, className, classDef, dispatchDeny) {
		if(classType !== undefined) { this.type = classType; } else { throw 'Error: Class type required to create a new class.'; }
		if(className !== undefined) { this.name = className; } else { throw 'Error: Class name required to create a new class.'; }
		if(classDef !== undefined) { classDef.call(this); }
		EventManager.call(this, dispatchDeny || []);
	};

	// Available MVA classes that can be instantiated as objects for event-driven communication
	// These classes are created by appending functionality through cloning the MVAClass function as opposed to class inheritance
	var View = function(className, classDef) { MVAClass.call(this, 'View', className, classDef, [Model]); };
	var Model = function(className, classDef) { MVAClass.call(this, 'Model', className, classDef, [View]); };
	var Adapter = function(className, classDef){ MVAClass.call(this, 'Adapter', className, classDef); };
    
     // Defines the external framework object methods
	return (extFWRef = this[extFWName] = {
		'defineView': function(className, classDef) { return new View(className, classDef); },
		'defineModel': function(className, classDef) { return new Model(className, classDef); },
		'defineAdapter': function(className, classDef) { return new Adapter(className, classDef); },
		'loadScripts': queueScripts,
		'require': queueScripts,
		'loadJSON': loadJSON
	});
    
})();