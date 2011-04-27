var googleMaps = koko.defineView('GoogleMaps', function() {
            
    koko.require('./adapters/GoogleMaps.js');

    this.loadMap = function(address) {
        var mapData = {'address':address};
        mapData.destCanvas = document.getElementById('map');
        this.dispatchEvent('Adapter:GoogleMaps:loadMap', mapData);
    };

});

var twitter = koko.defineView('Twitter', function() {
            
    koko.require('./adapters/Twitter.js');

    this.loadTweets = function() {
        this.dispatchEvent('Adapter:Twitter:getPublicTweets', undefined, function(feedHTML) {
            $('#tweets>span').attr('innerHTML', feedHTML);
        });
    };

});