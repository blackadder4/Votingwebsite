const mongoose = require('mongoose')

const surveySchema = new mongoose.Schema({
  title:  {type : String, required : true, immutable: true }, 
  author: {type : String, required : true,immutable: true },
  body:   String,
  date: { type: Date, default: ()=> Date.now, required: true,immutable: true },
  end_date:{type: Date, default: () => (new Date(Date.now() + (3600*1000* 24)))},
  options: {type : [String], default : ['T','F'],required : true},
  hidden: {type : Boolean, default : false},
  votes: {
    type: Number,default : 0
  },
  is_vote:{type : Boolean, default: false}
});

// loops through the options of the survey, return an array of object with votes
surveySchema.static.histagram =  function (){
    histagram = []
    for(let i = 0; i < this.options.length; i++){
      let j = this.find({is_vote : true}).where({answer: this.options.at(i)}).length
      histagram.push(j)
    }
    //supply the array of ints that have the votes on each item
    return histagram;
}

module.exports = mongoose.model('survey',surveySchema)