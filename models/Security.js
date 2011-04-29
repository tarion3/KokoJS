koko.Model('Security', function() {
    
    this.userKey = koko.observable();
    
    this.doLogin = function(eventData, callback, context) {
        var loginStatus = 0;
        callback.call(context, loginStatus);
    };
    
});