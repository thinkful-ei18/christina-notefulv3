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
const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');


const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

let token;

describe('Noteful API - Tags', function () {
  const testUser =  {
  'fullName': 'Bumper the cat',
  'username': 'bumper2',
  'password': 'catsarecool',
  '_id': '333333333333333333333300'
  };

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    const userPasswordPromise = User.hashPassword(testUser.password);
    const userCreatePromise = User.create(testUser);
    const tagInsertPromise = Tag.insertMany(seedTags);

    testUser.id = testUser._id;
    token = jwt.sign(
      {
        user: testUser
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: testUser.username,
        expiresIn: '7d'
      }
    );

    return Promise.all([userPasswordPromise, userCreatePromise, tagInsertPromise])
      .then(() => {
        return Tag.createIndexes();
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


  describe('GET /v3/tags', function () {

    it('should return the correct number of tags', function () {
      const dbPromise = Tag.find().where({'userId': testUser._id});
      const apiPromise = chai.request(app).get('/v3/tags').set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct right fields', function () {
      const dbPromise = Tag.find().where({'userId': testUser._id});
      const apiPromise = chai.request(app).get('/v3/tags').set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'name', 'userId');
          });
        });
    });

  });

  describe('GET /v3/tags/:id', function () {

    it('should return correct tags', function () {
      let data;
      return Tag.findOne().select('id name').where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/v3/tags/${data.id}`).set('authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'userId');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.userId).to.equal(testUser.id);
        });
    });

    it('should respond with a 400 for an invalid ID', function () {
      const badId = '99-99-99';
      const spy = chai.spy();
      return chai.request(app)
        .get(`/v3/tags/${badId}`)
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an ID that does not exist', function () {
      const spy = chai.spy();
      return chai.request(app)
        .get('/v3/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(404);
        });
    });

  });

  describe('POST /v3/tags', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'name': 'newTag',
      };
      let body;
      return chai.request(app)
        .post('/v3/tags')
        .send(newItem)
        .set('authorization', `Bearer ${token}`)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'name', 'userId');
          expect(body.userId).to.equal(testUser.id);
          return Tag.findById(body.id).where({'userId': testUser._id});
        })
        .then(data => {
          expect(body.id).to.equal(data.id);
          expect(body.name).to.equal(data.name);
          expect(body.userId).to.equal(testUser.id);
        });
    });

    it('should return an error when missing "name" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      const spy = chai.spy();
      return chai.request(app)
        .post('/v3/tags')
        .send(newItem)
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        })
        .then(() => {
          expect(spy).to.not.have.been.called();
        });
    });

  });

  describe('PUT /v3/tags/:id', function () {

    it('should update the tag', function () {
      const updateItem = {
        'name': 'Updated Name'
      };
      let data;
      return Tag.findOne().select('id name').where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/tags/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'name', 'userId');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateItem.name);
          expect(res.body.userId).to.equal(testUser.id);
        });
    });


    it('should respond with a 400 for an invalid ID', function () {
      const updateItem = {
        'name': 'Blah'
      };
      const badId = '99-99-99';
      const spy = chai.spy();
      return chai.request(app)
        .put(`/v3/tags/${badId}`)
        .send(updateItem)
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an ID that does not exist', function () {
      const updateItem = {
        'name': 'Blah'
      };
      const spy = chai.spy();
      return chai.request(app)
        .put('/v3/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .send(updateItem)
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function () {
      const updateItem = {
        'foo': 'bar'
      };
      const spy = chai.spy();
      return chai.request(app)
        .put('/v3/tags/9999')
        .send(updateItem)
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

  });

  describe('DELETE /v3/tags/:id', function () {

    it('should delete an item by id', function () {
      return Tag.findOne().select('id name').where({'userId': testUser._id})
        .then(data => {
          return chai.request(app).delete(`/v3/tags/${data.id}`).set('authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
        });
    });

    it('should respond with a 404 for an ID that does not exist', function () {
      const spy = chai.spy();
      return chai.request(app)
        .delete('/v3/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .set('authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(404);
        });
    });

  });

});
