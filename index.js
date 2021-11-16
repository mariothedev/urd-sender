const express = require("express");
const CronJob = require('cron').CronJob;
const bodyParser = require('body-parser');
require('dotenv').config()
const app = express();

const { fetchWordsFromNotion, updateWordsInNotion } = require("./services/notion");
const { grabRandomWord } = require("./utils")
const { sendViaSMS, MessagingResponse, validateAnswer } = require("./services/twilio")


app.use(bodyParser.urlencoded({ extended: false }));


let wordsList, wordToShow;

const updateWords = async () => {
  wordsList = await fetchWordsFromNotion();
  wordToShow = wordsList.length ? grabRandomWord(wordsList) : "No words found on Notion to pull from."
}

updateWords();


// Runs a cron job every 90 minutes, between 07:00 AM and 07:59 PM, everyday 
const cron = new CronJob('*/60 7-19 * * *', async () => {
  
 await updateWords(); 
 sendViaSMS(wordToShow);

}, null, true, 'Europe/Oslo');
cron.start();



app.get("/", ({ res }) => res.end("Urd sender v0.01"))


app.post("/sms", async (req, res) => {

  if(!wordToShow.correct) {
    return res.end()
  }
  
  const twiml = new MessagingResponse();

  let feedback; 
  if (req.body.Body.trim().search(/\D/) !== -1 || !req.body.Body) {
    feedback = "Empty or non-numeric answer was received. Please make sure answer is numeric and between numbers 1-3 only.";  
  } else {

    feedback = validateAnswer(req.body.Body.trim(), wordToShow.correct);
    await updateWordsInNotion("Riktig svar!" === feedback ? 1 : 0, wordToShow);
    await updateWords()
  }

  twiml.message(feedback);
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

});



app.listen(5000, () => console.log("http://localhost:5000"))
