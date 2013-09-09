// Douban Event Api
var task = require('../task');
var cities = require('../../data/cities');

var qs = require('querystring');
var debug = require('debug');
var log = debug('weixin:douban');
var error = debug('weixin:douban:error');

var DOUBAN_API_ROOT = 'https://api.douban.com';

function request(url, param, cb){

  url = url + '?' + qs.stringify(param);

  log('GET %s', url);

  task.api(function(client, done) {
    client.clientFromToken().get(url, function(err, res) {
      if (err) {
        error('douban api error: %s', err);
      } else {
        try {
          res = JSON.parse(res.body);
        } catch (e) {}
      }
      cb(err, res);
      done();
    });
  });
}

function getSample(size) {
  var arr = this;
  var shuffled = arr.slice(0), i = arr.length, min = Math.max(0, i - size), temp, index;
  while (i-- > min) {
    index = Math.round(i * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

Array.prototype.sample = getSample;

var douban = {};

douban.eventDesc = function eventDesc(item) {
  return item.owner.name + ' / ' +
    (item.participant_count + item.wisher_count) + '人关注 / ' + item.address;
};

douban.list = function(param, next) {
  if (!param) return next(400);
  if (!param['loc'] && param['type']) return next('CITY_FIRST');

  var is_simple = (!param.day_type || param.day_type === 'future') && (!param.type || param.type == 'all');

  if (!param['count']) {
    param['count'] = is_simple ? 8 : 4;
  }
  if (!param['day_type'] && cities.is_hot(param['loc'])) {
    // 默认本周活动
    param['day_type'] = 'week';
  }

  request('/v2/event/list', {
    count: param.count,
    type: param.type,
    start: param.start,
    day_type: param.day_type,
    loc: param.loc
  }, function(err, ret) {
    if (err == 404) return next(err);
    if (err || !ret.events) return next(503);
    if (!ret.events.length) return next(is_simple ? 'LIST_404' : 'LIST_FAIL');
    param._len = ret.events.length;
    param._total = ret.total;
    next(err, ret.events.sample(4));
  });
};

douban.search = function(param, next) {
  if (!param || !param['q'] || !param['loc']) return next(400);

  param['count'] = param['count'] || 8;
  request('/v2/event/search', {
    count: param.count,
    loc: param.loc,
    q: param.q
  }, function(err, ret) {
    if (err === 404) return next('SEARCH_404');
    if (err || !ret.events) return next(503);
    if (!ret.events.length) return next('SEARCH_404');

    param._len = ret.events.length;
    param._total = ret.total;
    next(err, ret.events.sample(4));
  });
};

douban.nearby = function(param, next) {

  param['count'] = param['count'] || 4;
  var has_day = 'day_type' in param;

  var fn = function(day_type) {
    if (day_type) param['day_type'] = day_type;
    request('/v2/event/nearby', {
      day_type: param.day_type,
      loc: param.loc,
      count: param.count,
      lat: param.lat,
      lng: param.lng
    }, cb);
  };

  var cb = function(err, ret) {
    // 附近今天的活动只有一个
    if (!has_day && param['day_type'] == 'today') {
      if (!err == 404 || ret && ret.events && ret.events.length < 2) {
        return fn('future');
      }
    }
    if (err === 404) return next('GEO_404');
    if (err || !ret.events) return next(500);
    if (!ret.events.length) return next('GEO_404');
    param._len = ret.events.length;
    param._total = ret.total;
    next(err, ret.events);
  }
  // 未指定时间时，优先取今日
  fn(has_day ? null : 'today');
};

module.exports = douban;
