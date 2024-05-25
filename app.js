google.load("visualization", "1", { packages: ["columnchart"] });

var map
var marker
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8,
    center: { lat: 45.16, lng: 15.14 },
    mapTypeId: "terrain",
  });

  const elevator = new google.maps.ElevationService();
  const directionsService = new google.maps.DirectionsService();
  const directionsDisplay = new google.maps.DirectionsRenderer();

  directionsDisplay.setMap(map);

  var request = {
    origin: "Zagreb",
    destination: "Neum",
    travelMode: google.maps.DirectionsTravelMode.DRIVING,
  };

  directionsService.route(request, function (response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      var decodedCoordinates = google.maps.geometry.encoding.decodePath(
        response.routes[0].overview_polyline
      );
      const path = decodedCoordinates.map(coord => ({ lat: coord.lat(), lng: coord.lng() }));
      displayPathElevation(path, elevator, map);
      directionsDisplay.setDirections(response);
    }
  });
}

function displayPathElevation(path, elevator, map) {
  // Display a polyline of the elevation path.
  new google.maps.Polyline({
    path: path,
    strokeColor: "#0000CC",
    strokeOpacity: 0.4,
    map: map,
  });
  // Create a PathElevationRequest object using this array.
  // Initiate the path request.
  elevator
    .getElevationAlongPath({
      path: path,
      samples: 512,
    })
    .then(plotElevation)
    .catch((e) => {
      const chartDiv = document.getElementById("elevation_chart");

      // Show the error code inside the chartDiv.
      chartDiv.innerHTML = "Cannot show elevation: request failed because " + e;
    });
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation({ results }) {

  const chartDiv = document.getElementById("elevation_chart");
  const chart = new google.visualization.LineChart(chartDiv);
  const data = new google.visualization.DataTable();

  data.addColumn("string", "Sample");
  data.addColumn("number", "Elevation");
  data.addColumn("number", "Gradient");

  var sum = 0.0
  for (let i = 0; i < results.length; i++) {
    var gradient = 0
    if (i > 1)
      {
        var distance = getDistance(results[i].location, results[i-1].location)
        gradient = (results[i].elevation - results[i-1].elevation)/(distance) * 1000
      }
    sum = sum + gradient
    data.addRow([`${i}`, results[i].elevation, gradient]);
  }

  var averageGradient = sum / results.length
  const average_gradient = document.getElementById("average_gradient");
  average_gradient.value = averageGradient

  
  chart.draw(data, {
    height: 500,
    legend: "none",
    // @ts-ignore TODO update to newest visualization library
    titleY: "Elevation (m)",
  });

  google.visualization.events.addListener(chart, 'select', function () {
    const selection = chart.getSelection();
    if (selection.length > 0) {
      const rowIndex = selection[0].row;
      const latitude = results[rowIndex].location.lat();
      const longitude = results[rowIndex].location.lng();
      if (marker != null) marker.setMap(null);
      marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: '${results[i].location.lat()}, ${results[i].location.lat()}'
      });
      marker.setMap(map);
      map.setCenter({ lat: latitude, lng: longitude });
    }
  });
}

var rad = function(x) {
  return x * Math.PI / 180;
};

function getDistance(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

window.initMap = initMap;
