var conf = require('../conf');
var db_prefix = conf.db_prefix || 'wx_';

module.exports = {
  USER_COLLECTION: db_prefix + 'user',
  AUTHTOKEN_COLLECTION: db_prefix + 'auth_token'
};
