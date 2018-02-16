'use strict';

const app = require('../server');
const chai = require('chai');
const chaiSpies = require('chai-spies');
const chaiHTTP = require('chai-http');
const expect = chai.expect;

const mongoose = require('mongoose');
const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders'); 

chai.use(chaiHTTP);
chai.use(chaiSpies);

describe('Noteful API - Folders', () => {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /v3/folders', () => {
    it('should get all the folders', () => {
      const db = Folder.find();
      const api = chai.request(app).get('/v3/folders');

      return Promise.all([db, api])
      .then(([data, res]) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(data.length);
      });
    });
  });

  describe('GET /v3/folders/:id', () => {
    it('should return correct notes', function () {
      let data;
      return Folder.findOne().select('id name')
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/v3/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });
  


    it('should return an error for invaild id', () => {
      const badId = '99-99-99';
      const spy = chai.spy();
      return chai.request(app)
        .get(`/v3/folders/${badId}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('This `id` is not valid');
        });
    });

    it('should return 400 for incorrect id', () => {
      const spy = chai.spy();
      return chai.request(app)
        .get('/v3/folders/111')
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(400);
        });
    });
  });

  describe('POST /v3/folders', () => {
    //create a new folder
    //error if missing name
    //error if folder name already exists - 400
  });

  describe('PUT /v3/folders/:id', () => {
    //update folder
    //error if folder name is missing
    it('should respond with a 400 for improperly formatted id', function () {
      const updateItem = {
        'name': 'Hello I am a new Folder'
      };
      const badId = '7896-4578956-456';
      const spy = chai.spy();
      return chai.request(app)
        .put(`/v3/folders/${badId}`)
        .send(updateItem)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('This `id` is not valid');
        });
    });
    //error if not folder with matching id is found
    //error if folder name already exists
  });

  describe('DELETE /v3/folders/:id', () => {
    //delete note
    //error if try to deelte folder with notes
    //error if bad id
    //error if invalid id
  });

});