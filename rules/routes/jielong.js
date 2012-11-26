var pwd = process.cwd();
var chengyu = require(pwd + '/data').chengyu;

var reg_punc = /[。\.\s…\!]/g;
// 成语接龙
module.exports = {
  'pattern': function(info) {
    return info.text && (info.text.replace(reg_punc, '') in chengyu.explain);
  },
  'handler': function(info) {
    var lastChar = info.text[info.text.length - 1]; 
    if (lastChar in chengyu.index) {
      return chengyu.index[lastChar].sample(1)[0];
    }
    return '[大哭]你赢了.. 我接不上这个成语... 换下一个试试吧';
  }
};
