koko.Model('Security', function() {
    
    this.userKey = koko.observable();
    
    this.doLogin = function(options) {
        var loginStatus = 0;
        options.callback.call(options.context, loginStatus);
    };
    
});