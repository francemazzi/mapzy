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

    //leaflet
    //Adattiamo il codice -> ogni stirng che passa dentro map() deve essere l'elemento che viene visto nella mappa
    //Lo troviamo nel codice HTML --> lo troviamo indo e l'id del div è map
    //L è il nome del API usato da leaflet -> quest L ha metodi che utilizziamo
    var map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([51.5, -0.09])
      .addTo(map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
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
console.log(firstName);
