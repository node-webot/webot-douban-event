var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

module.exports = function(webot) {
['location', 'image', 'event', 'parse_loc', 'want_city', 'more', 'list'].forEach(function(item) {
  webot.set(item, require('./' + item));
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
