module.exports = {
  pattern: function(info) {
    return !info.is('text');
  },
  handler: function(info) {
    info.flag = true;
    if (info.is('voice')) {
      return '抱歉，我暂时还「听」不懂人话，请用文字与我交流吧';
    }
    return '暂时还不知道怎么处理这种消息诶...';
  },
};
