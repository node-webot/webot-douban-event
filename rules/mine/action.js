module.exports = function(webot) {


var error = require('debug')('weixin:action:error');
var log = require('debug')('weixin:action:log');
var _ = require('lodash');

var cwd = process.cwd();
var task = require(cwd + '/lib/task');


// save events list array
webot.afterReply(function(info) {
  return Array.isArray(info.reply);
}, function(info) {
  // for actions
  var sel = info.reply.map(function(item, i) {
    return { _id: item.id, title: item.title };
  });
  var old_sel = info.session.event_selections;
  if (old_sel && Array.isArray(old_sel)) {
    sel = sel.concat(old_sel);
    var seen = {};
    sel = sel.filter(function(item) {
      // 尽管活动 title 也可能重名，我们决定不去解决它
      if (item._id in seen) {
        return false;
      }
      seen[item._id] = 1;
      return true;
    });
    sel = sel.slice(0, 12); // save the last three page
  }
  info.session.event_selections = sel;
});


function get_matched(list, keyword) {
  if (!list || !Array.isArray(list)) {
    return [];
  }
  keyword = keyword.toLowerCase();

  var n = parseInt(keyword, 10);
  if (n) {
    return n <= list.length ? [list[n - 1]] : [];
  }
  ret = list.filter(function(item, i) {
    if (item.title.toLowerCase().indexOf(keyword) != -1) return true;
  });

  return ret;
}


var tmpl_choices = _.template([
  '关键字"<%= keyword %>"匹配到了<%= items.length %>个活动：',
  '<% _.each(items, function(item, i) { %>' +
    '<%= (i+1) %>. <%= item.title.link("http://www.douban.com/event/" + item._id + "/") %>',
  '<% }); %>',
  '',
  '你想标记的到底是哪个呢（请回复数字序号）？'
].join('\n'));


webot.waitRule('event multi choose', function(info, next) {
  var t = parseInt(info.text, 10);
  if (!t) {
    return next(); 
  }
  info._dou_event = info.session.event_reselect[t - 1];
  if (!info._dou_event) {
    info.rewait();
    return next(null, '根本没有这个选项！再试一次？');
  }
  info._dou_action = info.session.event_reselect_action;

  delete info.session.event_reselect;
  delete info.session.event_reselect_action;

  webot.get('mine event action').handler(info, next);
});

webot.set('mine event action', {
  domain: 'mine',
  pattern: /^(wish|感兴趣|attend|mark|canjia|要参加)\s*(.+)\s*$/i,
  handler: function(info, next) {
    var action = info._dou_action;

    if (!action) {
      if (/^(wish|感兴趣)$/i.test(info.param[1])) {
        action = 'wish';
      } else {
        action = 'attend';
      }
    }

    var action_name = action == 'wish' ? '感兴趣' : '要参加';
    var api_path = action == 'wish' ? 'wishers' : 'participants';

    var e = info._dou_event;
    var user = info.user;

    if (!e) {
      var keyword = info.param[2];
      var matched = get_matched(info.session.event_selections, keyword);

      if (matched.length > 1) {

        info.session.event_reselect = matched;
        info.session.event_reselect_action = action;
        info.wait('event multi choose');

        return next(null, tmpl_choices({
          keyword: keyword,
          items: matched
        }));
      }
      if (matched.length == 0) {
        return next(null, '抱歉，我并不知道活动"' + keyword + '"是什么，所以无法处理你的请求');
      }
      e = matched[0];
    }


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
      return next(null, '并不知道要取消什么操作');
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
        delete info.session.event_last_acted;
        return next(null, '已取消收藏活动：' + e.title);
      });
    });
  }
});


var tmpl_list_choices = _.template([
  '你已经发现了这些活动：',
  '',
  '<% _.each(items, function(item, i) { %>' +
    '<%= i+1 %>. <a href="http://www.douban.com/event/<%= item._id %>/"><%= item.title %></a>',
  '<% }); %>',
  '',
  '回复"wish [序号]"标记对活动感兴趣，"mark [序号]"标记要参加活动。其中 [序号] 为活动标题前的数字或标题中的唯一关键字。',
  '',
  '继续点击菜单栏 "本周热门" 发现更多活动'
].join('\n'));

webot.set('list choices', {
  domain: 'mine',
  pattern: /^do|list$/i,
  handler: function(info) {
    var sel = info.session.event_selections;
    if (!sel || !sel.length) {
      return '暂时没有可供选择的活动，先搜索一些活动试试吧';
    }
    return tmpl_list_choices({ items: sel });
  }
});

};
