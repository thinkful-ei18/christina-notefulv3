'use strict';

const beautifyUnique = require('mongoose-beautiful-unique-validation');
const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
  name: {type: String, 
        required: true,
        unique: 'There is already a folder named ({VALUE}), please rename'},
});

folderSchema.plugin(beautifyUnique);
const Folder = mongoose.model('Folder', folderSchema);

folderSchema.index( { name: 'text'} );

module.exports = Folder; 