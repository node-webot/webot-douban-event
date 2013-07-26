var AuthToken = require('../model/auth');

module.exports = {
  pattern: /^绑定|bd|bang$/i,
  handler: function(info, next) {
    AuthToken.generate(info.uid, 'wechat', function(err, token) {
      console.log(err, token);
      return '<a href="' + token.connect_url() + '">点此绑定豆瓣账号</a>';
    });
  }
};
