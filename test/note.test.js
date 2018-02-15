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
          expect(res.body[0]).to.have.keys('id', 'title', 'content', 'created');
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
          expect(res.body).to.have.keys('id', 'title', 'content', 'created');

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
    it('should create and return new note', () => {
      const newNote = {
        'title': 'The newest note on the block',
        'content': 'Yo whats up',
        'tags': []
      };

      let body;

      return chai.request(app)
        .post('/v3/notes')
        .send(newNote)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
        })
        .then(data => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing title from new note', () => {

    });

  });

  describe('PUT /v3/notes', () => {
    it('should update and return note', () => {

    });

    it('should return an error with incorrect id', () => {

    });

    it('should return an error when missing title from note', () => {

    });
  });

  describe('DELETE /v3/notes', () => {
    it('should delete a note with correct id', () => {

    });

    it('should return an error with an invalid id', () => {

    });
  });

}); 



