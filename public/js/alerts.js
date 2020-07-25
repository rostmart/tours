// Here are functions foralerts with successful/unsuccessful login in to account

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};


//Function for showing alerts
export const showAlert = (type, msg) => { // type is 'success' or 'error'
  const markup = `<div class="alert alert--${type}">${msg}</div>`; // here we create html for inserting
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup); // inserting html
  window.setTimeout(hideAlert, 5000)
};
