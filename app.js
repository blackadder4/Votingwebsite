const Joi = require('joi');
const { response } = require('express');
const express = require('express')
const app = express();
const Mongoose = require('mongoose');
const db = Mongoose.connection
const survey = require('./survey_schema')
const vote = require('./vote_schema')
db.on('error',(error) => console.error(error))
db.once('open',() => console.log("Connect to DB"))
// the default page for the normal home page
app.use(express.json())
Mongoose.connect('mongodb://localhost/surveyes', ()=>{
    console.log("established connection to the local server");
},
e=> console.error(e))

app.get('/', (req,res) => {
    res.send("welcome to the survey website")
});
// set default port 3000 but also check env
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log("Server active on port 3000 or custom port")
});
// here is a list of ultilities function that I have written
//return the survey object if found in db
async function find_survey(given_title){
    try{
        // find result where title is the given title
        const result = await survey.find({title : given_title})
        return result;
    }
    catch (e){
        console.log(e.message)
    }
}
// return array of surveys that the user made
async function survey_by_user(username){
    //return where author is username and is not a vote
    return survey.find({author : username}).where({is_vote : false})
}
// the function to see all the votes casted to a specific survey is in the survey schema
//list all active survey
async function active_survey(){
    return survey.find({is_vote : false}).where({hidden : false})
}

// set a survey from unpublished to published
async function publish(title){
    const U_survey = find_survey(title)  // find the survey with the title
    if(!U_survey){ // if it is not hit then you close
        return;
    }
    U_survey.hidden = true;
    //save change
    await U_survey.save();
}

// loops through the options of the survey, return an array of object with votes
async function histagram (Survey_title){
    histagram = []
    const U_survey = find_survey(Survey_title)  // find the survey with the title
    if(!U_survey){ // if it is not hit then you close
        return;
    }
    for(let i = 0; i < U_survey.options.length; i++){
        // find votes where title is 
      let j = survey.find({is_vote : true}).where({title : Survey_title ,answer: U_survey.options.at(i)}).length
      let Pillar = U_survey.options.at(i) + " " + j
      histagram.push(Pillar)
    }
    //supply the array of ints that have the votes on each item
    return histagram;
}
// not really needed but since mongoose's check is pretty loose I added these
function validateSurveyes(survey){
    const schema = {
        title:  Joi.string.min(3).required(), 
        author: Joi.string.min(3).required(),
        body:   Joi.string.min(10).required(),
        date: {type : Joi.date(),default : Joi.date().required},
        end_date: {type : Joi.date()},
        hidden: Joi.boolean().required(),
        meta: {
            votes: Joi.number().required
        }
    };
    return Joi.validate(survey,schema);

}
function validateAnswer(answer){
    const schema = {
        title: Joi.string.min(3).required(),
        answer : Joi.string().required(),
        is_vote : Joi.boolean().required()
    }
    return Joi.validate(answer,schema);
}


// this survey end points list all the avaliable surveys
app.get('/api/survyes',(req,res)=>{
    // pass all the survey as return
    res.send(survey.find());
})
// this survey:id end points supply the specific info on page
app.get('/api/surveys/:id', (req,res) =>{
    // find the specific survey that the user is requesting from title
    const hits = find_survey(req.body.title);
    if(!hits) res.status(404).send('no item match criteria')
    res.send(hits);
});

app.post('/api/survyes',(req,res) => {
    // validate the survey via joi
    const result = validateSurveyes(req.body,schema);
    console.log(result);
    if(!req.body.title || !req.body.author || result.error){
        // validate the request
        res.status(400).send("request is bad")
        return;
    }
    const User_Survey = new survey({title: req.body.title, author: req.body.author, body: req.body.body,date: req.body.date,end_date : req.body.end_date,options : req.body.options,hidden:req.body.hidden, meta : {votes : 0}});
    //after it is valid you create a new survey schema, with the supplied data
    User_Survey.save().then(()=>console.log("New Survey created"))
    res.send(req.body)
})

// this handles the voting aspect
app.post('/api/votes',(req,res) => {
    // if Survey exist
    // if not give 404

    // then validate, it can either be true or false
    // if bad then give 404

    const hits = find_survey(req.body.title)
    if(!hits){ 
        res.status(404).send('no item match criteria')
        return;
    }
    const result = validateAnswer(req.body);
    if(result.error){
        res.status(400).send("bad answer");
        return;
    }
    // making sure that the result for answer is in the options catalog
    // validate the options the user selected is legal
    // if all passed then create new vote object
    const user_vote = new vote({title : req.body.title, author : req.body.author, answer : req.body.answer, is_vote : true})
    user_vote.save().then(()=>console.log("Your vote is casted"))
    res.send("success");
})
// updating the body of the survey
app.put('/api/surveyes/:id', (req,res) => {
    const result = find_survey(req.body.title)
    if(!result){
        res.status(400).send("survey you are trying to update is not found")
    }
    // if the survey exists
    //set new body to req's body
    result.body = req.body.body
    result.save();
    res.send(result)

})


app.delete('/api/surveyes/:id',(req,res)=>{
    const hits = find_survey(req.body.title)
        if(!hits) {
        res.status(404).send('no item match criteria')
        return;
    }
    // if found then we can delete it
    survey.findOneAndDelete({title : req.body.title})
    //acknowledge the item is killed
    res.send(req.body.title)

})