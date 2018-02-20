'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const localStragety = require('../passport/local');

const options = {session: false, failWithError: true};
passport.use(localStragety);
const localAuth = passport.authenticate('local', options);

router.post('/login', localAuth, (req, res) => {
  return res.json(req.user);
});

module.exports = router;