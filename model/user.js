var memcached = require('../lib/memcached');
var mc = memcached.mc;
var MemObj = memcached.MemObj;

var people_meta = new MemObj('wx_people_meta');

function User(uid) {
  if (!(this instanceof User)) {
    return new User(uid);
  }
  this.uid = uid;
  this._cache = new MemObj('user', uid);
  this._cache_obj = {};
}

User.prototype.getLoc = function(fn) {
  return this.getProp('loc', fn);
};
User.prototype.setLoc = function(v, fn) {
  return this.setProp('loc', v, fn);
};
User.prototype.getProp = function(n, fn){
  var self = this;
  var obj = self._cache_obj;
  if (n in obj) {
    fn && fn(null, obj[n]);
    return obj[n];
  }
  return this._cache.get(n, function(err, res) {
    if (!err && typeof res !== 'undefined') {
      obj[n] = res;
    }
    fn && fn.call(self, err, res);
  });
};
User.prototype.setProp = function(n, v, fn){
  var self = this;
  var obj = self._cache_obj;
  obj[n] = v;
  this._cache.set(n, v, fn);
  return self;
};
User.prototype.delProp = function(n, fn){
  var self = this;
  delete self._cache_obj[n];
  this._cache.del(n, fn);
  return self;
};
User.prototype.getPrev = function(fn){
  return this.getProp('prev', fn);
};
var ONE_DAY = 3600000 * 24;
User.prototype.setPrev = function(n, v, fn){
  if (n === null) return this.setProp('prev', null, fn);
  v['_wx_act'] = n;
  v['maxAge'] = v['maxAge'] || ONE_DAY;
  return this.setProp('prev', v, fn);
};

User.get_silented = function(fn) {
  people_meta.get('silented', fn);
};

User.set_silented = function(silented, fn) {
  people_meta.set('silented', silented, fn, 3600000);
};
module.exports = User;
