var googleMaps = koko.View('GoogleMaps', function() {
            
    koko.require('./adapters/GoogleMaps.js');

    this.getMap = function(address) {
        this.dispatchEvent('Adapter:GoogleMaps:getMap', {
            data: { 'address': address, 'destCanvas': document.getElementById('map') },
            callback: function(map) {},
            onerror: function(error) { $('#map').attr('innerHTML', error); }
        });
    };

});

var twitter = koko.View('Twitter', function() {
            
    koko.require('./adapters/Twitter.js');

    this.getPublicTweets = function() {
        this.dispatchEvent('Adapter:Twitter:getPublicTweets', {
            callback: function(feedHTML) { $('#tweets').attr('innerHTML', feedHTML); },
            onerror: function(error) { $('#tweets').attr('innerHTML', error); }
        });
    };
    
    this.getTweetsByName = function(screenname) {
        this.dispatchEvent('Adapter:Twitter:getTweetsByName', {
            data: {'screenname':screenname},
            callback: function(feedHTML) { $('#tweets').attr('innerHTML', feedHTML); },
            onerror: function(error) { $('#tweets').attr('innerHTML', error); }
        });
    };

});

koko.require('https://code.jquery.com/jquery-1.12.4.min.js', {

    callback: function() {

        $(document).ready(function() {
            $('#mapForm').submit(function() { googleMaps.getMap($('#mapname').attr('value')); return false; });
            $('#pubTweets').click(function() { twitter.getPublicTweets(); });
            $('#tweetForm').submit(function() { twitter.getTweetsByName($('#tweetUsername').attr('value')); return false; });
        });
        
    }

});
