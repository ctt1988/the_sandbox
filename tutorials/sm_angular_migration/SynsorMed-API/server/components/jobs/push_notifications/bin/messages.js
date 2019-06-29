'use strict';

var messages = [
    'Please follow your schedule daily.',
    'Did you enter your reading for today?',
    'Please report your readings daily.'
];

module.exports = function(){
    var rand = Math.floor((Math.random() * messages.length));
    if(messages[rand]) return messages[rand];
    return messages[0];
};
