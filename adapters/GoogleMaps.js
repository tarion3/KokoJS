koko.Adapter('GoogleMaps', function() {
    
    koko.require('./models/GoogleMaps.js');
    
    this.getMap = function(options) {
        this.dispatchEvent('Model:GoogleMaps:getMap', options);
    };
    
});