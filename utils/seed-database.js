'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');
const seedNotes = require('../db/seed/notes');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Folder.insertMany(seedFolders))
  .then(() => Note.insertMany(seedNotes))
  .then(() => Note.createIndexes())
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });