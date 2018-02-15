'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
// const folderRouter = require('./folders');

/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId } = req.query;

  let filter = {};
  let projection = {};
  let sortBy = 'created'; 

  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sortBy = projection;
  }

  if ( folderId ) {
    filter = {'folderId': folderId}


  }

  Note.find(filter, projection)
    .select('title content created folderId')
    .sort(sortBy)
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note
    .findById(req.params.id)
    .then(result => {
      if (result) {
        res.json(result).toObject;
      } else {
        next();
      }
    })
    .catch(next);

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { title, content };
  
  Note
    .create({newItem})
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result).toObject;
    })
    .catch(next);
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const updatedNote = {
    title,
    content
  };

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Note
    .findByIdAndUpdate(id, { $set: updatedNote })
    .then(note => {
      if(note) {
        res.json(note).toObject;
      } else {
        next();
      }
    })

    .catch(err => {
      next(err);
      res.status(500).json({ message: 'Internal Server Error'});
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;

  Note
    .findByIdAndRemove(id)
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;