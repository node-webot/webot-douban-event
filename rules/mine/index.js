module.exports = function(webot) {

var require_login = require('../utils').require_login;

webot.domain('mine', require_login);

webot.loads('bind', 'action', 'list');

};
