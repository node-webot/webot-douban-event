module.exports = function(webot) {


var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

['location', 'image', 'event', 'other_type',
  'mine', 'lottery',
  'parse_cmd', 'parse_loc', 'want_city', 'gala', 'more', 'list'].forEach(function(item) {
  var mod = require('./' + item);
  if (typeof mod == 'function') {
    mod(webot);
  } else {
    webot.set(item, mod);
  }
});

webot.set(/^建议(.{3})/, function(info) {
  info.flag = true;
  return '你的意见已经收到，我们会尽快处理。[微笑]';
});

require('js-yaml');

var dialog_files = ['basic.yaml', 'gags.yaml', 'greetings.js', 'love.yaml',
  'praise.yaml', 'bad.yaml', 'lonely.yaml', 'sad.yaml', 'flirt.yaml', 'emoji.yaml', 'short.yaml'];
webot.dialog(dialog_files.map(function(f) {
  return __dirname + '/dialogs/' + f;
}));

['jielong', 'wikisource', 'search', 'baidu'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

require('./waits')(webot);
};
