const mongoose = require('mongoose')
//schema for votes
const voteSchema = new mongoose.Schema({ 
  title: {type: String, required : true},
  author:{type: String, required : true},
  answer:{type: String, required : true},
  is_vote:{type: Boolean, default : true}
});

module.exports = mongoose.model('vote',voteSchema)