var webot = require('weixin-robot');

var reg_search_cmd = /^(百度|baidu)(一下|搜索|search)?\s*(.+)/i;

function do_search(info, next) {
  webot.request('http://www.baidu.com/s', {
    wd: info.param.q
  }, function(err, res) {
    if (err || !res) return next(null, '现在暂时无法搜索，待会儿再来好吗？');

    // 为了兼容不同编码，res 默认是一个 Buffer
    // 调用 toString 方法，转换为 utf-8 的字符串
    res = res.toString();

    var reg_h3t = /<h3 class="t">\s*(.+?)\s*<\/h3>/gi;
    var links = [];
    var i = 1;

    while (true) {
      var m = reg_h3t.exec(res);
      if (!m || i > 5) break;
      links.push(i + '. ' + m[1]);
      i++;
    }

    var ret;
    if (links.length) {
      ret = '在百度搜索到以下结果：\n\n' + links.join('\n');
      ret = ret.replace(/\s*data-click=".*?"/gi,  '');
      ret = ret.replace(/<em>(.*?)<\/em>/gi,  '$1');
      console.log(ret.length);
    } else {
      ret = '搜不到任何结果呢';
    }

    next(null, ret);
  });
}
module.exports = {
  'pattern': function(info) {
    return info.param['q'] && info.param['q'].length < 25;
  },
  'parser': function(info) {
    info.param.q = info.text.match(reg_search_cmd)[3];
    return info;
  },
  'handler': do_search
};

