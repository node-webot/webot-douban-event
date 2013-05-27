var pwd = process.cwd();
var user = require(pwd + '/model/user');

var douban = require(pwd + '/lib/douban');

function obj_equal(a, b){
  var k;
  for (k in a) {
    if (a[k] != b[k]) return false;
  }
  return true;
}
var reg_more = /(更多|再来|more|下一页)(?!帮助|\s*help)/i;
module.exports = {
  pattern: function(info) {
    if (!info.text) return;

    var prev_text = info.session.prev_text;
    if (prev_text === info.text) {
      return true;
    } else if (!info.param.q) {
      info.session.prev_text = info.text;
    } else {
      delete info.session.prev_text;
    }

    if (info.text && reg_more.test(info.text)) {
      if (info.param.type || info.param.day_type) {
        info.param['q'] = info.param['q'].replace(reg_more, '');
        return false;
      }
      return true;
    }
    return false;
  },
  handler: function(info, next) {
    var uid = info.uid;
    var u = info.u || user(uid);

    u.getPrev(function(err, res){
      if (err || !res) {
        var loc = u.getLoc();
        if (loc) {
          info.ended = true;
          return douban.list({ loc: loc }, next);
        }
        return next();
      }

      var act = res['_wx_act'];

      if (!act || !(act in douban)) return next();

      try {
        // 实际得到的比想要的少，说明没有更多了
        if (res.count > res._len) {
          info.param.start = 1;
          u.setPrev(null);
          delete res['_wx_act'];
          return next('NO_MORE');
        }

        if (!res.start) {
          res.start = 4;
          res['count'] = 4;
        } else {
          res.start += 4;
        }
        douban[act](res, function(err, res) {
          info.ended = true;
          next(err, res);
        });
      } catch (e) {
        next();
      }
    });
  }
};
