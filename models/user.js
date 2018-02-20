'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String},
  username: { type: String, required: true, unique: true},
  password: { type: String, required: true }
});

userSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
  }
});

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);