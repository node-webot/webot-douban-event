// 从维基文库找诗文
var webot = require('weixin-robot');
var request = webot.request


var reg_recite = /^背(诵|一遍|首|\s)[\s《“”\<\>\"\']*(.+?)[\.。…“”》\<\>\"\']*$/;

var reg_content = /<!-- bodycontent -->([\s\S]+?)<!-- \/bodycontent -->/;

module.exports = {
  'pattern': function(info) {
    var m = info.text && info.text.match(reg_recite);
    if (m) {
      info.kw = m[2];
      return true;
    }
  },
  'handler': function(info, next) {
    var kw = info.kw;
    if (/^.诗$/.test(kw)) {
      return next(null, '发送“背诵 [诗歌名]”，我就能试一下背诵这首诗');
    }
    var url = 'http://zh.wikisource.org/wiki/' + kw;
    request(url, {
      printable: 'yes',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Charset': 'UTF-8,*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11'
      }
    }, function(err, res) {
      var cont;
      if (!err && res) {
        var m = res.toString().match(reg_content);
        cont = m && m[1];
      }

      if (!cont) return next(null, '你要我背的东西我不太会诶……换首大家都知道的诗吧！');

      cont = cont.replace(/<br[\s\/]*>/g, '\n');
      cont = cont.replace(/<\/p>/g, '\n\n');
      cont = cont.replace(/<[^<]+>/g, '');
      cont = cont.replace(/[\n]{3,}/g, '\n\n');

      var wikilink = '<a href="' + url + '">维基文库</a>';
      if (cont.length > 300) {
        cont = cont.slice(0, 300) + '...\n\n(原文太长了，自己去' + wikilink + '看吧)';
      } else {
        cont += '\n\n----来自' + wikilink;
      }
      next(null, cont);
    });
  }
};
