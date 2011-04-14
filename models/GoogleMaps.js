koko.defineModel('GoogleMaps', function() {
    koko.loadJSON('http://maps.google.com/maps/api/js?sensor=false&callback=');
    this.getMap = function(eventData, callback, callerRef) {
        var latlng = new google.maps.LatLng(eventData.lat, eventData.long);
        var myOptions = {
            zoom: 8,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        callback.call(callerRef, map = new google.maps.Map(eventData.destCanvas, myOptions));
    };
});