var pwd = process.cwd();
var douban = require(pwd + '/lib/douban');

var unknown_replies = [
  '唉，实在听不懂你在说什么耶...',
  '实在抱歉，暂时不知道您说这话是什么意思..',
  '不太明白你要表达个什么意思... 我智力很有限的！',
  'Remember, you can always type "search xxx" to search for events related to xxx',
  '你刚才说的我没听太懂，但我还在努力学习中，以后说不定就懂了哦~'
];

var direct_search = /孟京辉|约会|相亲/i;

module.exports = {
  'pattern': function(info) {
    var t = info.param['q'] && info.param['q'].length < 25;
    if (t && direct_search.test(info.text)) {
      info.cmd = 'search';
    }
    return t;
  },
  'handler': function(info, next) {
    var u = info.user;

    function do_search() {
      var param = info.session.last_param = info.param;
      param['_wx_act'] = 'search';
      info.ended = true;
      return douban.event.search(param, next);
    }
    // 如果有搜索关键字
    if (info._ori_loc || info.cmd === 'search') {
      return do_search();
    }

    var loc = info.param['loc'];
    var ask_search = info.session.ask_search;

    if (!ask_search) {
      if (info.cmd === 'stop_search') return next(null, '好好好... 都听你的...');
      return next(); // will goto ask search
    }

    // ask_search === 2 时，总是自动搜索
    if (ask_search == 2) {
      return do_search();
    }

    // 已停止询问搜索，随机回复我不懂你
    return next(null, unknown_replies.sample(1)[0]);
  }
};

