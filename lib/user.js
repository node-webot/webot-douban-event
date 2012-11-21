var memcached = require('./memcached');
var mc = memcached.mc;
var MemObj = memcached.MemObj;

function User(uid) {
  this.uid = uid;
  this._cache = new MemObj('user', uid);
}

User.prototype.getLoc = function(fn) {
  var self = this;
  if (self.loc_id && fn) return fn(null, self.loc_id);
  return this._cache.get('loc', function(err, res) {
    if (res) {
      self.loc_id = res;
    } else {
      res = null;
    }
    fn && fn.call(self, err, res);
  });
};
User.prototype.setLoc = function(loc, fn) {
  if (!loc) return;
  this.loc_id = loc;
  return this._cache.set('loc', loc, fn);
};
User.prototype.getProp = function(n, fn){
  return this._cache.get(n, fn);
};
User.prototype.setProp = function(n, v, fn){
  return this._cache.set(n, v, fn);
};
User.prototype.getPrev = function(fn){
  return this._cache.get('prev', fn);
};
User.prototype.setPrev = function(n, v, fn){
  v['_wx_act'] = n;
  v['maxAge'] = v['maxAge'] || 120000; // 2 minutes
  return this._cache.set('prev', v, fn);
};

module.exports = function(uid) {
  return new User(uid);
};

module.exports.User = User;
