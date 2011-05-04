koko.Model('GoogleMaps', function() {

    koko.require('http://maps.google.com/maps/api/js?sensor=false&callback=', {callbackInt: true}); 

    this.getMap = function(options) {
        
        if (typeof options.data.address === 'undefined' || options.data.address.replace(' ','') === '') { throw 'Error: Call to getMap requires an address'; }

        this.dispatchEvent('Model:GoogleMaps:codeAddress', options.augment({
            
            callback: function(coords) {
                
                var myOptions = { zoom: 8, center: coords, mapTypeId: google.maps.MapTypeId.ROADMAP };
                var map = new google.maps.Map(options.data.destCanvas, myOptions);
                var marker = new google.maps.Marker({ map: map, position: coords });
                
                options.callback.call(options.context, map);
                
            }
            
        }));
        
    };
    
    this.codeAddress = function(options) {
        
        if (typeof options.data.address === 'undefined') { throw 'Error: Call to codeAddress requires address to decode'; }
        
        var geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ 'address': options.data.address}, function(results, status) {
            
            if (status == google.maps.GeocoderStatus.OK) { options.callback.call(options.context, results[0].geometry.location); }
            else { options.onerror.call(options.context, 'Geocode was not successful for the following reason: ' + status); }
            
        });
        
    };

});