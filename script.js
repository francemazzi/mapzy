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

//Variabili reste private
// let map, mapEvent;
class Workout {
  //Data di creazione del workout
  date = new Date();
  //id converte in string e prende le ultime 10 cifre
  //cambiato new Date() con Date.now() -> ci da il tempo stampato in tempo reale corrente adesso
  //Se progetto ha tanti utenti (+100) non dare affidamento su id
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; //[lat, lng]
    this.distance = distance; //in km
    this.duration = duration; // in minuti
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence, elevationGain) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running'
    this.calcPace();
  }
  calcPace() {
    //definito in -> min / km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling'
    this.calcSpeed();
  }
  calcSpeed() {
    //definita in km / h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//creazione nuova allenamento
const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 523);
console.log(run1, cycling1);

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//Architettura applicazione
class App {
  //private
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    //
    form.addEventListener('submit', this._newWorkout.bind(this));

    //Inseriamo la selezione running|cycling -> inpuType
    //Andiamo a vedere come sono nascosti i form
    inputType.addEventListener('change', this._toggleElevationField);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function gestisciErrore(error) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log("Permesso negato dall'utente");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log('Impossibile determinare la posizione corrente');
              break;
            case error.TIMEOUT:
              console.log(
                'Il rilevamento della posizione impiega troppo tempo'
              );
              break;
            case error.UNKNOWN_ERROR:
              console.log('Si è verificato un errore sconosciuto');
              break;
          }
        }
      );
    }
  }
  _loadMap(posizione) {
    const latitudine = posizione.coords.latitude;
    const longitudine = posizione.coords.longitude;
    console.log(`https://www.google.it/maps/@${latitudine}.${longitudine},14z`);
    const coords = [latitudine, longitudine];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Hanfling clicks on map --> abbiamo la possobiilità di accedere all'evneto map
    this.#map.on('click', this._shoForm.bind(this));
  }
  _shoForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toogleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    //Per evitare auto-caricamento
    e.preventDefault();

    //Prendere dati dal form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //Vedere se dati sono valii

    //Se l'attività è la corsa creare oggetto running
    if (type === 'running') {
      //controllo input valido -> funzione che legge se input è finito o meno
      const validInput = (...inputs) =>
        inputs.every(inp => Number.isFinite(inp));
      const allPositive = (...inputs) => inputs.every(inp => inp > 0);

      const cadence = +inputCadence.value;

      //Controllo if se dati sono validi -> se distanza, durata e cadenza non sono numero
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        //Semplifichiamo la formula sopra con questa funzione sotto che darà true o false
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Deve inserire un valore positivo!');
      }

      //primo esempio di allenamento
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //Se l'attività è la bicicletta creare oggetto cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Controllo if se dati sono validi -> se distanza, durata e cadenza non sono numero
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      ) {
        return alert('Deve inserire un valore positivo! 🚴🏻');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Aggiungere nuovo oggetto al workout array
    this.#workouts.push(workout);
    console.log(workout);

    //Rendere workout sulla mappa come marker

    //Rendere workout sulla sulla lista
    this.renderWorkoutMarker(workout);

    //Nascondere form e pulire campi input

    //Clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // il primo problema è che dobbiamo utilizzare due variabili che non esistono in questo scope
  }
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('workout')
      .openPopup();
  }
}

const app = new App();
