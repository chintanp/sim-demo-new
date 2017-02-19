// result model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var passportLocalMongoose = require('passport-local-mongoose');


var Result = new Schema({
  username: String,
  current: { type: Number }, 
  time : { type : Number }, 
  data : []
});

//Result.plugin(passportLocalMongoose);

module.exports = mongoose.model('results', Result);