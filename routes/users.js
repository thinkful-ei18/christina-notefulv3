'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

router.post('/users', (req, res, next) => {
  const { fullName, username, password } = req.body;

  const requiredFields = ['username', 'password'];

  const missingField = requiredFields.find(field => !(field in req.body));
  const fieldString = requiredFields.find(field => field in req.body && typeof req.body[field] !== 'string');
  const whiteSpace = requiredFields.find(field => typeof req.body[field] === 'string' && req.body[field].indexOf(' ') > 0 );

  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    return next(err);
  }

  if (fieldString) {
    const err = new Error(`Field: '${fieldString}' must be type String`);
    err.status = 422;
    return next(err);
  }

  if (whiteSpace) {
    const err = new Error(`${whiteSpace} should not contain whitespace`);
    err.status = 422;
    return next(err);
  }
  
  const sizeFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizeFields).find(
    field => 
      'min' in sizeFields[field] &&
            req.body[field].trim().length < sizeFields[field].min
  );

  const tooLargeField = Object.keys(sizeFields).find(
    field => 
      'max' in sizeFields[field] &&
            req.body[field].trim().length > sizeFields[field].max
  );



  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'validationError',
      message: tooSmallField
        ? `Must be at least ${sizeFields[tooSmallField].min} characters long`
        : `Password must be at most ${sizeFields[tooLargeField].max} characters long`
    });
  }



  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        fullName,
        username,
        password: digest
      };
      return User.create(newUser);
    })
    .then(result => {
      return res.status(201).location(`/api/users/${result.id}`).json(result).toObject;
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('This username is already taken');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;