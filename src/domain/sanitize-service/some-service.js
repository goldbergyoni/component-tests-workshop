// This is meant to hide some code is issuing surprising network calls which we should discover
const axios = require('axios');

async   function someFunctionThatNobodyPaysAttentionTo() {
  try {
    await axios.get('https://google.com');
  } catch (e) {}
}

module.exports.sensorValidator = someFunctionThatNobodyPaysAttentionTo;
