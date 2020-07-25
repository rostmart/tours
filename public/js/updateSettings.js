//Functions for update user data (name, email, password)
import axios from 'axios';
import { showAlert } from './alerts';


// Function for updating name, email, password
export const updateSettings = async (data, type) => { // type is either 'password' - for password change
                                                      // or 'data' - for name and email change
  try { // we can use try/catch with axios
    // we can use axios here as we specified its url in base.js (axios was installed after that)
    const url = type === 'data'
    ? 'http://127.0.0.1:8000/api/v1/users/updateMe'
    : 'http://127.0.0.1:8000/api/v1/users/updatePassword';

    const res = await axios({
      method: 'PATCH',
      // url from postman (turnary operator either for 'data' or 'password' change depending on a 'type' string)
      url,
      // data which sends with the body (http request)
      data // data is object from argument will be sent
    });

    // alert shows that log in was successful
    if (res.data.status === 'success') {
      showAlert('success', `You changed your ${type.toUpperCase()} this time!`);
      window.setTimeout(()=> { // allert will be available 1.5 sec
        location.assign('/'); // load homepage after successful log in
      }, 1500);
    }
  } catch(err) {
    showAlert('error', err.response.data.message);
  }
};
