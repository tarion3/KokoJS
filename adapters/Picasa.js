koko.Adapter('Picasa', function() {
    
    koko.require('./models/Picasa.js');
    
    var feedParser = function(feedData) {
        var feedHTML = '<table><tr>', imgCount = 0;
        for (var i=0, item; typeof (item = feedData.feed.entry[i++]) !== 'undefined';) {
            feedHTML += '<td><img src="' + item.content.src + '" width="200"/></td>';
            imgCount++;
            if(imgCount % 5 === 0) { feedHTML += '</tr><tr>'; }
        }
        feedHTML += '</tr></table>';
        return feedHTML;
    };
    
    this.getRecentPhotos = function(eventData, callback, context) {
        this.dispatchEvent('Model:Picasa:getRecentPhotos', eventData, function(feedData) {
            callback.call(context, feedParser(feedData));
        });
    };
    
});