var pwd = process.cwd();
var data = require(pwd + '/data');
var parser = require(pwd + '/lib/parser');
var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');
var weather = require(pwd + '/lib/weather');

var cities = data.cities;

var webot = require('weixin-robot');
var waiter = webot.waiter();

waiter.set('who_create', {
  pattern: function(info) {
    var reg = /(什么人|谁|哪位.*)(给|为|帮)?你?(设置|做|配置|制造|制作|设计|创造|生产?)(了|的)?/;
    return reg.test(info.text) && info.text.replace(reg, '').indexOf('你') === 0;
  },
  tip: '一个很猥琐的程序员，要我把他的微信号告诉你吗？',
  'replies': {
    'Y': '好的，他的微信帐号是：YjgxNTQ5ZmQzYTA0OWNjNTQ3NzliNGMyNzRmYjdhMTUK',
    'N': '可惜了啊，其实他还长得蛮帅的' 
  }
});

waiter.set('search_cmd', {
  pattern: /^(搜索?|search|s)$/,
  'tip': '你想搜什么？',
  'replies': function(uid, info, cb) {
    var u = info.u || user(info.from);
    var waiter = this;
    var next = function(err, loc) {
      if (loc) return douban.search({ loc: loc, q: info.text }, cb);
      waiter.data(uid, 'q', info.text);
      waiter.data(uid, 'search', 'want_city');
      return cb(null, '哎呀，我还不知道你住在哪个城市呢……');
    };
    info.param = info.param || parser.listParam(info.text);
    var loc = info.param['loc'];
    if (loc) return true;
    u.getLoc(next);
  }
});

waiter.set('search', {
  'pattern': function(info) {
    info.param = info.param || {};
    var text = info.param['q'] || info.text;
    return info.type == 'text' && text.length > 1 && text.length < 15;
  },
  'tip': function(uid, info) {
    var q = info.param['q'] || info.text;
    var loc_id = info.param['loc'];

    var u = info.u;

    var waiter = this;

    // save user data
    waiter.data(uid, { 'q': q, 'loc': loc_id });
    if (loc_id) {
      return '要我在' + cities.id2name[loc_id] + '搜索“' + q +
      '”相关的活动吗？\n请回复“要”或“不要”，回复“永远不要”不再出现此提示，回复“要要，切克闹”总是尝试搜索';
    } else {
      waiter.data(uid, 'search', 'want_city');
      return '告诉我你所在的城市，我就可以帮你查找“' + q + '”相关的活动';
    }
  },
  'replies': {
    'Y': function(uid, info, cb) {
      var d = this.data(uid);
      if (!d['loc'] || !d['q']) return true;
      d['uid'] = uid;
      return douban.search(d, cb);
    },
    '永远不要': function(uid, info, cb) {
      var u = info.u || user(info.from);
      u.setProp('stop_search', 1, function() {
        return cb(null, '好的，今后我听不懂你的话时将不再询问你是否搜索。\n你总是可以发送“搜索 xxx”来直接搜索 xxx 相关的活动。');
      });
    },
    '要要[，,]?切[克客]闹': function(uid, info, cb) {
      var u = info.u || user(info.from);
      u.setProp('stop_search', 2, function() {
        return cb(null, '好的，今后我听不懂你的话时将总是尝试为你搜索相关活动。你可以回复“别闹了”取消此设置。');
      });
    },
    'N': '好的，你说不要就不要' 
  }
});
waiter.set('city_weather', {
  'tip': '要查询天气，我需要先知道你在哪个城市',
  'replies': function(uid, info, cb) {
    weather(info.text, function(err, res) {
      if (err || ! res) return cb(err);
      return cb(null, res);
    });
    process.nextTick(function() {
      var param = parser.listParam(info.text);
      if (param['loc']) {
        user(info.from).setLoc(param['loc']);
      }
    });
  }
});
module.exports = waiter;
