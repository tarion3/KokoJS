koko.defineModel('Twitter', function() {
    
    // Returns the top 20 tweets from the public timeline
    this.getPublicTweets = function(eventData, callback, callerRef) {
        koko.loadJSON('http://api.twitter.com/1/statuses/public_timeline.json?suppress_response_codes&callback=', callback, callerRef);
    };
    
    // Returns the top 20 tweets for a specified twitter account
    this.getTweetsByName = function(eventData, callback, callerRef) {
        var sName = eventData.screenname;
        koko.loadJSON('http://api.twitter.com/1/statuses/user_timeline.json?suppress_response_codes&screen_name=' + sName + '&callback=', callback, callerRef);
    };
    
});