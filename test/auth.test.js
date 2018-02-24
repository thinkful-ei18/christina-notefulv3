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

describe('Noteful API - Auth', function () {
  const username = 'bumper23';
  const password = 'catsarecool';
  const fullName = 'A cat'; 
  let id;

  let goodToken;
  let badToken;
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {

    badToken = jwt.sign(
      {
        username,
        password,
        fullName
      },
      'wrongSecret',
      {
        algorithm: 'HS256',
        expiresIn: Math.floor(Date.now() / 1000) - 10
      }
    );

    goodToken = jwt.sign(
      {
        username,
        password,
        fullName
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: username,
        expiresIn: '7d'
      }
    );

    return User.hashPassword(password)
    .then(password => User.create({ username, password, fullName }))
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
      return chai
        .request(app)
        .post('/v3/login')
        .send({username, password, fullName})
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const tokenPayload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(tokenPayload.user).to.deep.equal({
            username,
            fullName,
            id // no passwords in payload
          });
        });
    });
    
  });
 
  describe('/v3/refresh', () => {
    // it('should return a valid token with newer expir date', () => {
    //   return chai
    //     .request(app)
    //     .post('/v3/refresh')
    //     .set('Authorization', `Bearer ${goodToken}`)
    //     .then((res) => {
    //       expect(res).to.have.status(200);
    //       expect(res.body).to.be.a('object');
    //     });
    // });
    
    it('should reject an invalid token', () => {
      return chai
        .request(app)
        .post('/v3/refresh')
        .set('Authorization', `Bearer ${badToken}`)
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal('Unauthorized');
        }); 
    });

    it('should reject with expired token', () => {
      return chai
        .request(app)
        .post('/v3/refresh')
        .set('Authorization', `Bearer ${badToken}`)
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal('Unauthorized');
        });
    });
    
  });

});