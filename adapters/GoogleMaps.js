koko.Adapter('GoogleMaps', function() {
    
    koko.require('./models/GoogleMaps.js');
    
    this.getMap = function(eventData, callback, context) {
        this.dispatchEvent('Model:GoogleMaps:getMap', eventData, callback, context);
    };
    
});