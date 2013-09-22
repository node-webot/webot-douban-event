
function require_login(info, next) {
  var user = info.user;

  if (user.access_token) return next();

  info.user.make_connect_url(function(err, url) {
    if (err) {
      return next(500);
    }
    next(null, '要使用此功能，你需要<a href="' + url + '">先绑定豆瓣账号</a>');
  });
}

function is_token_expired(err) {
  var data = {};
  try {
    data = JSON.parse(err.data);
  } catch (e) {}
  return err.statusCode == 400 && data.code < 200;
}

function handle_api_error(err, msg, info, next) {
  if (is_token_expired(err)) {
    info.user.make_connect_url(function(err, url) {
      if (err) return next(500);
      return next(null, 'T.T 请求失败，请尝试<a href="' + url + '">重新绑定豆瓣帐号</a>');
    });
    return;
  }
  return next('DOUBAN_API_FAIL', msg);
}


function keyword_filtered(list, keyword) {
  if (!list || !Array.isArray(list)) {
    return [];
  }
  keyword = keyword.toLowerCase();

  var n = parseInt(keyword, 10);
  if (n) {
    return n <= list.length ? [list[n - 1]] : [];
  }
  return list.filter(function(item, i) {
    if (item.title.toLowerCase().indexOf(keyword) != -1) return true;
  });
}

module.exports = {
  keyword_filtered: keyword_filtered, 
  handle_api_error: handle_api_error,
  require_login: require_login,
};
