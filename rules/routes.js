var webot = require('weixin-robot');

var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var parser = require(pwd + '/lib/parser');
var douban = require(pwd + '/lib/douban');

var router = webot.router();

router.set('want_city', {
  'parser': function(info, next) {
    info.param = parser.listParam(info.text);
    info.param._text = info._text;
    var uid = info.param.uid = info.from;
    var u = user(uid);

    var loc = info.param['loc'];
    if (loc) {
      u.setLoc(loc);
      next(null, info);
    } else {
      u.getLoc(function(err, loc) {
        if (loc) {
          info.param['loc'] = loc;
        }
        next(null, info);
      });
    }
  },
  'handler': function(info, next) {
    var uid = info.from;
    var u = user(uid);

    // is waiting for user to reply a city name
    var want_city = this.waiter.reserve(uid) === 'search' && this.waiter.data(uid, 'search') === 'want_city';
    var loc = info.param['loc'];

    if (want_city && loc) {
      u.setLoc(loc);
      this.waiter.pass(uid);
      var q = this.waiter.data(uid, 'q');
      if (q) {
        info.param['q'] = q;
        info.ended = true;
        return douban.search(info.param, next);
      }
    }
    next();
  }
});

function obj_equal(a, b){
  var k;
  for (k in a) {
    if (a[k] != b[k]) return false;
  }
  return true;
}
router.set('more', {
  'handler': function(info, next) {
    var is_more = (/还要|更多|还有没有|还有吗|再来|more|下一页/i).test(info.text);
    var uid = info.from;
    var u = user(uid);
    var waiter = this.waiter;

    u.getPrev(function(err, res){
      if (err || !res) return next();

      var act = res['_wx_act'];
      if (is_more === false && info.text !== res._text || !act || !(act in douban)) return next();

      try {
        info.ended = true;
        if (res.count > res._len) {
          info.param.start = 1;
          return next(404);
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
});

var dialogs = webot.dialogs({
  dir: __dirname + '/dialogs',
  files: ['basic', 'gags', 'greetings.js', 'bad', 'flirt', 'emoji']
});
router.dialog(dialogs);

router.set('list', {
  'handler': function(info, next) {
    var loc = info.param['loc'];
    if (!loc) return next('CITY_404');

    // 如果有搜索关键字
    if (info.param['type'] && info.param['q']) {
      info.ended = true;
      return douban.search(info.param, next);
    }
    if (info.param['q']) {
      next();
      return;
    }
    info.ended = true;
    douban.list(info.param, next);
  }
});

// Special type for location
router.set('location', function(info, next) {
  webot.geo2loc(info.param, function(loc_info) {

    var city = loc_info && loc_info.city;
    if (!city) return next('CITY_404');

    var loc_id;
    for (var i = 0, l = cities.length; i < l; i++) {
      var item = cities[i];
      if (city.indexOf(item['name'].split('|')[0]) === 0) {
        loc_id = item['id'];
      }
    }
    if (!loc_id) return next('CITY_404');

    user(info.from).setLoc(loc_id);
    info.param.loc = loc_id;
    info.ended = true;
    return douban.nearby(info.param, next);
  });
});

module.exports = router;
