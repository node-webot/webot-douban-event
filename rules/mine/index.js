module.exports = function(webot) {

webot.domain('mine', function(info, next) {
  var user = info.user;

  if (user.access_token) return next();

  info.user.make_connect_url(function(err, url) {
    if (err) return next(500);
    next(null, '要使用此功能，你需要<a href="' + url + '">先绑定豆瓣账号</a>');
  });
});

['bind', 'action', 'list'].forEach(function(item) {
  require('./' + item)(webot);
});

};
