var pwd = process.cwd();
var data = require(pwd + '/data');
var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

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
      return '要我在' + cities.id2name[loc_id] + '搜索“' + q + '”相关的活动吗？请回复“要”或“不要”，回复“永远不要”不再出现此提示';
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
      u.setProp('stop_search', true, function() {
        return cb(null, '好的，今后我听不懂你的话时将不再询问你是否搜索。你总是可以发送“[城市名] xxx”来直接搜索 xxx 相关的活动。');
      });
    },
    'N': '好的，你说不要就不要' 
  }
});

module.exports = waiter;
