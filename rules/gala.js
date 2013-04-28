var pwd = process.cwd();
var gala = require(pwd + '/data/gala.js');
var app_conf = require(pwd + '/conf');
var intros = gala.intros;

var regs = {
  'caomei': /(草莓|strawberry|caomei|^cm\b)\s*(音乐节)?\s*(演出安排)?\s*(日程)?/i,
  'midi': /(迷笛|midi|^md\b)\s*(音乐节)?\s*(演出安排)?\s*(日程)?/i,
};
var confs = {
  caomei: {
    name: '草莓音乐节',
    cmd: 'caomei',
    pic: 'http://img3.douban.com/img/biz/loc_promo/midi-shanghai/p1948409618.jpg',
    cities: {
      '108288': '北京',
      '108296': '上海'
    }
  },
  midi: {
    name: '迷笛音乐节',
    cmd: 'midi',
    pic: 'http://img3.douban.com/img/biz/loc_promo/midi-shanghai/p1948408772.jpg',
    cities: {
      '108288': '北京',
      '108296': '上海'
    }
  },
};

function getCities(cities) {
  var ret = '';
  var arr = [];
  for (var k in cities) {
    arr.push(cities[k]);
  }
  if (arr.length > 2) {
    return arr.join('、');
  } else if (arr.length == 2) {
    return arr.join('和') + '两个城市';
  }
}

function getLink(s) {
  var name = s[1];
  if (name in intros) s[1] = name.link(intros[name]);
  return s.join(' ');
}

function formatMessage(stages) {
  var ret = '接下来即将登场的是：\n';
  if (!Object.keys(stages).length) return '今天已经没有更多演出了，我们明天继续!';
  for (var s in stages) {
    ret += '\n' + s + '：\n' + getLink(stages[s]) + '\n';
  }
  return ret;
}

var oneday = 60 * 60 * 24 * 1000;
function lookup(conf) {
  var now = new Date();
  var intros = conf.intros;
  for (var k in conf) {
    if (k === 'intros') continue;
    var day = new Date(k);
    var gap = now - day;

    if (gap < -oneday) {
      return 'comming soon';
    }

    if (gap > oneday) {
      continue;
    }
    
    if (gap < oneday) { 
      var stages = {};
      /**
       * conf[k] === {
       *  'xxx舞台': {
       *    '17:00-17:40': 'hahaha'
       *  }
       * }
       */
      for (var s in conf[k]) {
        var timeline = conf[k][s];
        for (var t in timeline) {
          var begin_time = new Date(k + ' ' + t.split('-')[0].trim());
          if (begin_time > now) {
            stages[s] = [t, timeline[t]];
            break;
          }
        }
      }
      return formatMessage(stages);
    }
  }

  return null;
}

module.exports = {
  pattern: function(info) {
    if (!info.text) return;
    for (var k in regs) {
      if (regs[k].test(info.text)) {
        info.gala = info.session.gala = k;
        return true;
      }
    }
  },
  handler: function(info) {
    var u = info.u;
    var loc = info.param.loc || u.getLoc();

    var _gala = info.gala || info.session.gala;
    var conf = confs[_gala];

    if (!conf) {
      info.ended = false;
      return;
    }

    if (!loc) {
      info.session.want_city = 'gala';
      return '要查询' + conf.name + '的演出安排，我需要先知道你所在城市哦。目前我可以帮你查到' +
        getCities(conf.cities) + conf.name + '的演出安排。请直接回复城市名。';
    }

    delete info.session.gala;

    if (!(loc in conf.cities)) {
      return '你所在的城市目前好像没有举办' + conf.name + '哦。';
    }

    var ret = lookup(gala(_gala + '-' + loc));
    var city = conf.cities[loc];

    if (ret === 'comming soon') {
      return {
        title: '2013' + city + conf.name + '即将开始',
        description: '演出当日发送「' + conf.cmd + '」即可查询接下来登场的乐队/歌手信息',
        picUrl: conf.pic,
        url: app_conf.site_root + _gala + '-' + loc + '.txt'
      };
    }

    if (ret) return ret;

    return '今年的' + city + conf.name + '已经结束了哦，你可以去<a href="http://www.douban.com/location/' +
    loc + '/">我们的网站</a>上搜索「' + conf.name + '」回顾今年的活动';
  },
};
