var pwd = process.cwd();

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
    var u = info.user;

    var last_param = info.session.last_param;

    if (!last_param) {
      var loc = u.loc;
      if (loc) {
        info.ended = true;
        return douban.event.list({ loc: loc }, next);
      }
      return next();
    }

    var act = last_param['_wx_act'];

    if (!act || !(act in douban.event)) return next();

    try {
      // 实际得到的比想要的少，说明没有更多了
      if (last_param.count > last_param._len) {
        info.param.start = 1;
        u.setPrev(null);
        delete last_param['_wx_act'];
        return next('NO_MORE');
      }

      if (!last_param.start) {
        last_param.start = 4;
        last_param['count'] = 4;
      } else {
        last_param.start += 4;
      }
      douban.event[act](last_param, function(err, ret) {
        info.ended = true;
        next(err, ret);
      });
    } catch (e) {
      next();
    }
  }
};
