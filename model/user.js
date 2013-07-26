var util = require('util');
var MemObj = require('../lib/memcached').MemObj;
var utils = require('../lib/utils');
var mongo = require('../lib/mongo');
var consts = require('./consts');

var Model = mongo.Model;
var extend = utils.extend;

function User(info) {
  if (!(this instanceof User)) {
    return new User(info);
  }
  var self = this;

  extend(self, info);

  self._cache = new MemObj('user', self._id);
  self._cache.get('loc', function(err, res) {
    if (res) {
      self.loc = res;
      self.update({ loc: res });
    }
  });
}

util.inherits(User, Model);
extend(User, Model);

User.prototype.kind = User.kind = 'user';
User.prototype._collection = User._collection = consts.USER_COLLECTION;

User.getOrCreate = function(uid, callback) {
  User.get(uid, function(err, item) {
    if (err) return callback(err);
    if (item instanceof User) return callback(null, item);
    callback(null, new User({ _id: uid }));
  });
};

User.prototype.toObject = function() {
  return {
    _id: this._id,
    loc: this.loc,
    access_token: this.access_token || null,
    last_params: {},
  };
};

User.prototype.setLoc = function(loc_id, callback) {
  this.update({ loc: loc_id }, callback);
};

module.exports = User;
