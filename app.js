google.load("visualization", "1", { packages: ["columnchart"] });


function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
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
  // Ask for 256 samples along that path.
  // Initiate the path request.
  elevator
    .getElevationAlongPath({
      path: path,
      samples: 500,
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
  // Create a new chart in the elevation_chart DIV.
  const chart = new google.visualization.LineChart(chartDiv);
  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  const data = new google.visualization.DataTable();

  data.addColumn("string", "Sample");
  data.addColumn("number", "Elevation");

  for (let i = 0; i < results.length; i++) {
    data.addRow(["", results[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  chart.draw(data, {
    height: 150,
    legend: "none",
    // @ts-ignore TODO update to newest visualization library
    titleY: "Elevation (m)",
  });
}


window.initMap = initMap;
