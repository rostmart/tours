//Here is a script for sending data from tours-simple.json and tours.json to mongoDB
//In order to import data from local file to the DB: cmd: node dev-data/data/import-dev-data.js --import
//In order to delete all data from DB: cmd: node dev-data/data/import-dev-data.js --delete

//all staff which does not relate to express

const mongoose = require('mongoose');
const dotenv = require('dotenv');//require dotenv, which has been installed
dotenv.config({ path: './config.env' });//reads variables from config.env and assign
                                      //them to node.js environments
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');
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

//Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));//JSON.pasre-transforms to array of JS object;
                                                                              //${__dirname} allows to use any file location of a file
//const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
//const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//Import Data into DB
const importData = async () => {
    try {
        await Tour.create(tours);
        //await User.create(users, { validateBeforeSave: false }); //turns off validators before saving new users from the file
        //await Review.create(reviews);

        console.log('Data has been successfully loaded');
    } catch (err) {
        console.log(err);
    }
    process.exit();// -exits the app
};

//Delete all data from DB
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        //await User.deleteMany();
        //await Review.deleteMany();
        console.log('Data has been successfully deleted');
    } catch (err) {
        console.log(err);
    }
    process.exit();// -exits the app
};
//*BLOCK1 launching importing to DB/deleting from DB methods from cmd
if (process.argv[2] === '--import') {//[2] - means the third arg in a command "node dev-data/data/import-dev-data.js --import"
    importData();

} else if (process.argv[2] === '--delete') {
    deleteData();

}
//console.log(process.argv);//logs an array  of processes runing from cmd(ex: node dev-data/data/import-dev-data.js --import)
//BLOCK1*
