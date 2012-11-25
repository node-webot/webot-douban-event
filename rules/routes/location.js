var pwd = process.cwd();
var webot = require('weixin-robot');

var douban = require(pwd + '/lib/douban');
var user = require(pwd + '/lib/user');

// Special type for location
module.exports = function(info, next) {
  webot.geo2loc(info.param, function(loc_info) {

    var city = loc_info && loc_info.city;
    if (!city) return next('CITY_404');

    var loc_id;
    for (var i = 0, l = cities.length; i < l; i++) {
      var item = cities[i];
      if (city.indexOf(item['name'].split('|')[0]) === 0) {
        loc_id = item['id'];
      }
    }
    if (!loc_id) return next('CITY_404');

    user(info.from).setLoc(loc_id);
    info.param.loc = loc_id;
    info.ended = true;
    return douban.nearby(info.param, next);
  });
};
