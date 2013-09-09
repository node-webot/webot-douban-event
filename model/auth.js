var bcrypt = require('bcrypt');
var crypto = require('crypto');
var util = require('util');
var utils = require('../lib/utils');
var mongo = require('../lib/mongo');
var conf = require('../conf');
var consts = require('./consts');

var Model = mongo.Model;
var extend = utils.extend;

function AuthToken(info) {
  if (!(this instanceof AuthToken)) {
    return new AuthToken(info);
  }
  var self = this;

  extend(self, info);
}

util.inherits(AuthToken, Model);
extend(AuthToken, Model);

AuthToken.prototype.kind = AuthToken.kind = 'auth_token';
AuthToken.prototype._collection = AuthToken._collection = consts.AUTHTOKEN_COLLECTION;

/**
 * Generate new auth token from a user_id
 */
AuthToken.generate = function(user_id, type, callback) {
  if (typeof type === 'function') {
    type = type || 'wechat';
    callback = type;
  }

  var token = AuthToken({
    type: type,
    user_id: user_id,
    _id: generate_token(user_id, type)
  });
  token.save(function(err) {
    if (err) return callback(err);
    callback(null, this);
  });
};

AuthToken.prototype.toJSON = function() {
  var self = this;
  return {
    _id: self._id,
    user_id: self.user_id,
    type: self.type,
  };
};

AuthToken.prototype.connect_url = function() {
  return conf.site_root + 'auth/connect/' + this._id;
};

function generate_token(user_id, type) {
  return crypto.createHash('md5')
         .update(user_id + '::' + type + '//' + bcrypt.genSaltSync(10))
         .digest('hex');
}

module.exports = AuthToken;
