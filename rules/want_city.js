var pwd = process.cwd();
var User = require(pwd + '/model/user');

var douban = require(pwd + '/lib/douban');

module.exports = {
  pattern: function(info) {
    return info.session.want_city;
  }, 
  handler: function(info, next) {
    if (!info.text) return next();

    var uid = info.uid;
    var u = User(uid);

    // is waiting for user to reply a city name
    var want_city = info.session.want_city;
    var loc = info.param['loc'];

    if (loc) {
      delete info.session.want_city;
      u.setLoc(loc);

      var rule = info.webot.get(want_city);

      if (rule) {
        info.param.loc = loc;
        info.param.q = info.param.q || info.session.q;
        info.param.type = info.param.type || info.session.type;
        info.ended = true;
        rule.exec(info, next);
        return;
      }
    }
    next();
  }
};
