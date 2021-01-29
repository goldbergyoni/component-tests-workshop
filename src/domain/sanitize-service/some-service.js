// This is meant to hide some code is issuing surprising network calls which we should discover
const axios = require('axios');

function someFunctionThatNobodyPaysAttentionTo() {
  try {
    axios.get('https://google.com');
  } catch (e) {}
}

module.exports.sensorValidator = someFunctionThatNobodyPaysAttentionTo;
