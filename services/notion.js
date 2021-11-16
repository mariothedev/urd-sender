const { Client } = require("@notionhq/client")
const axios = require('axios').default;

const databaseId = process.env.NOTION_DB_ID

const notion = new Client({
  auth: process.env.NOTION_AUTHTOKEN
});

module.exports.updateWordsInNotion = async (feedback, {id, attempts : raw_attempts }) => {

  const att = JSON.parse(raw_attempts);

  att.push(feedback);

  axios({
    method: "PATCH",
    url: `https://api.notion.com/v1/pages/${id}`,
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_AUTHTOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2021-08-16",
    },
    data: {
      "properties" : {
        "attempts": {
          "type": "rich_text",
          "rich_text": [{
            "text": {
              "content": JSON.stringify(att)
            }
          }],
        }
      }
    }
  })
  .then(_ => {
    console.log("Attempts successfully updated on Notion Table.")
  })
  .catch(e => {
    console.log("Error updating Notion Table ", e)
  })

};

module.exports.fetchWordsFromNotion = async () => {

  let fetchedWords = [];

  async function fetchWords(more, next) {

    try {
      if (!more) {
        return;
      }

      const { results, has_more, next_cursor } = await notion.databases.query({ database_id: databaseId, start_cursor: next });

      fetchedWords.push(...results)

      more = has_more;
      next = next_cursor;

      return fetchWords(more, next);

    } catch (e) {
      throw new Error(e);
    }

  }

  await fetchWords(true,).catch((e) => console.log("Error fetching data with Notion API: ",e))

  // map or filter wont fire on empty array
  return fetchedWords
  .filter(({ properties : { name, correct, wrong_1, wrong_2, attempts }}) => {

    if (!name.title.length || !correct.rich_text.length || !wrong_1.rich_text.length || !wrong_2.rich_text.length || !attempts.rich_text.length) {
      return false;
    }
    
    return true;

  })
  .map(({id ,properties: {name, correct, wrong_1, wrong_2, attempts }}) => {
    
    return { 
      name: name.title[0].plain_text.toLowerCase(), 
      correct: correct.rich_text[0].plain_text.toLowerCase(),
      wrong_answer_1: wrong_1.rich_text[0].plain_text.toLowerCase(),
      wrong_answer_2: wrong_2.rich_text[0].plain_text.toLowerCase(),
      attempts: attempts.rich_text[0].plain_text,
      id
    }
  }
  );

};
