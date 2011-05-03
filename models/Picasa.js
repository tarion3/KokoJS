koko.Model('Picasa', function() {

    // return top 10 most recent photos
    this.getRecentPhotos = function(options) {
        koko.loadJSONP('https://picasaweb.google.com/data/feed/api/user/' + options.data.username + '?kind=photo&max-results=10&alt=json&callback=', options);        
    };

});