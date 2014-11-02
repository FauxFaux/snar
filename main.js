function seg(map, x1, y1, x2, y2) {
    var points = [
        new google.maps.LatLng(x1, y1),
        new google.maps.LatLng(x2, y2)];

    new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: 'black',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        map: map
    });
}

function initialize() {
    var mapOptions = {
        zoom: 16,
        center: new google.maps.LatLng(51.56253, -0.24655),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

    $.get('http://localhost:9000/', function (x) {
        x.forEach(function (item) {
            seg(map, item[0][0], item[0][1], item[1][0], item[1][1]);
        });
    });

    $('#file').on('change', function () {
        var reader = new FileReader();
        reader.onload = function (e) {
            var points = [];
            $($($.parseXML(this.result)).find('trkseg')[0]).children().each(function (_, x) {
                points.push(new google.maps.LatLng(x.getAttribute('lat'), x.getAttribute('lon')));
            });
            var seek = $('#seek');
            var circle = new google.maps.Circle({
                map: map,
                radius: 7,
                strokeWeight: 5,
                center: points[seek.val()]
            });
            seek.attr('max', points.length);
            seek.on('input', function () {
                circle.set('center', points[this.value]);
            });

            new google.maps.Polyline({
                path: points,
                geodesic: true,
                strokeColor: 'blue',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map
            });
            var heat = new google.maps.visualization.HeatmapLayer({data: new google.maps.MVCArray(points)});
            heat.set('radius', 0.0003); // "pixels at zoom level 0" go screw yourself.  ~= 10 meters?
            heat.set('opacity', 0.2);
            heat.set('dissipating', false);
            heat.setMap(map);
        };
        reader.readAsText(this.files[0]);
    });

}

google.maps.event.addDomListener(window, 'load', initialize);
