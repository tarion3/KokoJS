koko.defineModel('GoogleCalendar', function() {
    
    this.getCalendar = function(eventData, callback, context) {
        if (typeof eventData.name === 'undefined') { throw 'Error: Call to getCalendar requires a calendar name'; }
        callback.call(context, 'https://www.google.com/calendar/embed?src=' + eventData.name + '&ctz=America/Chicago');
    };
    
});