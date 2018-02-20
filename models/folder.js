'use strict';


const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
  name: {type: String, 
        required: true,
        unique: true
  }
});


const Folder = mongoose.model('Folder', folderSchema);

folderSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = Folder; 