'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputDelete = document.querySelector('.workout__delete');

//Variabili reste private
// let map, mapEvent;
class Workout {
  //Data di creazione del workout
  date = new Date();
  //id converte in string e prende le ultime 10 cifre
  //cambiato new Date() con Date.now()
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
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
  type = 'running';

  constructor(coords, distance, duration, cadence, elevationGain) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running'
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
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
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

//creazione nuova allenamento fittizio per test
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//Architettura applicazione
class App {
  //variabili private
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    //Ottieni la Posizione
    this._getPosition();

    //Ottieni informazioni dal local storage
    this._getLocalStorage();

    //Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    //Inseriamo la selezione running|cycling -> inpuType
    //Andiamo a vedere come sono nascosti i form
    inputType.addEventListener('change', this._toogleElevationField);
    //il this dentro a _moveToPopup(this) ?? associato per renderla corretta
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    //ELIMINARE FORM -> INCOMPIUTO
    // inputDelete.addEventListener('click', this._deleteForm.bind(this));
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
              console.log('Si ?? verificato un errore sconosciuto');
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

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Hanfling clicks on map 
    this.#map.on('click', this._showForm.bind(this));
    //load map marker in _loadMap ->load afer _getLocalStorage
    //_getLocalStorage side bar after _renderWorkoutMarker 
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
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
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //Vedere se dati sono valii
    //Se l'attivit?? ?? la corsa creare oggetto running
    if (type === 'running') {
      //controllo input valido -> funzione che legge se input ?? finito o meno
      const validInput = (...inputs) =>
        inputs.every(inp => Number.isFinite(inp));
      const allPositive = (...inputs) => inputs.every(inp => inp > 0);

      const cadence = +inputCadence.value;

      //Controllo if se dati sono validi 
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        //more simple
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Deve inserire un valore positivo!');
      }

      //primo esempio di allenamento
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //Se l'attivit?? ?? la bicicletta creare oggetto cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Da correggere/////////////////BUGGA  quando si pu?? correggere meglio! ///////////////////////////////////
      // if (
      //   !validInputs(distance, duration, elevation) ||
      //   !allPositive(distance, duration)
      // ) {
      //   return alert('Deve inserire un valore positivo! ????????');
      // }
      /////////////////////////////////////////////////////////////////////////////////////////////////////////
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Aggiungere nuovo oggetto al workout array
    this.#workouts.push(workout);

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
      .setPopupContent(
        `${workout.type === 'running' ? ' ????????????? ' : ' ???????? '} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? ' ????????????? ' : ' ???????? '
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">??????</span>
      <span class="workout__value"> ${workout.pace.toFixed(1)} </span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">????????</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      <span class="workout__delete">???</span>
    </div>
    </li> `;
    if (workout.type === 'cycling')
      html += `
         <div class="workout__details">
            <span class="workout__icon">??????</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            <span class="workout__delete">???</span>
          </div>
            `;
    //Inseriscee codice HTML sotto al genitore
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //Se non c'?? un elemento del workout effettua il return
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //metodo per ottimizzare la vista e con libreria leaflet andiamo a migliorare animazione
    //permette di fare muovere dove abbiamo posizionato il marker cliccando su menu esercizi
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //Utilizzare interfaccia pubblica
    // workout.click();
  }

  //ELIMINARE FORM -> INCOMPIUTO
  // _deleteForm(e) {
  //   const toDelete = e.target.closest('.workout__details');
  //   toDelete.parentNode.removeChild(toDelete);
  //   console.log('delete' + e);
  // }

  _setLocalStorage() {
    //storage fatto da API JSON, per settare ->  string associata (chiave) 3 valore da memorizzare
    //Utilizziamo stringify che converte valori istringhe
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    console.log(data);
    //Se non ci sono dati ritorna
    if (!data) return;
    //Altrimenti ripristina la nostra matrice di workout:
    this.#workouts = data;
    //questi data li inseriamo in liste
    //dato che non vogliamo creare nessun array usiamo forEach
    this.#workouts.forEach(work => {
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
