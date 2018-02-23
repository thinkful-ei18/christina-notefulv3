'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI } = require('../config');
const { JWT_SECRET } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

describe.skip('Noteful API - Auth', function () {
  const username = 'bumper2';
  const password = 'catsarecool';
  let id;

  let token;
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.hashPassword(password)
    .then(password => User.create({ username, password }))
    .then(user => {
      id = user.id;
    });
  });

  afterEach(function () {
    User.remove({});
    return mongoose.connection.db.dropDatabase()
      .catch(err => console.error(err));
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/v3/login', () => {
    it('should return a valid token', () => {

    });

    it('should reject with no username or password', () => {

    });

    it('should reject with incorrect username', () => {

    });

    it('should reject with incorrect password', () => {

    });
    
  });

  describe('/v3/refresh', () => {
    it('should return a valid token with newer expir date', () => {

    });

    it('should reject with invalid token', () => {

    });

    it('should reject with expired token', () => {

    });
    
  });

});