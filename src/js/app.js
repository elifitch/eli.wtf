'use strict';


console.log('Hello, eli.wtf');

const dateDisplayEl = document.createElement('div');
dateDisplayEl.innerHTML = new Date();
document.body.appendChild(dateDisplayEl);

const $ = require('jquery');
const foundation = require('foundation-sites');

$(document).foundation();
