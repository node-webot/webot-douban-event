var pwd = process.cwd();

var data = require(pwd + '/data');
var cities = data.cities;

var douban = require(pwd + '/lib/douban');
var paser = require(pwd + '/lib/parser');
var user = require(pwd + '/lib/user');

// Special type for location
module.exports = {
  pattern: function(info) {
    return info.isLocation();
  },
  handler: function(info, next) {
    parser.geo2loc(info, function(err, city) {
      if (!city) return next('CITY_404');

      var loc_id;
      for (var i = 0, l = cities.length; i < l; i++) {
        var item = cities[i];
        if (city.search(item['name']) === 0) {
          loc_id = item['id'];
        }
      }
      if (!loc_id) return next('CITY_404');

      user(info.from).setLoc(loc_id);
      info.param.uid = info.from;
      info.param.loc = loc_id;
      info.ended = true;
      return douban.nearby(info.param, next);
    });
  }
};
