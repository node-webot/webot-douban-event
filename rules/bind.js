var AuthToken = require('../model/auth');

module.exports = {
  pattern: /^绑定|bd|bang|bind$/i,
  handler: function(info, next) {
    info.user.make_connect_url(function(err, url) {
      if (err) return next(500);
      next(null, '<a href="' + url + '">点此绑定豆瓣账号</a>');
    });
  }
};
