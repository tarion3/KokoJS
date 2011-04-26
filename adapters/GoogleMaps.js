koko.defineAdapter('GoogleMaps', function() {
    
    koko.require('./models/GoogleMaps.js');
    
    this.loadMap = function(eventData, callback, context) {
        this.dispatchEvent('Model:GoogleMaps:getMap', eventData);
    };
    
});