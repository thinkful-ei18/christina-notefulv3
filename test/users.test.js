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

describe('Noteful API - Users', function () {
  const userA =  {
  'fullName': 'Bumper the cat',
  'username': 'bumper2',
  'password': 'catsarecool',
  '_id': '333333333333333333333300'
  };

  const userB =  {
    'fullName': 'Sam the Dog',
    'username': 'sam101',
    'password': 'dogssarecool',
    '_id': '333333333333333333333301'
    };

  let tokenA;
  let tokenB; 
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    const userAPasswordPromise = User.hashPassword(userA.password);
    const userBPasswordPromise = User.hashPassword(userB.password);
    const userACreatePromise = User.create(userA);
    const userBCreatePromise = User.create(userB);
    userA.id = userA._id;
    userB.id = userB._id;
    tokenA = jwt.sign(
      {
        user: userA
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: userA.username,
        expiresIn: '7d'
      }
    );
    tokenB = jwt.sign(
      {
        user: userB
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: userB.username,
        expiresIn: '7d'
      }
    );

    return Promise.all([userAPasswordPromise, userBPasswordPromise, userACreatePromise, userBCreatePromise])
      .then(() => {
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

  describe('/v3/users', () => {
    it('should create a user', () => {

    });

    it('should reject a duplicate username', () => {
      
    });

    it('should reject a user with no username', () => {
      
    });

    it('should reject a username shorter than 1 character', () => {
      
    });

    it('should reject a password shorter than 8 characters', () => {
      
    });

    it('should reject a password longer than 72 characters', () => {
      
    });

    it('should reject a username with whitespace', () => {
      
    });

    it('should reject a password with whitespace', () => {
      
    });

    it('should reject a non-string username', () => {
      
    });

    it('should reject a non-string password', () => {
      
    });





  });






});