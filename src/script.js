'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Posizione di default (Roma) usata quando la geolocalizzazione
//non è disponibile o viene negata: così la mappa si carica comunque
const DEFAULT_COORDS = [41.9028, 12.4964];

class Workout {
  constructor(coords, distance, duration) {
    //Data di creazione del workout
    this.date = new Date();
    //id converte in string e prende le ultime 10 cifre
    //cambiato new Date() con Date.now()
    this.id = (Date.now() + '').slice(-10);
    this.coords = coords; //[lat, lng]
    this.distance = distance; //in km
    this.duration = duration; // in minuti
    this.clicks = 0;
  }
  _setDescription() {
    const months = [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} il ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence, elevationGain) {
    super(coords, distance, duration);
    this.type = 'running';
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //definito in -> min / km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.type = 'cycling';
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //definita in km / h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//Architettura applicazione
class App {
  constructor() {
    //variabili di istanza (convenzione _ per indicare "private")
    this._map = undefined;
    this._mapEvent = undefined;
    this._workouts = [];
    this._mapZoomLevel = 13;
    //Marker Leaflet indicizzati per id del workout, per poterli rimuovere
    this._markers = {};

    //Ottieni la Posizione
    this._getPosition();

    //Ottieni informazioni dal local storage
    this._getLocalStorage();

    //Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    //Cambio tipo running|cycling -> mostra il campo corretto
    inputType.addEventListener('change', this._toogleElevationField);
    //Click sulla lista: pan al marker oppure eliminazione (delega eventi)
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    //Se il browser non supporta la geolocalizzazione carichiamo
    //comunque la mappa sulla posizione di default
    if (!navigator.geolocation) return this._loadMapDefault();

    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn("Permesso negato dall'utente");
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Impossibile determinare la posizione corrente');
            break;
          case error.TIMEOUT:
            console.warn('Il rilevamento della posizione impiega troppo tempo');
            break;
          default:
            console.warn('Si è verificato un errore sconosciuto');
        }
        //In ogni caso d'errore mostriamo la mappa: così l'utente può
        //sempre cliccare e aggiungere un allenamento (fix del bug noto)
        this._loadMapDefault();
      }
    );
  }
  _loadMapDefault() {
    this._loadMap({
      coords: { latitude: DEFAULT_COORDS[0], longitude: DEFAULT_COORDS[1] },
    });
  }
  _loadMap(posizione) {
    const latitudine = posizione.coords.latitude;
    const longitudine = posizione.coords.longitude;
    const coords = [latitudine, longitudine];

    this._map = L.map('map').setView(coords, this._mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    //Handling clicks on map
    this._map.on('click', this._showForm.bind(this));
    //I marker degli allenamenti salvati vanno resi qui, dopo che la
    //mappa esiste (la sidebar è già stata popolata da _getLocalStorage)
    this._workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    //Richiamare una call back ad un certo tempo
    setTimeout(() => (form.style.display = 'grid'), 1000);
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
    const { lat, lng } = this._mapEvent.latlng;
    let workout;

    //Helper di validazione condivisi tra running e cycling:
    //tutti gli input devono essere numeri finiti...
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    //...e i valori indicati devono essere positivi
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //Se l'attività è la corsa creare oggetto running
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Controllo if se dati sono validi
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Deve inserire un valore positivo!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //Se l'attività è la bicicletta creare oggetto cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //L'elevazione può essere negativa (discesa), quindi va solo
      //controllato che sia un numero; distanza e durata positive
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Deve inserire un valore positivo! 🚴🏻');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Aggiungere nuovo oggetto al workout array
    this._workouts.push(workout);

    //Rendere workout sulla mappa come marker
    this._renderWorkoutMarker(workout);
    //Rendere workout sulla sulla lista
    this._renderWorkout(workout);

    //Nascondi mappa
    this._hideForm();

    //Creazione memorizzazione locale dati
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? ' 🏃‍♂️ ' : ' 🚴🏻 '} ${workout.description}`
      )
      .openPopup();
    //Memorizziamo il marker per poterlo rimuovere all'eliminazione
    this._markers[workout.id] = marker;
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? ' 🏃‍♂️ ' : ' 🚴🏻 '
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value"> ${workout.pace.toFixed(1)} </span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      <span class="workout__delete">❌</span>
    </div>
    </li> `;
    if (workout.type === 'cycling')
      html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            <span class="workout__delete">❌</span>
          </div>
            `;
    //Inserisce il codice HTML subito dopo il form
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //Se non c'è un elemento del workout effettua il return
    if (!workoutEl) return;

    //Se è stato cliccato il pulsante ❌ eliminiamo l'allenamento
    if (e.target.classList.contains('workout__delete'))
      return this._deleteWorkout(workoutEl);

    const workout = this._workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //Sposta la vista sul marker dell'allenamento cliccato
    this._map.setView(workout.coords, this._mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _deleteWorkout(workoutEl) {
    const id = workoutEl.dataset.id;
    //Rimuovi il marker dalla mappa
    const marker = this._markers[id];
    if (marker) {
      this._map.removeLayer(marker);
      delete this._markers[id];
    }
    //Rimuovi il workout dall'array e l'elemento dalla lista
    this._workouts = this._workouts.filter(work => work.id !== id);
    workoutEl.remove();
    //Aggiorna la persistenza
    this._setLocalStorage();
  }

  _setLocalStorage() {
    //storage fatto da API JSON, per settare ->  string associata (chiave) 3 valore da memorizzare
    //Utilizziamo stringify che converte valori istringhe
    localStorage.setItem('workout', JSON.stringify(this._workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    //Se non ci sono dati ritorna
    if (!data) return;
    //Altrimenti ripristina la nostra matrice di workout:
    this._workouts = data;
    //questi data li inseriamo in liste
    //dato che non vogliamo creare nessun array usiamo forEach
    this._workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    //init local storage
    localStorage.removeItem('workout');
    //load automatico della pagina
    location.reload();
  }
}

const app = new App();
