var Memcached = require('memcached');
var Store = require('express').session.Store;

var conf = require('../conf');
var error = require('debug')('weixin:mc:error');

var mc = new Memcached(conf.memcached.hosts, conf.memcached.options);

mc.on('issue', function(issue) {
  console.log(issue);
  error('MemcachedStore::Issue @ ' + issue.server + ': ' +
  issue.messages + ', ' + issue.retries + ' attempts left');
});

// One day in seconds.
var oneDay = 86400;

var uid_count = 0;
function uuid() {
  return 'id' + uid_count++;
};

function MemObj() {
  var args = Array.prototype.slice.apply(arguments);
  if (args.length == 0) args[0] = uuid();
  this.client = mc;
  this._key = args;
}
MemObj.prototype.__proto__ = Store.prototype;

MemObj.prototype.get = function(sid, fn) {
  var self = this;
  var sid = self._key.concat(sid).join(':');
  self.client.get(sid, function(err, data) {
    try {
      if (!err && !data) return fn && fn();
      fn && fn(null, JSON.parse(data.toString()));
    } catch (e) {
      fn && fn(err || e);
    }
  });
};
MemObj.prototype.set = function(sid, sess, fn) {
  var self = this;
  var sid = self._key.concat(sid).join(':');

  try {
    var maxAge = sess && sess.maxAge;
    var ttl = 'number' === typeof maxAge ? maxAge / 1000 | 0 : 0;
    if (sess) delete sess.maxAge;

    sess = JSON.stringify(sess);

    self.client.set(sid, sess, ttl, function() {
      fn && fn.apply(self, arguments);
    });
  } catch (err) {
    console.error(err.stack);
    fn && fn(err);
  }
};
MemObj.prototype.destroy = MemObj.prototype.del = function(sid, fn) {
  var sid = this._key.concat(sid).join(':');
  this.client.del(sid, fn);
};

module.exports.MemObj = MemObj;
module.exports.mc = mc;
