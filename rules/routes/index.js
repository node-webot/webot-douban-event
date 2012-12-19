var webot = require('weixin-robot');

var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var douban = require(pwd + '/lib/douban');

var router = webot.router();

['location', 'image', 'want_city', 'more'].forEach(function(item) {
  router.set(item, require('./' + item));
});

router.set('list', {
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
router.set('weather', require('./weather'));
router.set('jielong', require('./jielong'));
router.set('wikisource', require('./wikisource'));
router.set('search', require('./search'));
router.set('baidu', require('./baidu'));

module.exports = router;
