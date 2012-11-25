var webot = require('weixin-robot');

var pwd = process.cwd();
var data = require(pwd + '/data');
var cities = data.cities;

var user = require(pwd + '/lib/user');
var parser = require(pwd + '/lib/parser');
var douban = require(pwd + '/lib/douban');

var router = webot.router();

['location', 'want_city', 'more'].forEach(function(item) {
  router.set(item, require('./' + item));
});

router.set('list', {
  'pattern': function(info) {
    return !info.param['q'];
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
  files: ['basic', 'gags', 'greetings.js', 'bad', 'lonely', 'flirt', 'emoji', 'short']
});
router.dialog(dialogs);
router.set('weather', require('./weather'));
router.set('search', require('./search'));

module.exports = router;
