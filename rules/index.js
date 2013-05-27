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
webot.set('我想看', {
  pattern: function(info) {
    return (/我想看.{2,}/).test(info.text);
  },
  handler: function(info, next) {
    info.flag = true;
    next();
  },
});
webot.set('寻找初恋',{
  pattern: function(info) {
    return (/(报名|我想看).*寻找初恋/).test(info.text) && info.u.getLoc() == '108296';
  },
  handler: function(info) {
    info.flag = true;
    return '你需要在豆瓣同城上找到「《寻找初恋》专业观众观摩场」活动，点击「我要参加」填写报名表，提供姓名和电话。如果被选中，我们会电话联系你。'
    + '<a href="http://www.douban.com//event/18928228/">活动详情»</a>';
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
