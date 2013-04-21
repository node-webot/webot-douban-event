var pwd = process.cwd();
var user = require(pwd + '/lib/user');

var douban = require(pwd + '/lib/douban');

module.exports = {
  'handler': function(info, next) {
    var uid = info.from;
    var u = user(uid);

    // is waiting for user to reply a city name
    var want_city = info.session.want_city;
    var loc = info.param['loc'];

    if (want_city && loc) {
      delete info.session.want_city;
      u.setLoc(loc);
      var q = info.session.q;
      var type = info.session.type;
      if (type && !q) {
        info.ended = true;
        return douban.list({ loc: loc, type: type }, next);
      } else if (q) {
        //info.param['type'] = type;
        info.param['q'] = q;
        info.ended = true;
        return douban.search(info.param, next);
      }
    }
    next();
  }
};
