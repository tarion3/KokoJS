(function(){

    var fwExtName = 'koko';		// Name of the external framework object

	var scriptQueue = [],		// Queue for all scripts waiting to be loaded
		scriptQueueIdx = 0,		// Index pointing to the next place in the script queue to place a script - used for dependency checking
		scriptProcTimer,		// Script processing timer handle
		scriptsLoading = 0,		// Integer indicating the number of scripts currently being loaded
		currentScript;			// The current script being loaded

	var eventQueue = [],
		eventQueueIdx = 0,
		eventProcTimer,
		eventListeners = [];	// Collection of event listener objects to be traveresed upon event dispatch

	// Extends event management capability to all MVA classes
	var EventManager = function(dispatchDeny) {

		// Allows each MVA object to dispatch MVA events
		// If the framework is not ready (due to dependency loading), events are queued for later dispatch
		// Event names must be of the format Class:Name:Method
		this.dispatchEvent = function(eventName, eventData, callback, callerRef) {
			if (eventName === undefined) return;
			if (!scriptsLoading) {
				var thisRef = this, eventNameParts, dispatchAllowed = false, eventFunc;
				if((eventNameParts = eventName.split(':')).length < 3) { throw 'Error: Event names must be of the format Class:Name:Method'; }
				var eventDestType = eventNameParts[0],	// destination type/class
					eventDestName = eventNameParts[1],	// event destination name
					eventDestFunc = eventNameParts[2];	// event destination function
				for (var i = 0, listener; (listener = eventListeners[i++]) !== undefined;) {
					dispatchAllowed = !dispatchDeny.some(function(x){ return listener instanceof x; });
					if(dispatchAllowed && (listener.type === eventDestType) && (listener.name === eventDestName) && (eventFunc = listener[eventDestFunc]) !== undefined) {
						eventFunc.call(listener, eventData, callback || function(){}, callerRef || thisRef);
					}
				}
			} else {
				eventQueue.push({'thisRef':this,'eventName':eventName,'eventData':eventData,'callback':callback,'callerRef':callerRef});
				procEventQueue();
			}
		};

		// Registers this MVA object as an event listener so it is able to accept incoming events
		eventListeners.push(this);
	};

	// Dispatches all queued events in the order they were queued
	// Uses reference to a single event timer to ensure there is no overlap in queue processing
	var procEventQueue = function() {
		if (eventQueue[0] !== undefined) {
			if (!scriptsLoading) { 
				var eventObj = eventQueue.shift();
				eventObj.thisRef.dispatchEvent(eventObj.eventName, eventObj.eventData, eventObj.callback, eventObj.callerRef);
			}
			eventProcTimer = setTimeout(procEventQueue, 10);
		}
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

	// Allows for external scripts (both local and remote) to be dynamically appended to the document
	// Used as a mechanism for loading dependencies and marks the framework as not ready until all scripts have loaded
	var loadScript = function(scriptURL, syncAsync, callback, callerRef, onError) {
		if(scriptURL === undefined) return;
		if (!scriptsLoading || syncAsync === 'async') {
			var headEl = document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = scriptURL;
			script.onload = function() {
				scriptsLoading++;
				headEl.removeChild(script);
				if (callback !== undefined) callback.call(callerRef || this);
			};
			script.onreadystatechange = function() {
				if (script.readyState == 'complete') { script.onload(); }
			};
			script.onerror = onError || script.onload;
			scriptsLoading--;
			currentScript = headEl.appendChild(script);
		}
	};

	// Loads all queued scripts in the order they were queued
	// Uses reference to a single event timer to ensure there is no overlap in queue processing
	var procScriptQueue = function() {
		if (scriptQueue[0] !== undefined) {
			if (!scriptsLoading || scriptQueue[0].syncAsync === 'async') { 
				var scriptObj = scriptQueue.shift();
				loadScript(scriptObj.src, scriptObj.syncAsync, scriptObj.callback, scriptObj.callerRef, scriptObj.onError); 
			}
			scriptProcTimer = setTimeout(procScriptQueue, 10);
		}
	};

	// Queues external scripts (both local and remote) to be synchronously loaded
	// Queue processing method is called immediately and monitors the queue for new events
	var queueScripts = function(scriptURLs, syncAsync, callback, callerRef, onError) {
		if (scriptURLs === undefined) return;
		if (typeof scriptURLs === 'string') { scriptURLs = scriptURLs.replace(' ', '').split(','); }
		scriptQueueIdx = 0;
		for (var scriptURL, scriptObj; (scriptURL = scriptURLs.shift()) !== undefined;) {
			scriptObj = {'src':scriptURL, 'syncAsync':syncAsync};
			if (scriptURLs.length === 0) {
				scriptObj.callback = callback;
				scriptObj.callerRef = callerRef;
				scriptObj.onError = onError;
			}
			scriptQueue.splice(scriptQueueIdx++, 0, scriptObj);
		}
		procScriptQueue();
	};
	
	// Loads JSON-encoded data by using the loadScript method
	// Wraps the given callback in a locally-executable reference for execution upon data load
	// Callback function wrapper name must be specified in the dataURL
	var loadJSON = function(dataURL, syncAsync, callback, callerRef, onError) {
		if (dataURL === undefined) { throw 'Error: Data URL must be specified when calling loadJSON'; }
		var thisRef = this, localCallback;
		while(thisRef[localCallback = 'callback' + Math.floor(Math.random(Date.now())*101)] !== undefined){}
		thisRef[localCallback] = function(JSONObj) { 
			if (callback !== undefined) { callback.call(callerRef, JSONObj); }
			delete thisRef[localCallback];
		};
		queueScripts(dataURL + fwExtName + '.' + localCallback, syncAsync, undefined, undefined, onError);
	};

	// Defines the external framework object methods
	return (this[fwExtName] = {
		'defineView': function(className, classDef) { return new View(className, classDef); },
		'defineModel': function(className, classDef) { return new Model(className, classDef); },
		'defineAdapter': function(className, classDef) { return new Adapter(className, classDef); },
		'loadScripts': queueScripts,
		'require': queueScripts,
		'loadJSON': loadJSON
	});
	
}());