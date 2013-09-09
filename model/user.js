var util = require('util');
var MemObj = require('../lib/memcached').MemObj;
var utils = require('../lib/utils');
var mongo = require('../lib/mongo');
var consts = require('./consts');
var AuthToken = require('./auth');
var cities = require('../data/cities');

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
Object.defineProperty(User.prototype, 'douban_id', {
  get: function() {
    return this.access_token && this.access_token.douban_user_id;
  }
});
Object.defineProperty(User.prototype, 'name', {
  get: function() {
    return this.access_token && this.access_token.douban_user_name;
  }
});
Object.defineProperty(User.prototype, 'city', {
  get: function() {
    return cities.id2name[this.loc];
  }
});

User.prototype.toJSON = function() {
  return {
    _id: this._id,
    loc: this.loc,
    mtime: this.mtime,
    prev_text: this.prev_text,
    active_lottery: this.active_lottery || null,
    access_token: this.access_token || null,
  };
};

User.prototype.setLoc = function(loc_id, callback) {
  this.update({ loc: loc_id }, callback);
};

User.prototype.make_connect_url = function(fn, type) {
  var self = this;
  AuthToken.generate(self._id, type, function(err, token) {
    fn.call(self, err, token && token.connect_url());
  });
};
User.prototype.douban_url = function() {
  var dou_id = this.douban_id;
  return dou_id ? 'http://www.douban.com/people/' + dou_id + '/' : '';
};

module.exports = User;
