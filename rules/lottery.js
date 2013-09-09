module.exports = function(webot) {

var availables = [
  {
    _id: 'clementine',
    pattern: /橘儿|clementine|菊儿|桔儿|juer/i,
    title: '橘儿2013中国巡回演唱会'
  }
];

function get_matched(keyword) {
  return availables.filter(function(item, i) {
    return keyword.search(item.pattern) != -1;
  });
}

webot.set({
  domain: 'mine',
  pattern: /我想看(.{2,})/i,
  handler: function(info, next) {
    var keyword = info.param[1];
    var matched = get_matched(keyword);

    if (!matched.length) return next(null, '你想看的东西我这儿暂时没有呐，实在不好意思得很');

    var lottery = matched[0];

    info.user.update({
      'active_lottery': lottery._id
    }, function() {
      info.flag = true;
      next(null, '你已成功参加 ' + lottery.title + ' 抢票活动，如果中奖我们会豆邮通知你');
    });
  },
});


};
