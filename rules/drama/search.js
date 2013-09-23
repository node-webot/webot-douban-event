var cwd = process.cwd();
var task = require(cwd + '/lib/task');
var conf = require(cwd + '/conf');
var trunc = require(cwd + '/lib/utils').trunc;
var debug = require('debug');
var log = debug('weixin:drama:log');
var error = debug('weixin:drama:error');
var handle_api_error = require('../utils').handle_api_error;
var keyword_filtered = require('../utils').keyword_filtered;
var _ = require('lodash');

function drama_search(keyword, callback) {
  task.api2(function(client) {
    client.get('/v2/drama/search', { q: keyword, count: 4 }, function(err, res) {
      if (err) {
        error('Search drama failed: %s, %s', q, err.statusCode);
        return callback(err);
      }
      if (!res.dramas || !res.dramas.length) {
        return callback(404);
      }
      callback(null, {
        total: res.total,
        items: res.dramas
      });
    });
  });
}
function drama_collect(drama, user, rating, comment, tags, callback) {
  var status = rating > 0 ? 'done' : 'wish';
  task.api(function(oauth2) {
    var client = oauth2.clientFromToken(user.access_token);
    client.post('/v2/drama/' + drama._id + '/collection', {
      status: status,
      rating: rating,
      comment: comment || '',
      tags: tags || '',
    }, function(err, res) {
      console.log(err, res);
      if (err) {
      }
      callback(err, res);
    });
  });
};


function drama_list_mapping(item, i) {
  return {
    title: (i+1) + '. [' + item.cat + ']' + item.title,
    url: item.alt,
    picUrl: item.image,
    description: trunc(item.desc || '', 60)
  };
}
function drama_slist_mapping(item, i) {
  return {
    title: '[' + item.cat + ']' + item.title,
    _id: item.id
  };
}
function drama_link(drama) {
  return drama.title.link(drama_href(drama));
}
function drama_href(drama) {
  return 'http://www.douban.com/location/drama/' + drama._id + '/';
}


var tmpl_drama_search_results = _.template([
  '关键词 "<%= keyword %>" 匹配到：',
  '',
  '<% _.each(items, function(item, i) { %>' +
    '<%= i+1 %>. <a href="http://www.douban.com/location/drama/<%= item._id %>/"><%= item.title %></a>',
  '<% }); %>' +
  '等<%= total %>部舞台剧...',
  '',
  '回复标题前的序号收藏该条目到豆瓣',
  '<% if (total > 4) { %>' +
    '',
    '你可以尝试用更精确的关键词缩小结果范围，如使用舞台剧全名或加上演员、剧院信息' +
  '<% } %>',
].join('\n'));

var tmpl_list_choices = _.template([
  '你上次搜索到的舞台剧有：',
  '',
  '<% _.each(items, function(item, i) { %>' +
    '<%= i+1 %>. <a href="http://www.douban.com/location/drama/<%= item._id %>/"><%= item.title %></a>',
  '<% }); %>',
  '回复标题前的序号开始收藏这部舞台剧到豆瓣',
].join('\n'));


module.exports = function(webot) {


webot.set('search drama', {
  pattern: /^(舞台剧|drama\s+|d\s+)(.+)$/i,
  handler: function(info, next) {
    var keyword = info.param[2];
    drama_search(keyword, function(err, res) {
      if (err == 404) return next(null, '找不到"' + keyword + '"相关的舞台剧，换个关键词试试吧');
      if (err) {
        return next(null, '搜索舞台剧出错了，请稍后再试');
      }

      var sitems = info.session.drama_selection = res.items.map(drama_slist_mapping);
      if (res.total > 4) {
        return next(null, tmpl_drama_search_results({
          keyword: keyword,
          total: res.total,
          items: sitems
        }));
      }

      var items = res.items.map(drama_list_mapping);
      if (items.length === 1) {
        items[0].desc += '(回复 d 给这部剧打分和评论)';
      }
      info.wait('drama select');
      next(err, items);
    });
  },
});

webot.set({
  pattern: /^d$/i,
  domain: 'mine',
  handler: function(info, next) {
    var items = info.session.drama_selection;
    if (!items || !items.length) {
      return next(null, '发送「d 剧名」开始搜索舞台剧');
    }
    if (items.length == 1) {
      info.text = '1';
      return webot.waitRule('drama select')[0].handler(info, next);
    }
    info.wait('drama select');
    next(null, tmpl_list_choices({ items: items }));
  }
});

webot.waitRule('drama select', function(info, next) {
  var selection = info.session.drama_selection;
  if (!selection || !selection.length) {
    return next(null, 'Oops.. 出错了');
  }
  if (info.text === 'd') {
    return next();
  }
  var drama = keyword_filtered(selection, info.text)[0]; 
  if (!drama) {
    console.log(info.rewaitCount);
    if (info.rewaitCount) {
      return next();
    } else {
      info.rewait();
      return next('INVALID_CHOICE');
    }
  }
  info.session.drama_selected = drama;
  info.wait('drama select rate');
  return next(null, ['选择将 ' + drama_link(drama)  + ' 标记为:\n',
         '0. 想看',
         '1. 看过 很差★',
         '2. 看过 较差★★',
         '3. 看过 一般★★★',
         '4. 看过 推荐★★★★',
         '5. 看过 力荐★★★★★',
         '',
         '回复 0~5 的数字'].join('\n'));
});

webot.waitRule('drama select rate', function(info, next) {
  var n = parseInt(info.text, 10);
  if (isNaN(n)) {
    return next();
  }
  if (n > 5) {
    info.rewait();
    return next('INVALID_CHOICE');
  }
  var drama = info.session.drama_selected;
  if (!drama) {
    return next(500);
  }

  var rate = n;
  var is_done = rate > 0;

  drama_collect(drama, info.user, rate, null, null,function(err, res) {
    if (err) {
      info.rewait();
      return handle_api_error(err, '[大哭] 收藏舞台剧失败，请稍后重试', info, next);
    }
    info.session.drama_last_rating = rate;
    return next(null, '已成功收藏 ' + drama.title + ' ！\n\n' +
                      '继续回复【dc 你的评语】，与豆瓣网友分享你对这部剧的看法\n\n' +
                      '剧目详情'.link(drama_href(drama)));
  });
});

webot.set('drama select comment', {
  pattern: /「?d\s*c\s*(.+)」?/i,
  handler: function(info, next) {
    var comment = info.param[1];
    var rating = info.session.drama_last_rating || 0;
    var drama = info.session.drama_selected;
    drama_collect(drama, info.user, rating, comment, null, function(err, res) {
      if (err) {
        info.rewait();
        return handle_api_error(err, '[大哭] 操作失败，请稍后重试', info, next);
      }
      return next(null, '你对 ' + drama.title + ' 的评语已发布！其他人将能在豆瓣网页上看到您的评论。感谢你的分享。\n\n' +
                        '剧目详情'.link(drama_href(drama)));
    });
  }
});


};
module.exports.drama_search = drama_search;
