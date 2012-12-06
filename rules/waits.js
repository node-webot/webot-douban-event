var pwd = process.cwd();
var data = require(pwd + '/data');
var parser = require(pwd + '/lib/parser');
var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');
var weather = require(pwd + '/lib/weather');

var cities = data.cities;

var webot = require('weixin-robot');
var waiter = webot.waiter();

waiter.set('lonely', {
  pattern: /妹子|妹纸|帅哥|美女|姑娘|相亲|交友|约会|小妞/g,
  tip: function(uid, info) {
    var q = info.param['q'] || info.text;
    var loc_id = info.param['loc'];
    var u = info.u;
    var waiter = this;
    waiter.data(uid, { 'type': 'party', 'loc': loc_id });
    if (loc_id) {
      return '看来你比较寂寞，让我帮你在' + cities.id2name[loc_id] + '找一下聚会类的活动吧？';
    } else {
      waiter.data(uid, 'want_city', 'lonely');
      return '看样子你很寂寞呀？告诉我你所在的城市，让我帮你找点聚会类的活动吧';
    }
  },
  replies: {
    Y: function(uid, info, cb) {
      var u = info.u || user(uid);
      u.getLoc(function(err, loc) {
        douban.list({
          loc: loc,
          type: 'party'
        }, cb);
      });
    },
    N: '好的，你说不要就不要'
  }
});
waiter.set('who_create1', {
  pattern: /你是.+做的/,
  tip: '我其实是一个很猥琐的程序员做的，要我把他的微信号告诉你吗？',
  'replies': {
    'Y': '好的，他的微信帐号是：YjgxNTQ5ZmQzYTA0OWNjNTQ3NzliNGMyNzRmYjdhMTUK',
    'N': '可惜了啊，其实他还长得蛮帅的' 
  }
});
waiter.set('who_create2', {
  pattern: function(info) {
    var reg = /(什么人|谁|哪位.*|哪个.*)(给|为|帮)?你?(设置|做|配置|制造|制作|设计|写|创造|生产?)(了|的)?/;
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
      waiter.data(uid, 'want_city', 'search_cmd');
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
      '”相关的活动吗？请回复“要”或“不要”，回复“要要要”总是尝试搜索';
    } else {
      waiter.data(uid, 'want_city', 'search');
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
    '永远不要|(不要){2,}|你好啰嗦|你好烦': function(uid, info, cb) {
      var u = info.u || user(info.from);
      u.setProp('stop_search', 1, function() {
        return cb(null, '好的，今后我听不懂你的话时将不再询问你是否搜索。\n你总是可以发送“搜索 xxx”来直接搜索 xxx 相关的活动。');
      });
    },
    '要要要': function(uid, info, cb) {
      var u = info.u || user(info.from);
      u.setProp('stop_search', 2, function() {
        return cb(null, '切克闹！今后我听不懂你的话时将总是尝试为你搜索相关活动。你可以回复“别闹了”取消此设置。');
      });
    },
    'N': '好的，你说不要就不要' 
  }
});
waiter.set('city_weather', {
  'tip': '要查询天气，我需要先知道你在哪个城市',
  'replies': function(uid, info, cb) {
    var loc = info.text;
    var param = parser.listParam(info.text);
    var loc_id = param['loc'];
    if (loc_id && loc_id in cities.id2name) {
      user(info.from).setLoc(loc_id);
      loc = cities.id2name[loc_id]
    }
    weather(loc, function(err, res) {
      if (err || ! res) return cb(err);
      return cb(null, res);
    });
  }
});

var r_wikisource = require('./routes/wikisource');
waiter.set('wikisource', {
  'replies': function(uid, info, cb) {
    var kw = info.text;
    var m = kw.match(r_wikisource.reg_recite);
    if (m) kw = m[4];
    info.kw = kw;
    r_wikisource.handler(info, cb);
  }
});

var chengyu = require(pwd + '/data').chengyu;
waiter.set('jielong', {
  'tip': function(uid, q) {
    this.data(uid, 'jielong', q);
    return q;
  },
  'replies': {
    '((什么|啥)意思|解释|释义)': function(uid, info, cb) {
      var q = this.data(uid, 'jielong');
      var ret = q && chengyu.explain[q];
      if (ret) return cb(null, '【' + q + '】' + ret);
      return cb(null, '我也不知道是什么意思呢...');
    }
  }
});
module.exports = waiter;
