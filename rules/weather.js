var webot = require('weixin-robot');

var pwd = process.cwd();
var weather = require(pwd + '/lib/weather');
var cities = require(pwd + '/data').cities;

var reg_tq = /天气|weather|wheather|\btq\b|\btianqi\b/i;

var city_weather = {
  name: 'wait city weather',
  handler: function(info, cb) {
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
}

module.exports = {
  'pattern': function(info) {
    return reg_tq.test(info.text);
  },
  'handler': function(info, next) {
    info.param['q'] = info.param['q']
      .replace(reg_tq, '')
      .replace(/如何|怎么?样|[？\?\.。]|好不/g, '')
      .replace(/[今明后]天/, '')
      .replace(/[啊呀哇]/g, '');

    var loc = info.param.loc;
    var loc_name = loc && cities.id2name[loc] || info.param && info.param['q'];
    if (loc_name === '阿') loc_name = '';
    if (!loc_name) {
      info.wait(city_weather);
      return next(null, '要查询天气，我需要先知道你在哪个城市');
    }
    weather(loc_name, function(err, res) {
      if (err || ! res) return next(null, '暂时无法获取天气信息，表示很抱歉哈...');
      return next(null, res);
    });
  },
};
