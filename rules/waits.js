var pwd = process.cwd();
var data = require(pwd + '/data');
var parser = require(pwd + '/lib/parser');
var douban = require(pwd + '/lib/douban');
var chengyu = data.chengyu;

var cities = data.cities;
var etypes = data.types;

module.exports = function(webot) {

webot.waitRule('wiki_fulltitle', function(uid, info, cb) {
  var kw = info.text;
  var m = kw.match(reg_recite);
  if (m) kw = m[4];
  info.kw = kw;
  webot.get('wikisource').handler(info, cb);
});

webot.waitRule('jielong',  {
  pattern: '((什么|什麽|甚么|嘛|啥)意思|解释|释义)',
  handler: function(info) {
    var q = info.session.jielong;

    delete info.session.jielong;

    var ret = q && chengyu.explain[q];
    if (ret) return '【' + q + '】' + ret;
    return '我也不知道是什么意思呢...';
  }
});

var reg_lonely = /(妹子|妹纸|帅哥|美女|姑娘|^小?美?妞)/;
webot.set('lonely', {
  pattern: reg_lonely,
  handler: function(info) {
    var q = info.param['q'] || info.text;
    var loc_id = info.param['loc'];
    var u = info.u;
    var webot = this;
    info.session.type = 'party';
    info.session.loc = loc_id;

    if (loc_id) {
      return '多出门参加一点同城活动就能遇见' + q.match(reg_lonely)[0] + '了哦？要不我帮你在' + cities.id2name[loc_id] + '找一些聚会类的活动？';
    } else {
      info.session.want_city = 'lonely';
      return '想认识更多好朋友？告诉我你所在的城市，让我帮你找点聚会类的活动吧';
    }
  },
  replies: {
    Y: function(info, cb) {
      var loc = info.user.loc;
      douban.list({
        loc: loc,
        type: 'party'
      }, cb);
    },
    N: '好的，你说不要就不要'
  }
});
webot.set('who_create1', {
  pattern: /你是.+做的/,
  handler: '我其实是一个很猥琐的程序员做的，要我把他的微信号告诉你吗？',
  replies: {
    Y: '好的，他的微信帐号是：YjgxNTQ5ZmQzYTA0OWNjNTQ3NzliNGMyNzRmYjdhMTUK',
    N: '可惜了啊，其实他还长得蛮帅的' 
  }
});
webot.set('who_create2', {
  pattern: function(info) {
    var reg = /(什么人|谁|哪位.*|哪个.*)(给|为|帮)?你?(设置|做|配置|制造|制作|设计|写|创造|生产?)(了|的)?/;
    return reg.test(info.text) && info.text.replace(reg, '').indexOf('你') === 0;
  },
  handler: '一个很猥琐的程序员，要我把他的微信号告诉你吗？',
  'replies': {
    Y: '好的，他的微信帐号是：YjgxNTQ5ZmQzYTA0OWNjNTQ3NzliNGMyNzRmYjdhMTUK',
    N: '可惜了啊，其实他还长得蛮帅的' 
  }
});
var reg_search_cmd = /^(搜索?|search|s)$/;
webot.set('search_cmd', {
  'pattern': reg_search_cmd,
  'handler': '你想搜什么？',
  'replies': function(info, next) {
    info.param = info.param || parser.listParam(info.text);

    var loc = info.param['loc'];
    // 如果回复内容里指定了 loc ，
    // 直接跳到下一个 Route
    if (loc) return next();

    loc = info.user.loc;

    if (loc) {
      var q = info.text.replace(reg_search_cmd);
      return douban.event.search({ loc: loc, q: q }, cb);
    }
    info.session.q = info.text;
    info.session.want_city = 'search_cmd';
    return next(null, '哎呀，我还不知道你住在哪个城市呢……');
  }
});

webot.set('confirm search', {
  'pattern': function(info) {
    info.param = info.param || {};
    var text = info.param['q'] || info.text;
    return text && text.length < 15;
  },
  'handler': function(info) {
    var q = info.param['q'] || info.text;
    var loc_id = info.param['loc'];

    // save user data
    info.session.q = q;
    info.session.loc = loc_id;

    var type = info.param['type'] || '';
    if (type) {
      type = etypes[type].name;
    }
    if (loc_id) {
      return '要我在' + cities.id2name[loc_id] + '搜索“' + q +
      '”相关的' + type + '活动吗？请回复“要”或“不要”，回复“要要要”总是尝试搜索';
    } else {
      info.session.want_city = info.param.q ? 'search' : 'list';
      return '真是惭愧，我还不知道您在哪儿呢。告诉我你所在的城市，我就能帮你找活动了哦！[愉快]';
    }
  },
  'replies': {
    Y: function(info, cb) {
      var uid = info.uid;
      var d = info.session;
      if (!d['loc']) {
        cb(null, '我需要先知道你在哪个城市哦亲');
        info.wait(webot.get('want_city'));
        return
      }
      if (!d['loc'] || !d['q']) return cb();
      return douban.event.search(d, cb);
    },
    N: '好的，你说不要就不要',
    '永远不要|(不要){2,}|你好啰嗦|你好烦|取消|去死|呸': function(info, cb) {
      info.sesion.ask_search = 1;
      return cb(null, '好的，今后我听不懂你的话时将不再询问你是否搜索。\n你总是可以发送“搜索 xxx”来直接搜索 xxx 相关的活动。');
    },
    '要要要': function(info, cb) {
      info.session.ask_search = 2;
      return cb(null, '要要要，切克闹！\n今后我听不懂你的话时将总是尝试为你查找相关活动。\n你可以回复“别闹了”取消此设置。\n再次发送刚才的关键字开始搜索。');
    },
  }
});

};
