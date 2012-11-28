var pwd = process.cwd();
var chengyu = require(pwd + '/data').chengyu;

var reg_punc = /[。\.\s…\!]/g;

function pick(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

// 成语接龙
module.exports = {
  'pattern': function(info) {
    if (info.text === '成语' || info.text === '成语接龙') {
      info.reply = pick(chengyu.explain);
      return true;
    }
    return info.text && (info.text.replace(reg_punc, '') in chengyu.explain);
  },
  'handler': function(info) {
    if (info.reply) return info.reply;
    var lastChar = info.text[info.text.length - 1]; 
    if (lastChar in chengyu.index) {
      var ret = chengyu.index[lastChar].sample(1)[0];
      return this.waiter.reserve(info.from, 'jielong', ret);
    }
    return '[大哭]你赢了.. 我接不上这个成语... 换下一个试试吧';
  }
};
