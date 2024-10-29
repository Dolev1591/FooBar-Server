const net = require('net');
const { search } = require('../routes/user');


const serverAddress = process.env.TCP_IP_ADDRESS;
const serverPort = process.env.TCP_PORT;
// The function to extract the urls from the postText and send them to checkInBloom function
const checkBlacklistedURL = async (postText) => {
  try {
    // The Regex for URL
    const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g;
    const urls = postText.match(urlRegex) || []; // Extract all URLs from postText

    // Return false immediately when the urls list is empty
    if (urls.length === 0) {
      return false;
    }

    else if (urls && urls.length > 0) {

       // Iterate over each URL and check if it's blacklisted
      const responses = await Promise.all(urls.map(url => callSearch(url)));

      return responses.some(response => response === true);


    }
  } catch (error) {
    throw error;
  }
};

const callSearch = async (urlToCheck) => {
  return await checkInBloom(urlToCheck);
}

// The function the receives the URLs and send them to the BF
const checkInBloom = async (url) => {
  try {
    return new Promise((resolve, reject) => {
      // Create a new TCP client connection
      const client = net.createConnection({ host: serverAddress, port: serverPort }, () => {
        console.log('Connected successfully to the TCP server');
        client.write(`2 ${url.trim()}`); 
      });
      // Handle data received
      client.on('data', (data) => {
        const dataResponse = data.toString().trim();
        console.log('received data from TCP: ', dataResponse);
        client.destroy();
        resolve(dataResponse === "true");

      // Handle errors
      client.on('error', (err) => {
        reject(err);
      });

      // Handle disconnection
      client.on('end', () => {
        console.log('Disconnected from server');
        client.destroy();
      });
      });


    });

  } catch (error) {
    throw error;
    }
};


module.exports = {checkBlacklistedURL, checkInBloom};


