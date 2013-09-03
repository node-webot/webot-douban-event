var debug = require('debug');
var log = debug('weixin:event');

module.exports = {
  pattern: function(info) {
    return info.is('event');
  },
  handler: function(info, next) {
    var event = info.param.event || '';
    event = event.toLowerCase();
    if (event === 'subscribe') {
      return next(null, "感谢关注豆瓣同城微信小秘书！我随时恭候在此，帮你找到身边有趣的同城活动！\n\n"
      + "直接发送你所在的城市名（不用加省份）给我，我就能帮你找到本市近期热门同城活动。\n\n"
      + "发送“帮助”可以查看详细使用指南。")
    } else if (event === 'unsubscribe') {
      //log('User [%s] unsubscribed.', info.uid);
      return next(null, '再见!');
    }
    if (event === 'click') {
      info.type = 'text';
      info.text = info.param.eventKey;
      return next();
    }
    next(null, 'Oops... 不知道怎么办才好呢... [羞]');
  }
}
