var webot = require('weixin-robot');

var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var parser = require(pwd + '/lib/parser');
var douban = require(pwd + '/lib/douban');

var router = webot.router();

var dialogs = webot.dialogs({
  dir: __dirname + '/dialogs',
  files: ['basic', 'gags', 'greetings.js', 'bad', 'flirt', 'emoji']
});
router.dialog(dialogs);

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

router.set('list', {
  'parser': function(info) {
    info.param = parser.listParam(info.text);
    return info;
  },
  'handler': function(info, next) {
    var uid = info.from;
    var u = user(uid);

    // is waiting for user to reply a city name
    var want_city = this.waiter.reserve(uid) === 'search' && this.waiter.data(uid, 'want') === 'city';
    var loc = info.param && info.param['loc'];

    if (want_city && loc) {
      u.setLoc(loc);
      var q = this.waiter.data(uid, 'q');
      if (q) {
        this.waiter.pass(uid);
        info.param['q'] = q;
        info.ended = true;
        return douban.search(info.param, next);
      }
    }

    if (loc) {
      u.setLoc(loc);
      cb(loc);
    } else {
      u.getLoc(function(err, loc) {
        if (loc) {
          info.param['loc'] = loc;
          u.setLoc(loc);
        }
        cb(loc);
      });
    }

    function cb(loc) {
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
  }
});

module.exports = router;
