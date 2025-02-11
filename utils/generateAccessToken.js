const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(user, 'xyzabc', { expiresIn: '2h' });
};

module.exports = generateAccessToken;
