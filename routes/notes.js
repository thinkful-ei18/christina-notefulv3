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
  const { searchTerm } = req.params;
  
  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  Note
    .find(filter)
      .then(results => {
        res.json(results).toObject;
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
      });
  });

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  Note
    // .find({'_id': req.params.id})
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