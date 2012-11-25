var pwd = process.cwd();
var user = require(pwd + '/lib/user');

var douban = require(pwd + '/lib/douban');

var unknown_replies = [
  '唉，实在听不懂你在说什么耶...',
  '实在抱歉，暂时不知道您说这话是什么意思..',
  '不太明白你要表达个什么意思... 我智力很有限的！',
  '你刚才说的我没听太懂，但我还在努力学习中，以后说不定就懂了哦~'
]
module.exports = {
  'pattern': function(info) {
    return info.param['q'] && info.param['q'].length < 25;
  },
  'handler': function(info, next) {
    var u = info.u || user(info.from);

    // 如果有搜索关键字
    if (info._ori_loc || info.cmd === 'search') {
      info.ended = true;
      return douban.search(info.param, next);
    }
    var q = info.param['q'];
    var loc = info.param['loc'];
    u.getProp('stop_search', function(err, res){
      if (!res) return next(); // will goto ask search
      return next(null, unknown_replies.sample(1)[0]);
    });
  }
};

