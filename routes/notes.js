'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

/* Helpers */
function validateFolder(fId, uId) {
  if(!fId) {
    return Promise.resolve('valid');
  }
  return Folder
    .find({_id: fId, userId: uId})
    .then((result) => {
      if (!result.length) {
        return Promise.reject('folderInvalid');
      }
    });
}

function validateTags(tags, uId) {
  if(!tags) {
    return Promise.resolve('valid');
  }
  return Tag
    .find( {_id: tags, userId: uId} )
    .then((result) => {
      if (!result.length) {
        return Promise.reject('tagsInvalid');
      }
    });
  }

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = {};

  let projection = {};
  let sort = 'created'; // default sorting

  // if querying by searchTerm, then add to filter
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sort = projection;
  }

  // if querying by folder, then add to filter
  if (folderId) {
    filter.folderId = folderId;
  }

  // if querying by tags, then add to filter
  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter, projection)
    .where({'userId': userId})
    .select('title content created folderId tags userId')
    .populate('tags')
    .sort(sort)
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  console.log(userId);
  Note.findOne({ _id:id, userId })
    .select('title content created folderId tags')
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { 
    title, 
    content, 
    folderId, 
    tags, 
    userId };

    Promise.all([validateFolder(folderId, userId), validateTags(tags, userId)])
      .then( () => {
      return Note.create(newItem)
      .catch(next);
      })
      .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
      })
      .catch(next);
  
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateItem = { title, content, folderId, tags, userId };
  
  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  const options = { new: true };

  Promise.all([validateFolder(folderId, userId), validateTags(tags, userId)])
    .then( () => {
      Note.findByIdAndUpdate(id, updateItem, options)
    .select('id title content folderId tags userId')
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
    })
    .catch(next);
  
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({_id:id, userId})
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;