//all staff which does not relate to express

const mongoose = require('mongoose');
const dotenv = require('dotenv');//require dotenv, which has been installed

//Uncaught exception
//Should be here in a top as it listens to errors described in the code below
// process.on('uncaughtException', err => {
//   console.log('Uncaught Exception. Shutting down ...');
//   console.log(err.name, err.message);
//   server.close(() => { //closing app in case of error
//     process.exit(1);
//   });
// });

dotenv.config({ path: './config.env' });//reads variables from config.env and assign
                                      //them to node.js environments
const app = require('./app');//this command should be after dotenv.config({ path: './config.env' }) because firstly environments must be specified
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);// in config.env replacess <PASSWORD> in DATABASE variable
                                                                                   // with DATABASE_PASSWORD
mongoose
//.connect(process.env.DATABASE_LOCAL, { // In case of local DB connection
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
  //console.log(con.connections)
  console.log('DB connection Successful!');;
});

// console.log(process.env);//logs current environment
//console.log(process.env);//logs all environments
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App runing on port ${port}...!`);
});

//Unhandled rejection
process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection. Shutting down ...');
  console.log(err.name, err.message);
  server.close(() => { //closing app in case of error in mild way
    process.exit(1)
  });
});
