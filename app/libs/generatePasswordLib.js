const bcrypt = require('bcrypt');
const saltRounds = 10;

// For Logging details
const logger = require('./../libs/loggerLib');

let hashpassword = (plainPasswordText) => {
    let salt = bcrypt.genSaltSync(saltRounds);
    let hash = bcrypt.hashSync(plainPasswordText, salt);
    return hash;
}

let  comparePassword = (oldPassword, hashPassword, cb) => {
    bcrypt.compare(oldPassword, hashPassword, (err, res) => {
        if (err) {
            logger.error(err.message, 'Comparison Error', 5);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
}

module.exports = {
    hashpassword: hashpassword,
    comparePassword: comparePassword,
}