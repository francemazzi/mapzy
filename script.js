'use strict';

var ROME = [41.9028, 12.4964];
var map;

function showMap(coords) {
  map = L.map('map-canvas').setView(coords, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.on('click', function (event) {
    var latlng = event.latlng;
    L.marker([latlng.lat, latlng.lng]).addTo(map).bindPopup('Punto').openPopup();
  });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      showMap([position.coords.latitude, position.coords.longitude]);
    },
    function () {
      showMap(ROME);
    }
  );
} else {
  showMap(ROME);
}
