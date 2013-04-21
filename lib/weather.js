var webot = require('weixin-robot');
var request = require('request');
var error = require('debug')('weixin:weather');
var gbk_utf8 = require('./fanjian').gbk_utf8;

var parseXml = require('xml2js').parseString;

module.exports = exports = function(loc_name, cb) {
  request('http://www.youdao.com/smartresult-xml/search.s', {
    qs: {
      type: 'weather',
      q: loc_name,
    },
    encoding: null
  }, function(err, res) {
    if (err) return cb(err);
    var t = '';
    try {
      res = gbk_utf8.convert(res.body);
      parseXml(res.toString(), function(err, json) {
        var j = json.smartresult.product[0];
        for (var k in j) {
          if (Array.isArray(j[k]) && j[k].length === 1) {
            j[k] = j[k][0];
          }
        }
        var d = new Date(j.updatetime);
        var d1 = '今天', d2 = '明天';
        var w1 = j.weather1;
        if (w1 === '晴') w1 = '天气晴';
        if (w1.search(/雨|雪|雾|冰/) > -1 && w1.indexOf('转') === -1) w1 = '有' + w1;
        var hour = d.getHours();
        if (hour > 17 || hour < 3) {
          d1 = '今天夜间到明天白天';
          d2 = '后天';
        }
        t += '预计' + d1 + loc_name + w1 + '，气温' + j.temperature1;
        if (typeof j.winddirection1 === 'string') {
          t += '，' + j.winddirection1 + j.windForce1;
        }
        t += '。' + d2 + j.weather2 + '，' + j.temperature2 + '。';
        if (j.indexes) {
          var now = new Date();
          var now_hour = now.getHours();
          var zs = j.indexes.item;
          if (now_hour < 19) {
            // 逛街指数
            t += String(zs[3]['value']).split(' ')[2];
          } else {
            // 穿衣指数
            t += String(zs[9]['value']).split(' ')[2];
          }
        }
        if (w1.indexOf('雨') > -1) {
          //t += '似乎不太适合出门吼，能宅就尽量宅吧~';
        } else if (w1.indexOf('雪') > -1) {
          t += '雪花纷飞，掩埋了我对你的思念...';
        } else if (w1.indexOf('晴') > -1) {
          //t += '天气好像不错吼？出门参加点同城活动吧！';
        }
      });
    } catch (e) {
      error('parse weather failed', e);
      ('stack' in e) && console.error(e.stack);
      return cb(e);
    }
    return cb(null, t);
  });
};
