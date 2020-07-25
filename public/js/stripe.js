import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_51H6Nx9DPL1O2BwgVmUBQwEWdBHVDU8ObpcfU4z7NnJ1E1amGlef8FkFo9jFiiing1DcmTVG9zAfAosoDUnNN1d9O00ymDD8DSZ'); // in Stripe('public key') we need our public key

export const bookTour = async tourId => { // tourId comes from tour.pug
  try {
    // 1) Get checkout session from the SERVER
    //const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`);// has been replaced when deployed to herroky
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);// this format is acceptable for herroky as API and website are hosted on the same place

    //console.log(session);

    // 2) Create checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch(err) {
    console.log(err);
    showAlert('error', err);  }
};
