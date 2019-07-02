var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: String,
    password: String,
    name: String,
    document: String,
    key: String
});

module.exports = mongoose.model('Users', UserSchema);