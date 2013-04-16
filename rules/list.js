var pwd = process.cwd();

var douban = require(pwd + '/lib/douban');

module.exports = {
  'pattern': function(info) {
    return !info.param['q'] && !info.cmd;
  },
  'handler': function(info, next) {
    var loc = info.param['loc'];
    if (!loc) return next('CITY_404');

    info.ended = true;

    var param = info.param;
    douban.list(param, function(err, ret) {
      if (!param.start && ret && ret.length != param._total) {
        info.has_more = true;
      }
      next(err, ret);
    });
  }
}
