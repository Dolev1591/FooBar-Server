const jwt = require('jsonwebtoken');
const key = process.env.SECRET_KEY;
//a middleware to check if the token is valid
const isValidToken= (req, res, next) => {
    // If the request has an authorization header
    if (req.headers.authorization) {
    // Extract the token from that header
    const token = req.headers.authorization.split(" ")[1];
    try {
    // Verify the token is valid
    const data = jwt.verify(token, key);
    // Token validation was successful. Continue to the actual function (index)
    return next()
    } catch (err) {
        res.status(500).send('Internal server error');
    }
    }
    else {
    return res.status(403).send('Token required');
    }
}
    module.exports = isValidToken;
