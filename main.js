function sqr(x) {
    return x * x
}

function distSquared(p1, p2) {
    return sqr(p1.x - p2.x) + sqr(p1.y - p2.y)
}

function distToSegmentSquared(point, start, end) {
    var l2 = distSquared(start, end);
    if (l2 == 0) return distSquared(point, start);
    var t = ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / l2;
    if (t < 0) return distSquared(point, start);
    if (t > 1) return distSquared(point, end);
    return distSquared(point, {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
    });
}

function seg(map, x1, y1, x2, y2) {
    var points = [
        new google.maps.LatLng(x1, y1),
        new google.maps.LatLng(x2, y2)];

    return new google.maps.Polyline({
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

    var roads = [];

    $.get('http://localhost:9000/', function (x) {
        x.forEach(function (item) {
            var x0 = item[0][0];
            var x1 = item[1][0];
            var y0 = item[0][1];
            var y1 = item[1][1];
            roads.push({
                'start': {'x': x0, 'y': y0},
                'end': {'x': x1, 'y': y1},
                'seg': seg(map, x0, y0, x1, y1)
            });
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

            points.forEach(function (point) {
                var loc = {'x': point.lat(), 'y': point.lng()};
                var best = 99999999;
                var bestRoad = undefined;
                roads.forEach(function(road) {
                    var curr = distToSegmentSquared(loc, road.start, road.end);
                    if (curr < best) {
                        best = curr;
                        bestRoad = road;
                    }
                });
                bestRoad.seg.set('strokeColor', 'red');
                bestRoad.seg.set('strokeWeight', 2);
                point.score = best;
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
