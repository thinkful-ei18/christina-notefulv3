'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');

// FOLDER ROUTER ENDPOINTS GO HERE

// GET ALL FOLDERS
router.get('/folders', (req, res, next) => {
  Folder
    .find()
    .then(folders => {
      res.json(folders).toObject;
    })
    .catch(next);
});

// GET FOLDER BY ID
router.get('/folders/:id', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('This `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder
    .findById(req.params.id)
    .then(folder => {
      if (folder) {
        res.json(folder).toObject;
      } else {
        next();
      }
    })
    .catch(next);
});

// CREATE FOLDER
router.post('/folders', (req, res, next) => {

  if (!req.body.name) {
    const err = new Error('Missing folder `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newFolder = { name: req.body.name };

  Folder
    .create(newFolder)
    .then(folder => {
      if (folder) {
        res.location(`${req.originalUrl}/${folder.id}`).status(201).json(folder).toObject;
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

// UPDATE FOLDER
router.put('/folders/:id', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('This `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  if (!req.body.name) {
    const err = new Error('Missing folder `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateFolder = {name: req.body.name };

  Folder
    .findByIdAndUpdate(req.params.id, updateFolder)
    .then(folder => {
      if (folder) {
        res.json(folder).toObject;
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// DELETE FOLDER
router.delete('/folders/:id', (req, res, next) => {
  const notePromise = Note.find({'folderId': req.params.id});
  notePromise.then(notes => {
    if (notes.length > 0) {
      const err = new Error('This folder contains notes it cannot be deleted');
      err.status = 405;
      return next(err);
    }
  });

  Folder
    .findByIdAndRemove(req.params.id)
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