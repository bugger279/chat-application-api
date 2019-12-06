const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib');
const token = require('../libs/tokenLib');
const AuthModel = require('../models/Auth');

/* Models */
const UserModel = mongoose.model('User')

/* Get all user Details */
let getAllUser = (req, res) => {
    UserModel.find()
        .select(' -__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getAllUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller: getAllUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}
// end get all users

/* Get single user details */
let getSingleUser = (req, res) => {
    UserModel.findOne({ 'userId': req.params.userId })
        .select('-password -__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getSingleUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller:getSingleUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}
// end get single user

let deleteUser = (req, res) => {
    UserModel.findOneAndRemove({ 'userId': req.params.userId }).exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: deleteUser', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: deleteUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the user successfully', 200, result)
            res.send(apiResponse)
        }
    });// end user model find and remove
}
// end delete user

let editUser = (req, res) => {

    let options = req.body;
    UserModel.update({ 'userId': req.params.userId }, options).exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller:editUser', 10)
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User details edited', 200, result)
            res.send(apiResponse)
        }
    });// end user model update
}
// end edit user

// start user signup function 
let signUpFunction = (req, res) => {
    // validate user input
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null);
                    reject(apiResponse);
                } else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, 'password parameter is missing', 400, null);
                    reject(apiResponse);
                } else {
                    resolve(req);
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        })
    }

    // Create new user after  validating users input

    let createUser = () => {
        return  new Promise ((resolve, reject) => {
            UserModel.findOne({email: req.body.email})
                .exec((err, retreivedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10);
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(retreivedUserDetails)) {
                        console.log(req.body);
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            email: req.body.email.toLowerCase(),
                            mobileNumber: req.body.mobileNumber,
                            password: passwordLib.hashpassword(req.body.password),
                            createdOn: time.now()
                        });
                        
                        newUser.save((err, newUser) => {
                            if (err) {
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj);
                            }
                        });
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4);
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null);
                        reject(apiResponse);
                    }
                })
        })
    }

    // End of create User

    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            console.dir(resolve);
            delete resolve.password;
            let apiResponse = response.generate(false, 'User created', 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}
// end user signup function 

// start of login function 
let loginFunction = (req, res) => {
    // find User
    let findUser = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                // Check if email is present or not
                console.log(req.body);
                UserModel.findOne({email: req.body.email}, (err, userDetails) => {
                    if (err) {
                        // Handle Error
                        // Database Error
                        logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10);
                        /* generate the error message and the api response message here */
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(userDetails)) {
                        // if No users with that email found
                        logger.error('No User Found', 'userController: findUser()', 7);
                        let apiResponse = response.generate(true, 'No User Details Found', 404, null);
                        reject(apiResponse);
                    } else {
                        // If user found Sucessfully!!
                        logger.info('User Found', 'userController: findUser()', 10);
                        resolve(userDetails);
                    }
                });
            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null);
                reject(apiResponse);
            }
        })
    }

    // Validate Password
    let validatePassword = (retreivedUserDetails) => {
        console.log(retreivedUserDetails);
        return new Promise ((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error(err.message, 'userController: validatePassword()', 10);
                    let apiResponse = response.generate(true, 'Login Failed', 500, null);
                    reject(apiResponse);
                } else if (isMatch) {
                    let retreivedUserDetailsObj = retrievedUserDetails.toObject();
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    // Deteleting unnecessat data then resolving it
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10);
                    let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null);
                    reject(apiResponse);
                }
            })
        })
    }

    // generate Token
    let generateToken = (userDetails) =>  {
        return new Promise ((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }

    // Save Token
    let saveToken = (userDetails) => {
        console.log(userDetails);
        return new Promise ((resolve, reject) => {
            AuthModel.findOne({userId: tokenDetails.userId}, (err, retreivedTokenDetails) => {
                if (err) {
                    console.log(err.message, 'userController: saveToken', 10)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse);
                } else if(check.isEmpty(retreivedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.authToken,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    });
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody);
                        }
                    });                    
                } else  {
                    retreivedUserDetails.authToken = tokenDetails.authToken;
                    retreivedUserDetails.tokenSecret = tokenDetails.tokenSecret;
                    retreivedUserDetails.tokenGenerationTime = time.now();
                    retreivedUserDetails.save((err, newTokenDetails) => {
                        if (err) {
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)                            
                        }
                    });
                }
            })            
        })
    }

    // calling promises
    findUser(req, res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) =>  {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("Login Function errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}
// end of the login function 

// Start logout function
let logout = (req, res) => {
    // Delete UserId from Authomodel
    AuthModel.findOneAndRemove({}, (err, result) => {
        if (err) {
            logger.error(err.message, 'user Controller: logout', 10)
            let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Logged Out Successfully', 200, null)
            res.send(apiResponse)
        }
    });
}
// end of the logout function.


module.exports = {
    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout
}// end exports