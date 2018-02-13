'use strict';

const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String},
  created: {type: Date, default: Date.now}
});

noteSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;