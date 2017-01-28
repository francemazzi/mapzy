'use strict';

var ROME = [41.9028, 12.4964];
var MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

var map;
var clickCoords;
var workouts = [];
var markers = {};

var form = document.querySelector('.form');
var list = document.querySelector('.workouts');
var inputType = document.querySelector('.input-type');
var inputDistance = document.querySelector('.input-distance');
var inputDuration = document.querySelector('.input-duration');
var inputCadence = document.querySelector('.input-cadence');
var inputElevation = document.querySelector('.input-elevation');
var rowCadence = document.querySelector('.row-cadence');
var rowElevation = document.querySelector('.row-elevation');

function Workout(coords, distance, duration) {
  this.id = (Date.now() + '').slice(-10);
  this.date = new Date();
  this.coords = coords;
  this.distance = distance;
  this.duration = duration;
}

function Running(coords, distance, duration, cadence) {
  Workout.call(this, coords, distance, duration);
  this.type = 'running';
  this.cadence = cadence;
  this.pace = duration / distance;
}

function Cycling(coords, distance, duration, elevation) {
  Workout.call(this, coords, distance, duration);
  this.type = 'cycling';
  this.elevation = elevation;
  this.speed = distance / (duration / 60);
}

function description(workout) {
  var kind = workout.type === 'running' ? 'Corsa' : 'Bicicletta';
  return (
    kind +
    ' il ' +
    workout.date.getDate() +
    ' ' +
    MONTHS[workout.date.getMonth()]
  );
}

function details(workout) {
  if (workout.type === 'running') {
    return (
      workout.distance +
      ' km, ' +
      workout.duration +
      ' min, ' +
      workout.pace.toFixed(1) +
      ' min/km, ' +
      workout.cadence +
      ' passi/min'
    );
  }
  return (
    workout.distance +
    ' km, ' +
    workout.duration +
    ' min, ' +
    workout.speed.toFixed(1) +
    ' km/h, ' +
    workout.elevation +
    ' m'
  );
}

function readNumber(input, allowZero) {
  if (input.value === '') return null;
  var value = Number(input.value);
  if (!isFinite(value) || value < 0 || (!allowZero && value === 0)) return null;
  return value;
}

function renderList() {
  list.innerHTML = '';
  workouts.forEach(function (workout) {
    var item = document.createElement('li');
    item.setAttribute('data-id', workout.id);
    var title = document.createElement('strong');
    title.textContent = description(workout);
    var meta = document.createElement('span');
    meta.textContent = details(workout);
    item.appendChild(title);
    item.appendChild(meta);
    list.appendChild(item);
  });
}

function addMarker(workout) {
  markers[workout.id] = L.marker(workout.coords)
    .addTo(map)
    .bindPopup(description(workout));
}

function showMap(coords) {
  map = L.map('map-canvas').setView(coords, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.on('click', function (event) {
    clickCoords = [event.latlng.lat, event.latlng.lng];
    form.classList.remove('hidden');
    inputDistance.focus();
  });
}

inputType.addEventListener('change', function () {
  var running = inputType.value === 'running';
  rowCadence.classList.toggle('hidden', !running);
  rowElevation.classList.toggle('hidden', running);
});

form.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!clickCoords) return;

  var distance = readNumber(inputDistance, false);
  var duration = readNumber(inputDuration, false);
  var workout;

  if (inputType.value === 'running') {
    var cadence = readNumber(inputCadence, false);
    if (distance === null || duration === null || cadence === null) return;
    workout = new Running(clickCoords, distance, duration, cadence);
  } else {
    var elevation = readNumber(inputElevation, true);
    if (distance === null || duration === null || elevation === null) return;
    workout = new Cycling(clickCoords, distance, duration, elevation);
  }

  workouts.push(workout);
  addMarker(workout);
  markers[workout.id].openPopup();
  renderList();
  form.reset();
  form.classList.add('hidden');
  inputType.value = 'running';
  rowCadence.classList.remove('hidden');
  rowElevation.classList.add('hidden');
});

list.addEventListener('click', function (event) {
  var node = event.target;
  while (node && node !== list) {
    if (node.getAttribute && node.getAttribute('data-id')) {
      var id = node.getAttribute('data-id');
      var found = null;
      workouts.forEach(function (workout) {
        if (workout.id === id) found = workout;
      });
      if (found) map.setView(found.coords, 13);
      return;
    }
    node = node.parentNode;
  }
});

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
