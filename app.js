const { fileURLToPath } = require('url');
const path = require('path'); // Import the path module

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const net = require('net');


var app = express();

// Middleware setup
app.use(bodyParser.urlencoded({limit: '20mb',extended: true}));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(cors());
app.use(express.static('public'));

// Connecting to the MongoDB server
process.env.NODE_ENV = 'local';
const customEnv = require('custom-env');
customEnv.env(process.env.NODE_ENV, './config');
console.log(process.env.CONNECTION_STRING);
console.log(process.env.PORT);
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Connect to the TCP server:
// Define the TCP server address and port
const serverAddress = process.env.TCP_IP_ADDRESS;
console.log('hop hop');
console.log(serverAddress)
const serverPort = process.env.TCP_PORT;
console.log('hop hop');
console.log(serverPort)

// // Function to add a url to the BloomFilter
// const addURLToBF = (url) => {
//   // Create a new TCP client
//   const client = net.createConnection({ host: serverAddress, port: serverPort }, () => {
//     // Once connected, you can send messages to the server
//     console.log('Connected to TCP server');
//     console.log('adding the following URL:', url);
//     client.write(`1 ${url.trim()}`); // Send message to the server to add the URL to the Bloom filter
//   });
//   // Listen for data from the server
//   client.on('data', (data) => {
//     console.log('Received data from server:', data.toString());
//   });

//   // Handle errors
//   client.on('error', (err) => {
//     console.error('Error:', err);
//   });

//   // Handle disconnection
//   client.on('end', () => {
//     console.log('Disconnected from server');
//     client.end();
//   });

// }


// const splitURLS = () => {
//     // Add blacklisted URLs to the Bloom filter
//     const blacklistedUrls = process.env.BLACKLISTED_URLS.split(',');
//     console.log('URLS TO BF: ' , blacklistedUrls);
//     blacklistedUrls.forEach(url => {
//       addURLToBF(url);
//     });
// }



// // Create a new TCP client
// const client = net.createConnection({ host: serverAddress, port: serverPort }, () => {
//   // Once connected, you can send messages to the server
//   console.log('Connected to TCP server');

// // Add blacklisted URLs to the Bloom filter
// const blacklistedUrls = process.env.BLACKLISTED_URLS.split(',');
// console.log('URLS TO BF: ' , blacklistedUrls);
// for (const url of blacklistedUrls) {
//   // const message = `1 ${url}`; // Append newline character to separate messages
//   console.log('adding the following URL:', url);
//   client.write(`1 ${url.trim()}`); // Send message to the server to add the URL to the Bloom filter
// }

// });

// splitURLS();

// Define and mount routes
const users = require('./routes/user');
const login = require('./routes/login');
const posts = require('./routes/post');
app.use('/api/users', users);
app.use('/api/tokens', login);
app.use('/api/posts', posts);


// Serve index.html for all routes
app.get('*', (req, res) => {
  // Remove the explicit declaration of __dirname
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Start the server on the specified port
app.listen(process.env.PORT);
