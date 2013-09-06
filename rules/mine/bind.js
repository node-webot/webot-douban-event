module.exports = function(webot) {


var AuthToken = require('../../model/auth');
var conf = require('../../conf');


webot.set(/^(绑定|bd|bang|bind|login)$/i, function(info, next) {
  info.user.make_connect_url(function(err, url) {
    if (err) return next(500);
    next(null, '<a href="' + url + '">点此绑定豆瓣账号</a>');
  });
});

webot.set(/^我的同城$/i, function(info) {
  var msg = '';
  if (!info.user.access_token) {
    msg += '发送“绑定”开始绑定你的豆瓣帐号到微信。绑定成功后即可在微信里标记活动为要参加或感兴趣。\n\n';
  } else {
    msg += '你已成功绑定豆瓣帐号！\n\n';
  }
  msg += '发送“mine”查看你要参加的活动，发送“wish”查看你感兴趣的活动\n\n' +
         '<a href="'+ conf.site_root +'auth/help">点此查看详细指南</a>';
  return msg;
});

webot.set(/^(解绑|解除绑定|unbind|logout)$/i, function(info, next) {
  if (!info.user.access_token) return next(null, '你并没有绑定豆瓣帐号呢，发送 bind 开始绑定');
  info.user.update({
    access_token: null
  }, function(err) {
    if (err) return next(null, '解除帐号绑定失败，请重试');
    return next(null, '已成功解除绑定');
  });
});

};
