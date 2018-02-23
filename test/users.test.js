'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');
const seedUsers = require('../db/seed/user.json');


const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

describe('Noteful API - Users', function () {
  const username = 'testingUser';
  const password = 'testingpassword';
  const fullName = 'Testy McTesterson';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    const userPasswordPromise = User.hashPassword(password);
    const userCreatePromise = User.create([username, password, fullName]);
    const seedUsersPromise = User.insertMany(seedUsers);

    return Promise.all([userPasswordPromise, userCreatePromise, seedUsersPromise])
      .then(() => {});
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });










  
});