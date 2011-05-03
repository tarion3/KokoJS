koko.Model('YouTube', function() {
    
    this.getUserVideos = function (options) {
        var username = options.data.username;
        if (typeof username === 'undefined') { throw 'Error: Call to getUserVideos requires username.'; }
        koko.loadJSONP('http://gdata.youtube.com/feeds/api/users/' + username + '/uploads?v=2&alt=jsonc&callback=', options);
    };
    
});