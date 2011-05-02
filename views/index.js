var googleMaps = koko.View('GoogleMaps', function() {
            
    koko.require('./adapters/GoogleMaps.js');

    this.getMap = function(address) {
        var mapData = {'address':address};
        mapData.destCanvas = document.getElementById('map');
        this.dispatchEvent('Adapter:GoogleMaps:getMap', mapData, function(map) {},
        function(error) {
            $('#map').attr('innerHTML', error);
        });
    };

});

var twitter = koko.View('Twitter', function() {
            
    koko.require('./adapters/Twitter.js');

    this.getPublicTweets = function() {
        this.dispatchEvent('Adapter:Twitter:getPublicTweets', null, function(feedHTML) {
            $('#tweets').attr('innerHTML', feedHTML);
        },
        function(error) {
            $('#tweets').attr('innerHTML', error);
        });
    };
    
    this.getTweetsByName = function(screenname) {
        var eventData = {'screenname':screenname};
        this.dispatchEvent('Adapter:Twitter:getTweetsByName', eventData, function(feedHTML) {
            $('#tweets').attr('innerHTML', feedHTML);
        },
        function(error) {
            $('#tweets').attr('innerHTML', error);
        });
    };

});

koko.require('http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js', function() {

    $(document).ready(function() {
        koko.console.debug = true;
        $('#mapForm').submit(function() { googleMaps.getMap($('#mapname').attr('value')); return false; });
        $('#pubTweets').click(function() { twitter.getPublicTweets(); });
        $('#tweetForm').submit(function() { twitter.getTweetsByName($('#tweetUsername').attr('value')); return false; });
    });

});