koko.Model('Twitter', function() {
    
    // Returns the top 20 tweets from the public timeline
    this.getPublicTweets = function(eventData, callback, onerror, context) {
        koko.loadJSONP('http://api.twitter.com/1/statuses/public_timeline.json?suppress_response_codes&callback=', callback, onerror, context);
    };
    
    // Returns the top 20 tweets for a specified twitter account
    this.getTweetsByName = function(eventData, callback, onerror, context) {
        var sName = eventData.screenname;
        if(typeof sName !== 'string' || sName.replace(' ','') === '') { throw 'Error: Call to getTweetsByName requires a username'; }
        koko.loadJSONP('http://api.twitter.com/1/statuses/user_timeline.json?suppress_response_codes&screen_name=' + sName + '&callback=', callback, onerror, context);
    };
    
});