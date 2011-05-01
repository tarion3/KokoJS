koko.Model('Security', function() {
    
    this.userKey = koko.observable();
    
    this.doLogin = function(eventData, callback, onerror, context) {
        var loginStatus = 0;
        callback.call(context, loginStatus);
    };
    
});