module.exports = function(webot) {


var debug = require('debug');
var log = debug('weixin:special');

webot.set('wechat_event', {
  pattern: function(info) {
    return info.is('event');
  },
  handler: function(info) {
    log('#EVENT: ', info.param);
    var event = info.param.event || '';
    event = event.toLowerCase();
    if (event === 'subscribe') {
      return "感谢关注豆瓣同城微信小秘书！我随时恭候在此，帮你找到身边有趣的同城活动！\n\n"
              + "直接发送你所在的城市名（不用加省份）给我，我就能帮你找到本市近期热门同城活动。\n\n"
              + "发送“帮助”可以查看详细使用指南。";
    } else if (event === 'unsubscribe') {
      //log('User [%s] unsubscribed.', info.uid);
      return '再见!';
    }
    if (event === 'click') {
      info.type = 'text';
      info.text = info.param.eventKey;
      return;
    }
    return 'Oops... 不知道怎么办才好呢... [羞]';
  }
});

webot.set('image', {
  pattern: function(info) {
    return info.is('image');
  },
  handler: function(info, next) {
    next(null, '图片很好看，可惜我暂时看不懂');
  },
});

webot.set('other type', {
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
});

webot.set(/^建议(.{3})/, function(info) {
  info.flag = true;
  return '你的意见已经收到，我们会尽快处理。[微笑]';
});



};
