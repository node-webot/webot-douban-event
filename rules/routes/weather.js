var webot = require('weixin-robot');

var pwd = process.cwd();
var weather = require(pwd + '/lib/weather');
var cities = require(pwd + '/data').cities;

module.exports = {
  'pattern': function(info) {
    return info.param && info.param.loc &&
    info.text.search(/天气|weather|wheather|\btq\b/i) !== -1;
  },
  'handler': function(info, next) {
    weather(cities.id2name[info.param.loc], function(err, res) {
      if (err || ! res) return next(null, '暂时无法获取天气信息，表示很抱歉哈...');
      return next(null, res);
    });
  }
};
