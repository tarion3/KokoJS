koko.defineAdapter('Twitter', function() {

    koko.require('./models/Twitter.js');

    var feedParser = function(feedData) {
        var feedHTML = '<table>';
        if (feedData.error !== undefined) {
            feedHTML += '<tr><td>Error: ' + feedData.error + '</td></tr>';
        } else {
            for (var i = 0; i < feedData.length; i++) {
                feedHTML += '<tr><td>' + feedData[i].user.name + ':&nbsp;</td><td>' + feedData[i].text + '</td></tr>';
            }
        }
        feedHTML += '</table>';
        return feedHTML;
    };
    
    this.getPublicTweets = function(eventData, callback, callerRef) {
        this.dispatchEvent('Model:Twitter:getPublicTweets', eventData, function(feedData) {
            callback.call(callerRef, feedParser(feedData));
        });
    };
    
    this.getTweetsByName = function(eventData, callback, callerRef) {
        this.dispatchEvent('Model:Twitter:getTweetsByName', eventData, function(feedData) {
            callback.call(callerRef, feedParser(feedData));
        });
    };

});

koko.defineAdapter('Picasa', function() {
    
    koko.require('./models/Picasa.js');
    
    var feedParser = function(feedData) {
        var feedHTML = '<table><tr>', imgCount = 0;
        for (var i=0, item; (item = feedData.feed.entry[i++]) !== undefined;) {
            feedHTML += '<td><img src="' + item.content.src + '" width="200"/></td>';
            imgCount++;
            if(imgCount % 5 === 0) { feedHTML += '</tr><tr>'; }
        }
        feedHTML += '</tr></table>';
        return feedHTML;
    };
    
    this.getRecentPhotos = function(eventData, callback, callerRef) {
        this.dispatchEvent('Model:Picasa:getRecentPhotos', eventData, function(feedData) {
            callback.call(callerRef, feedParser(feedData));
        });
    };
    
});

koko.defineAdapter('GoogleMaps', function() {
    
    koko.require('./models/GoogleMaps.js');
    
    this.loadMap = function(eventData, callback, callerRef) {
        this.dispatchEvent('Model:GoogleMaps:getMap', eventData);
    };
    
});