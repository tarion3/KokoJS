koko.defineModel('GoogleMaps', function() {
    
    koko.loadJSON('http://maps.google.com/maps/api/js?sensor=false&callback=');

    this.getMap = function(eventData, callback, callerRef) {
        if (eventData.address === undefined) { throw 'Error: Call to getMap requires an address'; }
        this.codeAddress(eventData, function(coords) {
            var latlng = new google.maps.LatLng(coords.Da, coords.Ea);
            var myOptions = {
                zoom: 8,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(eventData.destCanvas, myOptions);
            var marker = new google.maps.Marker({
                map: map, 
                position: coords
            });
            callback.call(callerRef, map);
        }, this);
    };
    
    this.codeAddress = function(eventData, callback, callerRef) {
        if (eventData.address === undefined) { throw 'Error: Call to codeAddress requires address to decode'; }
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': eventData.address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                callback.call(callerRef, results[0].geometry.location);
            } else {
                throw 'Geocode was not successful for the following reason: ' + status;
            }
        });
    };
    
});