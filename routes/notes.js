'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { MONGODB_URI } = require('../config');
const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;

  let filter = {};
  let projection = {};
  let sortBy = 'created'; 

  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sortBy = projection;
  }

  Note.find(filter, projection)
    .select('title content created')
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
      res.json(result).toObject;
    })
    .catch(err => {
      err.message('There was a problem with the server');
      res.status(500).json({ message: 'Internal server error' });
      next(err);
    });

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;
  
  Note
    .create({
      title,
      content
    })
    .then(note => res.json(note).toObject)
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const updatedNote = {
    title,
    content
  };

  Note
    .findByIdAndUpdate(id, { $set: updatedNote })
    .then(note => {
      res.json(note).toObject;
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
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
      res.status(500).json({ message: 'Internal Server Error'});
    });
});

module.exports = router;