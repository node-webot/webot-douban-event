module.exports = function(webot) {


var error = require('debug')('weixin:action:error');
var log = require('debug')('weixin:action:log');
var _ = require('lodash');

var cwd = process.cwd();
var task = require(cwd + '/lib/task');
var LocEvent = require(cwd + '/model/event');
var handle_api_error = require('../utils').handle_api_error;
var keyword_filtered = require('../utils').keyword_filtered;


// save events list array
webot.afterReply(function(info) {
  return Array.isArray(info.reply) && info.reply[0].geo;
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
  info.wait('event select');
});


var tmpl_choices = _.template([
  '关键字"<%= keyword %>"匹配到了<%= items.length %>个活动：',
  '<% _.each(items, function(item, i) { %>' +
    '<%= (i+1) %>. <%= item.link() %>',
  '<% }); %>',
  '',
  '你想标记的到底是哪个呢（请回复数字序号）？'
].join('\n'));


webot.set('event action', {
  domain: 'mine',
  pattern: /^(wish|感兴趣|attend|mark|canjia|要?参加)\s*(.+)\s*$/i,
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
      var matched = keyword_filtered(info.session.event_selections, keyword);

      if (matched.length > 1) {

        info.session.event_reselect = matched;
        info.session.event_reselect_action = action;
        info.wait('event select');

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

    e = LocEvent(e);

    task.user_api(user, function(client) {
      client.post('/v2/event/' + e._id + '/' + api_path, function(err, res) {
        if (err) {
          return handle_api_error(err, '[大哭] 标记活动失败，请重试', info, next);
        }
        log('Mark event: %s - %s - %s', user.name, action, e.title);
        e.action = action;
        info.session.event_last_acted = e;
        next(null, '已将活动 ' + e.link() + ' 标记为' + action_name + 
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
          return handle_api_error(err, 'oops.. 操作失败了耶', info, next);
        }
        delete info.session.event_last_acted;
        return next(null, '已取消收藏活动：' + e.title);
      });
    });
  }
});


var tmpl_list_choices = _.template([
  '你已经发现了以下活动：',
  '',
  '<% _.each(items, function(item, i) { %>' +
    '<%= i+1 %>. <%= item.link() %>',
  '<% }); %>',
  '',
  '请问你要选择哪个活动进行操作呢？(回复数字序号)',
  '',
  '继续点击菜单栏"本周热门"发现更多活动'
].join('\n'));

webot.set('do list', {
  domain: 'mine',
  pattern: /^do|list$/i,
  handler: function(info) {
    var sel = info.session.event_selections;
    if (!sel || !sel.length) {
      return '暂时没有可供选择的活动，先搜索一些活动试试吧';
    }
    delete info.session.event_reselect;
    delete info.session.event_reselect_action;
    info.wait('event select');
    return tmpl_list_choices({ items: LocEvent.loads(sel) });
  }
});

webot.waitRule('event select', function(info, next) {
  var t = parseInt(info.text, 10);
  if (!t) {
    return next(); 
  }
  var reselections = info.session.event_reselect;
  var selections = reselections || info.session.event_selections;
  if (!selections) {
    return next(500);
  }

  var event = selections[t - 1];
  if (!event) {
    info.rewait();
    return next(null, '根本没有这个选项！再试一次？(回复 1 ~ ' + selections.length + ' 的任意数字)');
  }

  var action = info.session.event_reselect_action;
  if (!action) {
    info.wait('event select action');
    info.session.event_selected = t;
    return next(null, '选择将活动 ' + LocEvent(event).link() + ' 标记为：\n\n1. 要参加\n2. 感兴趣\n3. 退出选择');
  }

  info._dou_event = event;
  info._dou_action = action;

  delete info.session.event_reselect;
  delete info.session.event_reselect_action;

  webot.get('event action').handler(info, next);
});

webot.waitRule('event select action', function(info, next) {
  var t = parseInt(info.text, 10);
  if (isNaN(t)) {
    return next(); 
  }
  if (t == 3) {
    info.rewait();
    return next(null, '好的，你可以回复 do 重新查看可操作的活动');
  }
  if (t > 2 || t < 0) {
    info.rewait();
    return next(null, '请输入 1 或 2；1 代表感兴趣，2 代表要参加');
  }

  info.session.event_reselect_action = t == 1 ? 'attend' : 'wish';
  info.text = info.session.event_selected;

  webot.waitRule('event select')[0].handler(info, next);
});


webot.set(/^[0-9]{1,2}$/, '当前并无任何可用选项，回复 do 查看你可以操作的活动，回复 d 查看你可以操作的舞台剧条目');

};
