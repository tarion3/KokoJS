var twitter = koko.View('Twitter', function() {
            
    koko.require('./adapters/Twitter.js');

    this.getPublicTweets = function() {
        this.dispatchEvent('Adapter:Twitter:getPublicTweets', {
            callback: function(feedHTML) { $('#tweets').html(feedHTML); },
            onerror: function(error) { $('#tweets').html(error); }
        });
    };
    
    this.getTweetsByName = function(screenname) {
        this.dispatchEvent('Adapter:Twitter:getTweetsByName', {
            data: {'screenname':screenname},
            callback: function(feedHTML) { $('#tweets').html(feedHTML); },
            onerror: function(error) { $('#tweets').html(error); }
        });
    };

});

koko.require('https://code.jquery.com/jquery-1.12.4.min.js', {

    callback: function() {

        $(document).ready(function() {
            $('#pubTweets').click(function() { twitter.getPublicTweets(); });
            $('#tweetForm').submit(function() { twitter.getTweetsByName($('#tweetUsername').attr('value')); return false; });
        });
        
    }

});
