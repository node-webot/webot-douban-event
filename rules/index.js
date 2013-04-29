var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

module.exports = function(webot) {
['location', 'image', 'event', 'parse_loc', 'want_city', 'gala', 'more', 'list'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

webot.set(/^建议(.{4})/, function(info) {
  info.flag = true;
  return '你的意见已经收到，我们会尽快处理。[微笑]';
});

require('js-yaml');

var dialog_files = ['basic.yaml', 'gags.yaml', 'greetings.js', 'bad.yaml', 'lonely.yaml', 'sad.yaml', 'flirt.yaml', 'emoji.yaml', 'short.yaml'];
webot.dialog(dialog_files.map(function(f) {
  return __dirname + '/dialogs/' + f;
}));

['weather', 'jielong', 'wikisource', 'search', 'baidu'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

require('./waits')(webot);
};
