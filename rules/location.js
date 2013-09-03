var pwd = process.cwd();

var data = require(pwd + '/data');
var cities = data.cities;

var douban = require(pwd + '/lib/douban');
var parser = require(pwd + '/lib/parser');
var User = require(pwd + '/model/user');

// Special type for location
module.exports = {
  pattern: function(info) {
    return info.is('location');
  },
  handler: function(info, next) {
    parser.geo2loc(info.param, function(err, city) {

      info.ended = true;

      if (!city) {
        return next('GEO_404');
      }

      var loc_id;
      for (var i = 0, l = cities.length; i < l; i++) {
        var item = cities[i];
        if (city.search(item['name']) === 0) {
          loc_id = item['id'];
        }
      }
      if (!loc_id) return next('GEO_404');

      info.user.setLoc(loc_id, function() {
        var param = {
          uid: info.uid,
          lat: info.param.lat,
          lng: info.param.lng,
          loc: loc_id
        };
        return douban.event.nearby(param, next);
      });
    });
  }
};
