const express = require('express');
const app = express();

// Nodejs Events available in Core API
const events = require('events');

// We have to create an instance of event emitter
const eventEmitter = new events.EventEmitter();

eventEmitter.on('welcomeEmail', (data) => {
    console.log('Logg s from Events listener');
    console.log(data);
})

app.get('/hiii', (req, res) => {
    var user = { 'name': 'Inder', 'age': 24 };
    res.send('Heiiiiiii!!');
    setTimeout(() => {
        eventEmitter.emit('welcomeEmail', user);
    }, 2000);
});

app.listen(3000, () => {
    console.log('Listening to port 3000');
})