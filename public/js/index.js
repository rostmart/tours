//File for getting data from a user and delegate operations (all data relates to user interface)
//This file is an entry point to parcel (bundling functionality)

// console.log("hello from parcel");

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login'; //in node.js we use "require" instead of "import"; { login } - name of the function in login.js
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM ELEMENTS (checking if a page contains some elements on a page (map, login form). Only in case it is, DELEGATION is executed)
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutButton = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('.book-tour');

// DELEGATION
if (mapBox) {
  //We get a string with data about locations from tour.pug (#map(data-locations=`${JSON.stringify(tour.locations)}`))
  //and transforms it to an array
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();// prevents from loading any other pages
    const email = document.getElementById('email').value; //reads data from #email ID in login.pug
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutButton) {
  logOutButton.addEventListener('click', logout);
}

// in case user needs name and email update
if (updateDataForm) {
  updateDataForm.addEventListener('submit', e => {
    e.preventDefault();// prevents from loading any other pages
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

// in case user needs password update
if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();// prevents from loading any other pages

    // implemntation of changing "submit" button to "updating" when passwords are processing after submitting them
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

    // After successful API call, we need to delete typed passwords in our input fields
    // In oder to do that, we need to call updateSettings as await (because it is async function)
    // When updateSettings will be executed, the code below (deleting typed passwords in our input fields)
    //  will be implemented in the same time. As we added await before updateSettings, we need to mark
    // 'e' as async
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...'
    const { tourId } = e.target.dataset; // e.target - the element which was triggered for this event to be fired (L211)
    bookTour(tourId);
  })
}
