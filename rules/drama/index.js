module.exports = function(webot) {

require('js-yaml');

var require_login = require('../utils').require_login;
webot.domain('drama', require_login);
webot.loads('search', 'collection');


};

