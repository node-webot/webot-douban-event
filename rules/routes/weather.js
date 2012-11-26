var webot = require('weixin-robot');

var pwd = process.cwd();
var weather = require(pwd + '/lib/weather');
var cities = require(pwd + '/data').cities;

var reg_tq = /天气|weather|wheather|\btq\b|\btianqi\b/i;
module.exports = {
  'pattern': function(info) {
    return reg_tq.test(info.text);
  },
  'parser': function(info) {
    var t = info.param['q'];
    info.param['q'] = t.replace(reg_tq, '');
    return info;
  },
  'handler': function(info, next) {
    var loc = info.param && info.param.loc;
    var loc_name = loc && cities.id2name[loc] || info.param && info.param['q'];
    if (!loc_name) {
      console.log(loc_name);
      return next(null, this.waiter.reserve(info.from, 'city_weather'));
    }
    weather(loc_name, function(err, res) {
      if (err || ! res) return next(null, '暂时无法获取天气信息，表示很抱歉哈...');
      return next(null, res);
    });
  }
};
