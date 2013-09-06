module.exports = function(webot) {


var error = require('debug')('weixin:action:error');
var log = require('debug')('weixin:action:log');
var _ = require('lodash');

var cwd = process.cwd();
var task = require(cwd + '/lib/task');


webot.afterReply(function(info) {
  return Array.isArray(info.reply);
}, function(info) {
  // for actions
  var sel = {};
  info.session.event_selections = sel;
  info.reply.forEach(function(item, i) {
    sel[String(i + 1)] = { _id: item.id, title: item.title };
  });
});


function get_matched(list, keyword) {
  if (!list || !Object.keys(list).length) {
    return [];
  }

  if (keyword in list) return [list[keyword]];

  var ret = [];
  for (var k in list) {
    var item = list[k];
    if (item.title.indexOf(keyword) != -1) {
      ret.push(item);
    }
  }
  return ret;
}


var tmpl_choices = _.template([
  '你指定的活动关键字太模糊，请重新选择',
  '',
  '根据关键字"<%= keyword %>"匹配到了<%= items.length %>个活动：',
  '<% _.each(items, function(item, i) { %>' +
    '<%= (i+1) %>. <%= item.title %>',
  '<% }); %>'
].join('\n'));

webot.set('mine action', {
  domain: 'mine',
  pattern: /^(wish|感兴趣|do|mark|canjia|要参加)\s*(.+)\s*$/i,
  handler: function(info, next) {
    if (/^(wish|感兴趣)$/i.test(info.param[1])) {
      var action = 'wish';
    } else {
      var action = 'attend';
    }

    var action_name = action == 'wish' ? '感兴趣' : '要参加';
    var api_path = action == 'wish' ? 'wishers' : 'participants';

    var keyword = info.param[2];
    var matched = get_matched(info.session.event_selections, keyword);

    if (matched.length > 1) {
      return next(null, tmpl_choices(matched));
    }
    if (matched.length == 0) {
      return next(null, '抱歉，我并不知道活动"' + keyword + '"是什么，所以无法处理你的请求');
    }

    var e = matched[0];
    var user = info.user;
    task.user_api(user, function(client) {
      client.post('/v2/event/' + e._id + '/' + api_path, function(err, res) {
        if (err) {
          error('Mark event failed: %s %s %s - %s', user._id, action, e._id, JSON.stringify(err));
          return next(null, '[大哭] 标记活动失败，请重试');
        }
        log('Mark event: %s - %s - %s', user.name, action, e.title);
        e.action = action;
        info.session.event_last_acted = e;
        next(null, '已将活动 <a href="http://www.douban.com/event/' + e._id + '/">' +
                    e.title + '</a> 标记为' + action_name + 
                    '，发送 undo 取消标记');
      });
    });
  }
});


webot.set('mine undo', {
  domain: 'mine',
  pattern: /^(undo|unwish|unmark|取消)$/i,
  handler: function(info, next) {
    var last = info.session.event_last_acted;
    if (!last) {
      return next(null, '并不知道要取消啥操作');
    }

    var action = last.action;
    var action_name = action == 'wish' ? '感兴趣' : '要参加';
    var api_path = 'wish' ? 'wishers' : 'participants';

    task.user_api(info.user, function(client) {
      var e = last;
      client.remove('/v2/event/' + e._id + '/' + api_path, function(err, res) {
        if (err) {
          error('Unmark event failed: %s %s - %s', user._id, e._id, JSON.stringify(err));
          return next(null, 'oops.. 操作失败了耶');
        }
        return next(null, '已取消收藏活动：' + e.title);
      });
    });
  }
});



};
