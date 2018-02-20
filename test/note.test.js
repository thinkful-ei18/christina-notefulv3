'use strict';

const app = require('../server');
const chai = require('chai');
const chaiSpies = require('chai-spies');
const chaiHTTP = require('chai-http');
const expect = chai.expect;

const mongoose = require('mongoose');
const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const seedNotes = require('../db/seed/notes'); 

chai.use(chaiHTTP);
chai.use(chaiSpies);



describe('Noteful API - Notes', () => {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes)
      .then(() => Note.ensureIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /v3/notes', () => {
    it('should get all notes', function () {
      const db = Note.find();
      const api = chai.request(app).get('/v3/notes');
  
      return Promise.all([db, api])
        .then(([dbData, apiRes]) => {
          expect(apiRes).to.have.status(200);
          expect(apiRes).to.be.json;
          expect(apiRes.body).to.be.a('array');
          expect(apiRes.body).to.have.length(dbData.length);
        });
    });

    it('should return a list of notes with the correct field', () => {
      const db = Note.find();
      const api = chai.request(app).get('/v3/notes');

      return Promise.all([db, api])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          expect(res.body).to.be.a('array');
          expect(data).to.be.a('array');
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0]).to.have.keys('id', 'title', 'content', 'created', 'folderId', 'tags');
        });
    });

    it('should the correct item for search term', () => {
      const searchTerm = 'cats';
      const db = Note.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
      const api = chai.request(app).get(`/v3/notes?searchTerm=${searchTerm}`);

      return Promise.all([db, api])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should the correct folder for folder search', () => {
      const folderSearch = '111111111111111111111100';
      const db = Note.find({'folderId': folderSearch});
      const api = chai.request(app).get(`/v3/notes?folderId=${folderSearch}`);

      return Promise.all([db, api])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should return an empty array for incorrect search term', () => {
      const searchTerm = 'THISISINCORRECT';
      const db = Note.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
      const api = chai.request(app).get(`/v3/notes?searchTerm=${searchTerm}`);

      return Promise.all([db, api])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

  });

  describe('GET /v3/notes/:id', function () {
    it('should return correct note with id', () => {
      let data;
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
            return chai.request(app).get(`/v3/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created', 'folderId', 'tags');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should return an error for incorrect id', () => {
      const spy = chai.spy();
      return chai.request(app)
        .get('/v3/notes/HELLOHELLOHELLO')
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(400);
        });
    });
  });

  describe('POST /v3/notes', () => {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'I AM A NEW NOTE',
        'content': 'weeeee',
        'folderId': '111111111111111111111101',
        'tags': ['222222222222222222222200']
      };

      let body;
      return chai.request(app)
        .post('/v3/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content', 'folderId', 'tags');
          return Note.findById(body.id);
        })
        .then(data => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing title from new note', () => {
      const newItem = {
        'notTitle': 'wrong'
      };
      const spy = chai.spy();
      return chai.request(app)
        .post('/v3/notes')
        .send(newItem)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('PUT /v3/notes/:id', function () {

    it('should update the note', function () {
      const updateItem = {
        'title': 'ffgfgdf',
        'content': 'fdfdgdfg',
        'tags': ['222222222222222222222202']
      };
      let data;
      return Note.findOneAndUpdate(updateItem).select('id title content')
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'tags');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
        });
    });


    it('should respond with a 400 for an invalid id', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      const spy = chai.spy();
      return chai.request(app)
        .put('/v3/notes/A9-9')
        .send(updateItem)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(400);
        });
    });

    it('should return an error when missing "title" field', function () {
      const updateItem = {
        'foo': 'bar'
      };
      const spy = chai.spy();
      return chai.request(app)
        .put('/v3/notes/9999')
        .send(updateItem)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('DELETE  /v3/notes/:id', function () {

    it('should delete an item by id', function () {
      let data;
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/v3/notes/${data.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const spy = chai.spy();
      return chai.request(app)
        .delete('/v3/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
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



