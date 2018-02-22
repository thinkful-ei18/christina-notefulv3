'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');
const seedUsers = require('../db/seed/user.json');


mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())

  // In Parallel 
  .then(() => {
    return Promise.all(seedUsers.map( user => bcrypt.hash(user.password, 10)));
  })
  .then( digests => {
    seedUsers.forEach((user, i) => user.password = digests[i]);
    return Promise.all([
      Note.insertMany(seedNotes),
      Note.createIndexes(), // trigger text indexing for $search

      Folder.insertMany(seedFolders),
      Folder.createIndexes(), // trigger text indexing for $search

      Tag.insertMany(seedTags),
      Tag.createIndexes(), // trigger text indexing for $search
      
      User.insertMany(seedUsers),
      User.createIndexes(), // trigger text indexing for $search
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

Note.on('index', () => {
  console.info('notes index is done building');
});

Folder.on('index', () => {
  console.info('folder index is done building');
});

Tag.on('index', () => {
  console.info('tag index is done building');
});
