'use strict';

const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title: {type: String, required: true, index: true},
  content: {type: String, index: true},
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  created: {type: Date, default: Date.now}
});

noteSchema.index( { title: 'text', content: 'text' }, {weights: {title: 5, content: 1} } );

noteSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;