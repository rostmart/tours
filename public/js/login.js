//Code for impementing loging functionality between frontend&backend Interaction with login.pug
import axios from 'axios';
import { showAlert } from './alerts';

// in node.js we use "exports", here we use "export"
export const login = async (email, password) => {
  try { // we can use try/catch with axios
    // we can use axios here as we specified its url in base.js (axios was installed after that)
    const res = await axios({
      method: 'POST',
      // url from postman
      //url: 'http://127.0.0.1:8000/api/v1/users/login', // has been replaced when deployed to herroky
      url: '/api/v1/users/login', // this format is acceptable for herroky as API and website are hosted on the same place
      // data which sends with the body (http request)
      data: {
        email,
        password
      }
    });

    //alert shows that log in was successful
    if (res.data.status === 'success') {
      showAlert('success','You logged in successfully this time!');
      window.setTimeout(()=> { // allert will be available 1.5 sec
        location.assign('/'); // load homepage after successful log in
      }, 1500);
    }
  } catch(err) {
    showAlert('error', err.response.data.message);
  }
};

//logout implementation
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      // url from postman
      //url: 'http://127.0.0.1:8000/api/v1/users/logout',// has been replaced when deployed to herroky
      url: '/api/v1/users/login', // this format is acceptable for herroky as API and website are hosted on the same place
    });

    if (res.data.status = 'success') location.reload(true); // reload page initiation

  } catch (err) {
    showAlert('error', 'FATAL ERROR!!! TRY AGAIN!!!');
  }
};

//Has been moved to index.js as here we get data from a user
//We use class .form to hear submit events
// document.querySelector('.form').addEventListener('submit', e => {
//   e.preventDefault();// prevents from loading any other pages
//   const email = document.getElementById('email').value; //reads data from #email ID in login.pug
//   const password = document.getElementById('password').value;
//   login(email, password);
// });
