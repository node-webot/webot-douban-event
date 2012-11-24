var webot = require('weixin-robot');

var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var parser = require(pwd + '/lib/parser');
var douban = require(pwd + '/lib/douban');

var router = webot.router();

var cmds = ['search|搜索|s'];

router.set('want_city', {
  'parser': function(info, next) {
    var _text = info._text;

    // parse command
    var lead = _text.split(/\s+/)[0];
    for (var i = 0, l = cmds.length; i < l; i++) {
      if (lead.search(cmds[i]) === 0) {
        info.cmd = _text.cmd = cmds[i].split('|')[0];
      }
    }
    info.param = parser.listParam(info.text);
    info.param._text = _text;
    var uid = info.param.uid = info.from;
    var u = info.u = user(uid);

    var loc = info.param['loc'];
    if (loc) {
      info._ori_loc = loc;
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
    var want_city = this.waiter.data(uid, 'search') === 'want_city';
    var loc = info.param['loc'];

    if (want_city && loc) {
      u.setLoc(loc);
      this.waiter.pass(uid, 'search');
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
    var is_more = (/更多|再来|more|下一页/i).test(info.text);
    var uid = info.from;
    var u = info.u || user(uid);
    var waiter = this.waiter;

    u.getPrev(function(err, res){
      if (err || !res) return next();

      var act = res['_wx_act'];
      if (is_more === false && info.text !== res._text || !act || !(act in douban)) return next();

      try {
        info.ended = true;
        // 实际得到的比想要的少，说明没有更多了
        if (res.count > res._len) {
          info.param.start = 1;
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
});
router.set('list', {
  'pattern': function(info) {
    return !info.param['q'];
  },
  'handler': function(info, next) {
    var loc = info.param['loc'];
    if (!loc) return next('CITY_404');

    info.ended = true;
    douban.list(info.param, next);
  }
});

var dialogs = webot.dialogs({
  dir: __dirname + '/dialogs',
  files: ['basic', 'gags', 'greetings.js', 'bad', 'lonely', 'flirt', 'emoji', 'short']
});
router.dialog(dialogs);

var unknown_replies = [
  '唉，实在听不懂你在说什么耶...',
  '实在抱歉，暂时不知道您说这话是什么意思..',
  '不太明白你要表达个什么意思... 我智力很有限的！',
  '你刚才说的我没听太懂，但我还在努力学习中，以后说不定就懂了哦~'
]
router.set('search', {
  'pattern': function(info) {
    return info.param['q'] && info.param['q'].length < 25;
  },
  'handler': function(info, next) {
    var u = info.u || user(info.from);

    // 如果有搜索关键字
    if (info._ori_loc || info.cmd === 'search') {
      info.ended = true;
      return douban.search(info.param, next);
    }
    var q = info.param['q'];
    var loc = info.param['loc'];
    u.getProp('stop_search', function(err, res){
      if (!res) return next(); // will goto ask search
      return next(null, unknown_replies.sample(1)[0]);
    });
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
