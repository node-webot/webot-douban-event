var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

module.exports = function(webot) {
['location', 'image', 'event', 'want_city', 'more'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

webot.set('list', {
  'pattern': function(info) {
    return !info.param['q'] && !info.cmd;
  },
  'handler': function(info, next) {
    var loc = info.param['loc'];
    if (!loc) return next('CITY_404');

    info.ended = true;
    douban.list(info.param, next);
  }
});

var dialogs = webot.dialogs({
  dir: pwd + '/rules/dialogs',
  files: ['basic', 'gags', 'greetings.js', 'bad', 'lonely', 'sad', 'flirt', 'emoji', 'short']
});
router.dialog(dialogs);

['weather', 'jielong', 'wikisource', 'search', 'baidu'].forEach(function(item) {
  webot.set(item, require('./' + item));
});

};
