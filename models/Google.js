koko.defineModel('GoogleMaps', function() {

    this.getMap = function(eventData, callback, callerRef) {
        if (typeof eventData.address === 'undefined') { throw 'Error: Call to getMap requires an address'; }
        if (typeof google === 'undefined') { koko.requireAsync('http://maps.google.com/maps/api/js?sensor=false&callback='); }

        this.dispatchEvent('Model:GoogleMaps:codeAddress', eventData, function(coords) {
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
        });
    };
    
    this.codeAddress = function(eventData, callback, callerRef) {
        if (typeof eventData.address === 'undefined') { throw 'Error: Call to codeAddress requires address to decode'; }
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

koko.defineModel('GoogleCalendar', function() {
    
    this.getCalendar = function(eventData, callback, callerRef) {
        if (typeof eventData.name === 'undefined') { throw 'Error: Call to getCalendar requires a calendar name'; }
        callback.call(callerRef, 'https://www.google.com/calendar/embed?src=' + eventData.name + '&ctz=America/Chicago');
    };
    
});