'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { MONGODB_URI } = require('./config');
const Note = require('./models/note');

mongoose.connect(MONGODB_URI)
  .then(() => Note.ensureIndexes())
  .then(() => {
    return Note.find(
      { $text: { $search: 'ways' } })
      .then(results => {
        console.log(results);
      });
  })
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });