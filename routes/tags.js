'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Tag = require('../models/tags');
const Note = require('../models/note');

// ENDPOINTS GO HERE

// GET all tags (sort by name)
router.get('/tags', (req, res, next) => {
  Tag
    .find()
    .sort({name: 1})
    .then(tags => {
      res.json(tags).toObject;
    })
    .catch(next);
});

// GET tag by id, invalid id protection, 404 for not found
router.get('/tags/:id', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag
    .findById(req.params.id)
    .then(tag => {
      if (tag) {
        res.json(tag).toObject;
      } else {
        next();
      }
    })
    .catch(next);
});

// POST validation against missing name, return location, checks for duplicate tag
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag
    .create({name})
    .then(tag => {
      res.location(`${req.originalUrl}/${tag.id}`).status(201).json(tag).toObject;
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

// PUT, by id, validation against missing name, invalid ObjectId, 404 not found, duplicate check
router.put('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body'); 
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag
    .findByIdAndUpdate(id, { name })
    .then(tag => {
      res.json(tag).toObject;
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('There is already a `tag` with this name');
        err.status = 400;
      }
      next(err);
    });
});

// DELETE, by id, remove tag, use $pull to remove tags array from note collection, return 204
router.delete('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  const removeTagPromise = Tag.findByIdAndRemove(id);
  const removeNotePromise = Note.update({ $pull: { Note: { tags: id } } });

  return Promise.all(removeTagPromise, removeNotePromise)
    .then((tags, notes) => {
      if (tags.length === notes[0].tags.length) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

  // Tag
  //   .findByIdAndRemove(id)
  //   .then(nothing => {
  //     if (nothing) {
  //       res.status(204).end();
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});


module.exports = router;