// This is meant to hide some code is issuing surprising network calls which we should discover
const axios = require('axios');

async function someFunctionThatNobodyPaysAttentionTo() {
     await axios.get('https://google.com');
}

module.exports.sensorValidator = someFunctionThatNobodyPaysAttentionTo;
