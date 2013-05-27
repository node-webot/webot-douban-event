var pwd = process.cwd();
var user = require(pwd + '/model/user');

var douban = require(pwd + '/lib/douban');

var unknown_replies = [
  '唉，实在听不懂你在说什么耶...',
  '实在抱歉，暂时不知道您说这话是什么意思..',
  '不太明白你要表达个什么意思... 我智力很有限的！',
  'Remember, you can always type "search xxx" to search for events related to xxx',
  '你刚才说的我没听太懂，但我还在努力学习中，以后说不定就懂了哦~'
];

var direct_search = /音乐会|话剧|孟京辉|约会|相亲/i;

module.exports = {
  'pattern': function(info) {
    var ret = info.param['q'] && info.param['q'].length < 25;
    if (ret && direct_search.test(info.text)) {
      info.cmd = 'search';
    }
    return ret;
  },
  'handler': function(info, next) {
    var u = info.u || user(info.from);

    // 如果有搜索关键字
    if (info._ori_loc || info.cmd === 'search') {
      info.ended = true;
      return douban.search(info.param, next);
    }

    var loc = info.param['loc'];
    u.getProp('stop_search', function(err, res){
      if (!res) {
        // 请求为“别闹了”
        if (info.cmd === 'stop_search') return next(null, '好好好... 都听你的...');
        return next(); // will goto ask search
      }

      if (info.cmd === 'stop_search') {
        // 别闹了
        u.delProp('stop_search', function() {
          info.ended = true;
          return next(null, '好的，有关自动搜索的设定已重置');
        });
      } else if (res == 2) {
        // stop_search === 2 时，总是自动搜索
        info.ended = true;
        return douban.search(info.param, next);
      } else {
        // 已停止询问搜索
        return next(null, unknown_replies.sample(1)[0]);
      }
    });
  }
};

