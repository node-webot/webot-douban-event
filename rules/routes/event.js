
module.exports = function(info, next) {
  if (info.param.event === 'subscribe') {
    return next(null, "感谢关注豆瓣同城微信小秘书！我随时恭候在此，帮你找到身边有趣的同城活动！\n\n"
    + "直接发送你所在的城市名给我，我就能帮你找到本市近期热门同城活动。收到活动后，直接回复“更多”即可浏览更多活动。\n\n"
    + "发送“帮助”可以查看详细使用指南。")
  } else if (info.param.event === 'unsubscribe') {
    return next(null, '再见!');
  }
  return next(null, '你好');
};
