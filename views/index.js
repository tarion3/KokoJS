var googleMaps = koko.View('GoogleMaps', function() {
            
    koko.require('./adapters/GoogleMaps.js');

    this.getMap = function(address) {
        var mapData = {'address':address};
        mapData.destCanvas = document.getElementById('map');
        this.dispatchEvent('Adapter:GoogleMaps:getMap', mapData, function(map) {});
    };

});

var twitter = koko.View('Twitter', function() {
            
    koko.require('./adapters/Twitter.js');

    this.getPublicTweets = function(eventData, callback, context) {
        this.dispatchEvent('Adapter:Twitter:getPublicTweets', eventData, function(feedHTML) {
            $('#tweets').attr('innerHTML', feedHTML);
        });
    };
    
    this.getTweetsByName = function(eventData, callback, context) {
        this.dispatchEvent('Adapter:Twitter:getTweetsByName', eventData, function(feedHTML) {
            $('#tweets').attr('innerHTML', feedHTML);
        });
    };

});

koko.require('http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js', function() {

    $(document).ready(function() {
        $('#mapForm').submit(function() { googleMaps.getMap($('#mapname').attr('value')); return false; });
        $('#tweets>button').click(function() { twitter.getPublicTweets(); });
    });

});