var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

module.exports = function(webot) {
['location', 'image', 'event', 'other_type', 'parse_loc', 'want_city', 'gala', 'more', 'list'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

webot.set(/^建议(.{4})/, function(info) {
  info.flag = true;
  return '你的意见已经收到，我们会尽快处理。[微笑]';
});
webot.set('羽泉',{
  pattern: function(info) {
    return (/我.*羽泉/).test(info.text) && info.u.getLoc() == '108288';
  },
  handler: function(info) {
    info.flag = true;
    return '你已成功参加《羽泉15周年特别版音乐会》北京抢票活动，如果中奖我们会通过微信直接联系你。\n\n'
    + '<a href="http://www.douban.com/location/partner/event/18875660/">活动详情»</a>';
  }
});

require('js-yaml');

var dialog_files = ['basic.yaml', 'gags.yaml', 'greetings.js', 'love.yaml',
  'praise.yaml', 'bad.yaml', 'lonely.yaml', 'sad.yaml', 'flirt.yaml', 'emoji.yaml', 'short.yaml'];
webot.dialog(dialog_files.map(function(f) {
  return __dirname + '/dialogs/' + f;
}));

['weather', 'jielong', 'wikisource', 'search', 'baidu'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

require('./waits')(webot);
};
