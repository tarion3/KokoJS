koko.Model('YouTube', function() {
    
    this.getUserVideos = function (eventData, callback, context) {
        if (typeof eventData.username === 'undefined') { throw 'Error: Call to getUserVideos requires username.'; }
        koko.loadJSONP('http://gdata.youtube.com/feeds/api/users/' + eventData.username + '/uploads?v=2&alt=jsonc&callback=', callback, context);
    };
    
});