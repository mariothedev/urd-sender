const accountSid = process.env.TWILIO_ACCOUNT_ID;
const authToken = process.env.TWILIO_ACCOUNT_AUTHTOKEN;
const client = require('twilio')(accountSid, authToken);
let scrambleRes = "";

const scrambleAnswers = (correct, wrong_answer_1, wrong_answer_2) => {

  const sort = [correct, wrong_answer_1, wrong_answer_2].sort(() => Math.random() - 0.5)

  scrambleRes = `1.${sort[0]}\n2.${sort[1]}\n3.${sort[2]}`
  return scrambleRes
}

module.exports.MessagingResponse = require('twilio').twiml.MessagingResponse;

module.exports.sendViaSMS = (word) => {
  client.messages
    .create({
      body: typeof word === 'string' ? word : `Urd:${word.name}\nRiktig svar?\n${scrambleAnswers(word.correct, word.wrong_answer_1, word.wrong_answer_2)}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER
    })
    .then(message => {
      console.log("message was sent to receiver", message, word);
      if (!message) console.log("Error: sms message was not received by the receiver. Sent to wrong number?");
      console.log(message.sid)
    })
    .catch(e => {
      console.log("Error with sending sms: ", e)
    })
}

module.exports.validateAnswer = (numbericAnswer, correctAnswer) => {

  const sanitizeAnswer = (numberCode) => {

    const rawWord = scrambleRes.match(`${numberCode}.*`);

    const word = rawWord.toString().replace(/(1|2|3)\D/i, '');

    return word;

  }

  if (sanitizeAnswer(numbericAnswer) === correctAnswer) {
    return "Riktig svar!"
  } else {
    return `Feil svar! Riktig svar: ${correctAnswer}`
  }
}
