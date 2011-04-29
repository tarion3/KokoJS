koko.Adapter('Twitter', function() {

    koko.require('./models/Twitter.js');

    var feedParser = function(feedData) {
        var feedHTML = '<table>';
        if (typeof feedData.error !== 'undefined') {
            feedHTML += '<tr><td>Error: ' + feedData.error + '</td></tr>';
        } else {
            for (var i = 0; i < feedData.length; i++) {
                feedHTML += '<tr><td>' + feedData[i].user.name + ':&nbsp;</td><td>' + feedData[i].text + '</td></tr>';
            }
        }
        feedHTML += '</table>';
        return feedHTML;
    };

    this.getPublicTweets = function(eventData, callback, context) {
        this.dispatchEvent('Model:Twitter:getPublicTweets', eventData, function(feedData) {
            callback.call(context, feedParser(feedData));
        });
    };
    
    this.getTweetsByName = function(eventData, callback, context) {
        this.dispatchEvent('Model:Twitter:getTweetsByName', eventData, function(feedData) {
            callback.call(context, feedParser(feedData));
        });
    };

});