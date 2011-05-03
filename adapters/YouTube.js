koko.Adapter('YouTube', function() {
    
    koko.require('./models/YouTube.js');
    
    var feedParser = function(feedData) {
        var feedHTML = '<table>';
        for (var i=0, item; typeof (item = feedData.data.items[i++]) !== 'undefined';) {
            feedHTML += '<tr><td>' + item.title + '</td></tr>';
        }
        feedHTML += '</table>';
        return feedHTML;
    };
    
    this.getUserVideos = function(options) {
        this.dispatchEvent('Model:YouTube:getUserVideos', options.augment({
            callback: function(feedData) {
                options.callback.call(options.context, feedParser(feedData));
            } 
        }));
    };
    
});