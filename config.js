var nconf = require('nconf');

nconf.env().argv();

nconf.defaults({
});

module.exports = nconf;
