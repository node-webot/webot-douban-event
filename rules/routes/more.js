var pwd = process.cwd();
var user = require(pwd + '/lib/user');

var douban = require(pwd + '/lib/douban');

function obj_equal(a, b){
  var k;
  for (k in a) {
    if (a[k] != b[k]) return false;
  }
  return true;
}
var reg_more = /更多|再来|more|下一页/ig;
module.exports = {
  'pattern': function(info) {
    if (reg_more.test(info.text)) {
      if (info.param.type || info.param.day_type) {
        info.param['q'] = info.param['q'].replace(reg_more, '');
        return false;
      }
      return true;
    }
    return false;
  },
  'handler': function(info, next) {
    var uid = info.from;
    var u = info.u || user(uid);
    var waiter = this.waiter;

    u.getPrev(function(err, res){
      if (err || !res) {
        var loc = u.getLoc();
        if (loc) {
          info.ended = true;
          douban.list({ loc: loc }, next);
        }
        return next();
      }

      var act = res['_wx_act'];

      if (!act || !(act in douban)) return next();

      try {
        info.ended = true;
        // 实际得到的比想要的少，说明没有更多了
        if (res.count > res._len) {
          info.param.start = 1;
          u.setPrev(null);
          return next('NO_MORE');
        }
        delete res['_wx_act'];
        res.start = res.start || 0;
        res.start += 5;
        douban[act](res, next);
      } catch (e) {
        next();
      }
    });
  }
};
