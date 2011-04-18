koko.defineModel('Picasa', function() {

    // return top 10 most recent photos
    this.getRecentPhotos = function(eventData, callback, context) {
        var username = eventData.username;
        koko.loadJSONAsync('https://picasaweb.google.com/data/feed/api/user/' + username + '?kind=photo&max-results=10&alt=json&callback=', callback, context);
    };

});