koko.Model('GoogleMaps', function() {

    koko.require('http://maps.google.com/maps/api/js?sensor=false&callback=', null, null, true); 

    this.getMap = function(eventData, callback, context) {
        if (typeof eventData.address === 'undefined' || eventData.address.replace(' ','') === '') { throw 'Error: Call to getMap requires an address'; }

        this.codeAddress(eventData, function(coords) {
            var myOptions = {
                zoom: 8,
                center: coords,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(eventData.destCanvas, myOptions);
            var marker = new google.maps.Marker({
                map: map,
                position: coords
            });
            callback.call(context, map);
        });
    };
    
    this.codeAddress = function(eventData, callback, context) {
        if (typeof eventData.address === 'undefined') { throw 'Error: Call to codeAddress requires address to decode'; }
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': eventData.address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                callback.call(context, results[0].geometry.location);
            } else {
                throw 'Geocode was not successful for the following reason: ' + status;
            }
        });
    };

});