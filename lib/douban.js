// Douban Event Api
var wx_request = require('request');
var conf = require('../conf');
var user = require('./user');
var cities = require('../data/cities');

var qs = require('querystring');
var debug = require('debug');
var log = debug('weixin:douban');
var error = debug('weixin:douban:error');

function request(url, param, cb){
  param.apikey = conf.douban.apikey;
  url = url + '?' + qs.stringify(param);
  log('GET %s', url);
  wx_request.get(url, function(err, res) {
    if (err) {
      error('douban api error: %s', err);
    } else {
      try {
        res = JSON.parse(res.body);
      } catch (e) {}
    }
    cb(err, res);
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
};
Array.prototype.sample = getSample;

var douban = {
  eventDesc: function eventDesc(item) {
    return item.owner.name + ' / ' +
    (item.participant_count + item.wisher_count) + '人关注 / ' + item.address;
  },
  'list': function(param, next) {
    if (!param) return next(400);
    if (!param['loc'] && param['type']) return next('CITY_FIRST');

    if (!param['count']) {
      param['count'] = (!param['type'] || param['type'] == 'all') ? 8 : 4;
    }
    if (!param['day_type'] && cities.is_hot(param['loc'])) {
      // 默认本周活动
      param['day_type'] = 'week';
    }

    request('https://api.douban.com/v2/event/list', param, function(err, ret) {
      if (err == 404) return next(err);
      if (err || !ret.events) return next(503);
      if (!ret.events.length) next(404);
      param._len = ret.events.length;
      param._total = ret.total;
      user(param.uid).setPrev('list', param);
      next(err, ret.events.sample(4));
    });
  },
  'search': function(param, next) {
    if (!param || !param['q'] || !param['loc']) return next(400);

    param['count'] = param['count'] || 8;
    request('https://api.douban.com/v2/event/search', param, function(err, ret) {
      if (err === 404) return next('SEARCH_404');
      if (err || !ret.events) return next(503);
      if (!ret.events.length) next('SEARCH_404');
      param._len = ret.events.length;
      param._total = ret.total;
      user(param.uid).setPrev('search', param);
      next(err, ret.events.sample(4));
    });
  },
  'nearby': function(param, next) {
    if (!param['loc']) return next('GEO_404');

    param['count'] = param['count'] || 4;
    var has_day = 'day_type' in param;

    var fn = function(day_type) {
      if (day_type) param['day_type'] = day_type;
      request('https://api.douban.com/v2/event/nearby', param, cb);
    };

    var cb = function(err, ret) {
      // 附近今天的活动只有一个
      if (!has_day && param['day_type'] == 'today') {
        if (!err == 404 || ret && ret.events && ret.events.length < 2) {
          return fn('future');
        }
      }
      if (err === 404) return next('GEO_404');
      if (err || !ret.events) return next(503);
      if (!ret.events.length) return next('GEO_404');
      param._len = ret.events.length;
      param._total = ret.total;
      user(param.uid).setPrev('nearby', param);
      next(err, ret.events);
    }
    // 未指定时间时，优先取今日
    fn(has_day ? null : 'today');
  }
};

module.exports = douban;
