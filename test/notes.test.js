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
const Note = require('../models/note');
const Folder = require('../models/folder');
const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');


const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

let token;

describe('Noteful API - Notes', function () {
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
    const noteInsertPromise = Note.insertMany(seedNotes);
    const folderInsertPromise = Folder.insertMany(seedFolders);
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

    return Promise.all([userPasswordPromise, userCreatePromise, noteInsertPromise, folderInsertPromise])
      .then(() => {
        return Note.createIndexes();
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


  describe('GET /v3/notes', function () {
    
    it('should return the correct number of Notes', function () {
      const dbPromise = Note.find().where({'userId': testUser._id});
      const apiPromise = chai.request(app).get('/v3/notes').set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct right fields', function () {
      const dbPromise = Note.find().where({'userId': testUser._id});
      const apiPromise = chai.request(app).get('/v3/notes').set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.include.keys('id', 'title', 'content', 'created');
          });
        });
    });

    it('should return correct search results for a searchTerm query', function () {
      const term = 'gaga';
      const dbPromise = Note.find(
        { $text: { $search: term } },
        { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .where({'userId': testUser._id});
      const apiPromise = chai.request(app).get(`/v3/notes?searchTerm=${term}`).set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.an('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should return correct search results for a folderId query', function () {
      let data;
      return Folder.findOne().select('id name').where({'userId': testUser._id})
        .then((_data) => {
          data = _data;
          const dbPromise = Note.find({ folderId: data.id }).where({'userId': testUser._id});
          const apiPromise = chai.request(app).get(`/v3/notes?folderId=${data.id}`).set('authorization', `Bearer ${token}`);
          return Promise.all([dbPromise, apiPromise]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      const dbPromise = Note.find({ title: { $regex: /NotValid/i } }).where({'userId': testUser._id});
      const apiPromise = chai.request(app).get('/v3/notes?searchTerm=NotValid').set('authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

  });

  describe('GET /v3/notes/:id', function () {

    it('should return correct notes', function () {
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/v3/notes/${data.id}`).set('authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'created', 'folderId', 'tags');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(data.userId.toString()).to.equal(testUser.id);
        });
    });

    it('should respond with a 400 for improperly formatted id', function () {
      const badId = '99-99-99';
      const spy = chai.spy();
      return chai.request(app)
        .get(`/v3/notes/${badId}`)
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

    it('should respond with a 404 for an invalid id', function () {
      const spy = chai.spy();
      return chai.request(app)
        .get('/v3/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
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

  describe('POST /v3/notes', function () {
    
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let body;
      return chai.request(app)
        .post('/v3/notes')
        .send(newItem)
        .set('authorization', `Bearer ${token}`)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content', 'userId');
          expect(body.userId).to.equal(testUser.id);
          return Note.findById(body.id);
        })
        .then(data => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
          expect(body.userId).to.equal(data.userId.toString());
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      const spy = chai.spy();
      return chai.request(app)
        .post('/v3/notes')
        .send(newItem)
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
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should respond with a 500 for a incorrect user folder', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'folderId': '111111111111111111111103'
      };
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(() => {
        })
        .catch(err => {
          expect(err.response).to.have.status(500);
        });
    });

    it('should respond with a 500 for a incorrect user tags', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'tags': [
          '222222222222222222222202',
          '222222222222222222222203'
        ]
      };
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(() => {
        })
        .catch(err => {
          expect(err.response).to.have.status(500);
        });
    });

  });

  describe('PUT /v3/notes/:id', function () {

    it('should update the note', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'userId');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
          expect(res.body.userId).to.equal(testUser.id);
        });
    });

    it('should respond with a 400 for improperly formatted id', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      const badId = '99-99-99';
      const spy = chai.spy();
      return chai.request(app)
        .put(`/v3/notes/${badId}`)
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

    it('should respond with a 404 for an invalid id', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      const spy = chai.spy();
      return chai.request(app)
        .put('/v3/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
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

    it('should respond with a 500 for a incorrect user folder', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'folderId': '111111111111111111111103'
      };
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(() => {
        })
        .catch(err => {
          expect(err.response).to.have.status(500);
        });
    });

    it('should respond with a 500 for a incorrect user tags', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'tags': [
          '222222222222222222222202',
          '222222222222222222222203'
        ]
      };
      let data;
      return Note.findOne().select().where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/v3/notes/${data.id}`)
            .send(updateItem)
            .set('authorization', `Bearer ${token}`);
        })
        .then(() => {
        })
        .catch(err => {
          expect(err.response).to.have.status(500);
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
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('DELETE  /v3/notes/:id', function () {

    it('should delete an item by id', function () {
      let data;
      return Note.findOne().select('id title content').where({'userId': testUser._id})
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/v3/notes/${data.id}`).set('authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const spy = chai.spy();
      return chai.request(app)
        .delete('/v3/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
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
