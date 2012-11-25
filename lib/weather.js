var webot = require('weixin-robot');
var error = require('debug')('weixin:weather');
var Iconv = require('iconv').Iconv;
var gbk2utf8 = new Iconv('gbk', 'utf-8');

module.exports = exports = function(loc_name, cb) {
  webot.request('GET http://www.youdao.com/smartresult-xml/search.s', {
    type: 'weather',
    q: loc_name,
  }, function(err, res) {
    if (err) return cb(err);
    var t = '';
    try {
      res = gbk2utf8.convert(res);
      var j = JSON.parse(webot.xml2json(res)).smartresult.product;
      var d = new Date(j.updatetime);
      var d1 = '今天', d2 = '明天';
      var w1 = j.weather1;
      if (w1 === '晴') w1 = '晴朗';
      var hour = d.getHours();
      if (hour > 17 || hour < 3) {
        d1 = '今天夜间到明天白天';
        d2 = '后天';
      }
      t += '预计' + d1 + loc_name + w1 + '，气温' + j.temperature1;
      if (j.winddirection1) {
        t += '，有' + j.winddirection1 + j.windForce1;
      }
      t += '。' + d2 + j.weather2 + '，' + j.temperature2 + '。';
      if (j.indexes) {
        var now = new Date();
        var now_hour = now.getHours();
        var zs = j.indexes.item;
        if (now_hour < 19) {
          // 逛街指数
          t += zs[3]['value'].split(' ')[2];
        } else {
          // 穿衣指数
          t += zs[9]['value'].split(' ')[2];
        }
      }
      if (w1.indexOf('雨') > -1) {
        //t += '似乎不太适合出门吼，能宅就尽量宅吧~';
      } else if (w1.indexOf('雪') > -1) {
        t += '雪花纷飞，掩埋了我对你的思念...';
      } else if (w1.indexOf('晴') > -1) {
        //t += '天气好像不错吼？出门参加点同城活动吧！';
      }
    } catch (e) {
      error('parse weather failed', e);
      ('trace' in e) && e.trace();
      return cb(e);
    }
    return cb(null, t);
  });
};
