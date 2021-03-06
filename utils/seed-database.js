'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tags');
const seedFolders = require('../db/seed/folders');
const seedNotes = require('../db/seed/notes');
const seedTags = require('../db/seed/tags.json');

  // previous statements removed for brevity
  mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Note.createIndexes(),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });