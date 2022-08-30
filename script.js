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

    const map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('click', function (mapEvent) {
      console.log(mapEvent);
      //destrurriamo l'oggetto dell'evento per ottenere coordinate
      const { lat, lng } = mapEvent.latlng;
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: 'running-popup',
          })
        )
        .setPopupContent('Punto<br>del circuito 🐎!')
        .openPopup();
    });
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
