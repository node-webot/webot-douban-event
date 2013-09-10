var error = require('debug')('weixin:reply:error');

module.exports = function(webot) {


var cwd = process.cwd();
var task = require(cwd + '/lib/task');

var _ = require('lodash');


var render_event_list = _.template([
  '<% if (!total) { %>' + 
    '你当前并未标记任何<%= action %>的活动，点击菜单栏“本周热门”，立刻发现即将发生的好活动！' +
  '<% } else { %>' +
    '你当前标记了',
    '<a href="http://www.douban.com/location/people/<%= uid %>/events/<%= my_url_path %>">' +
    '<%= total %>个<%= action %>的活动</a>：',
    '<% _.each(events, function(item, i) { %>',
      '<%= _.format_time(item.begin_time) %>开始',
      '<a href="<%= item.alt %>"><%= item.title %></a>',
    '<% }) %>' +
    '<% if (total > events.length) { %>' +
      '...',
    '<% } %>',
  '<% } %>',
].join('\n'));



var reg_mine = /^(我(要?参加)?的(活动)?|mine|my|mark)$/i;
var reg_wish = /^((my )?wish|我?感兴趣的(活动)?)$/i;
webot.set('mine events', {
  domain: 'mine',
  pattern: function(info) {
    if (reg_mine.test(info.text)) {
      info.action = 'attend';
      return true;
    }
    if (reg_wish.test(info.text)) {
      info.action = 'wish';
      return true;
    }
    return false;
  },
  handler: function(info, next) {
    var user = info.user;
    var api_path = info.action === 'attend' ? 'user_participated' : 'user_wished';
    task.user_api(user, function(client) {
      client.get('/v2/event/' + api_path + '/' + client.user_id, {
        count: 6,
        status: 'ongoing'
      }, function(err, ret) {
      //client.get('/shuo/v2/statuses/home_timeline', function(err, ret) {
        if (err) {
          error('[API] get %s events failed: ', info.action, err);
          info.ended = true;
          if (err.statusCode == 400) {
            info.user.make_connect_url(function(err, url) {
              if (err) return next(500);
              return next('T.T 请求失败，请尝试<a href="' + url + '">重新绑定豆瓣帐号</a>');
            });
            return;
          }
          return next('T.T 获取活动出错了，稍后再试吧');
        }
        ret.uid = user.douban_id;
        ret.action = info.action === 'attend' ? '要参加' : '感兴趣';
        ret.my_url_path = info.action;
        next(null, render_event_list(ret));
      });
    });
  }
});



};

