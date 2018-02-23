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
const username = 'samTheDog';
const password = 'dogsruleforever';
let fullName = 'Tester McTesterson';
let id;


  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
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
    it('should create a user with valid hashed password', () => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({username, password, fullName})
          .then(res => {
            expect(res).to.have.status(201);
            expect(res).to.be.an('object');
            expect(res.body).to.include.keys({username,fullName,id}); // no password in res
            expect(res.body.username).to.equal(username);
            return User.findOne({
              username
            });
          })
          .then(user => {
            expect(user).to.not.be.null;
            expect(user.username).to.equal(username);
            expect(user.fullName).to.equal(fullName);
            return user.validatePassword(password);
          })
          .then(correctPassword => {
            expect(correctPassword).to.be.true; // correct hashed password
          });
    });

    it('should reject a duplicate username', () => {
      return User
        .create({username, password})
        .then(() => {
          return chai.request(app).post('/v3/users').send({username, password});
        })
        // .then(() => {
        //   expect.fail(null, null, 'Request should not succeed');
        // })
        .catch((err) => {
          // console.log(err instanceof chai.AssertionError);
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('This username is already taken');
        });
    });

    it('should reject a user with no username', () => {
      return chai
        .request(app)
        .post('/v3/users')
        .send({password: password})
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing username in request body');
        });
    });

    it('should reject a user with no username', () => {
      return chai
        .request(app)
        .post('/v3/users')
        .send({username})
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing password in request body');
        });
    });

    it('should reject a username shorter than 1 character', () => {
      return chai
        .request(app)
        .post('/v3/users')
        .send({username: '', password})
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Must be at least 1 characters long');
        });
    });

    it('should reject a password shorter than 8 characters', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username, password: 'hi'})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('Must be at least 8 characters long');
      });
    });

    it('should reject a password longer than 72 characters', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username, password: 'hihjdksahdhjksahdjhajshdjhasjkhdjhsajkdhhsajdhjsahdjhasdhjkahsjdhjkashdjkhasjdhhaskjd'})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('Password must be at most 72 characters long');
      });
    });

    it('should reject a username with whitespace', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username:'hi there', password})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('username should not contain whitespace');
      });
    });

    it('should reject a password with whitespace', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username, password:'hi there'})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('password should not contain whitespace');
      });
    });

    it('should reject a non-string username', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username: 123, password})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('Field: \'username\' must be type String');
      });
    });

    it('should reject a non-string password', () => {
      return chai
      .request(app)
      .post('/v3/users')
      .send({username, password:123})
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('Field: \'password\' must be type String');
      });
    });
  });
});