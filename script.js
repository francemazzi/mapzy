'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(mostraPosizione, gestisciErrore);
  function mostraPosizione(posizione) {
    const latitudine = posizione.coords.latitude;
    const longitudine = posizione.coords.longitude;
    console.log(`https://www.google.it/maps/@${latitudine}.${longitudine},14z`);

    const coords = [latitudine, longitudine];
    var map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(coords)
      .addTo(map)
      .bindPopup('Ciao! 👋🏻<br> Ti trovi qui!')
      .openPopup();
  }
  function gestisciErrore(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log("Permesso negato dall'utente");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log('Impossibile determinare la posizione corrente');
        break;
      case error.TIMEOUT:
        console.log('Il rilevamento della posizione impiega troppo tempo');
        break;
      case error.UNKNOWN_ERROR:
        console.log('Si è verificato un errore sconosciuto');
        break;
    }
  }
}
