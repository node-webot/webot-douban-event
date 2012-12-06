// 从维基文库找诗文
var webot = require('weixin-robot');
var request = webot.request


var reg_recite = /^(背|念|来|吟|唱)(背|念|唱|诵|一?(遍|下|首|曲)|首|\s)[\s《“”\<\>\"\']*(.+?)[\.。…“”》\<\>\"\']*$/;

var reg_content = /<!-- bodycontent -->([\s\S]+?)<!-- \/bodycontent -->/;

var qiyi = "這是一個消歧義頁——使用相同或相近標題，而主題不同的條目列表。如果您是通過某個内部鏈接轉到本頁，希望您能協助將該內部鏈接指向正確的主條目。";

module.exports = {
  'reg_recite': reg_recite,
  'pattern': function(info) {
    var m = info.text && info.text.match(reg_recite);
    if (m) {
      info.kw = m[4];
      return true;
    }
  },
  'handler': function(info, next) {
    var kw = info.kw;
    if (/^.诗$/.test(kw)) {
      return next(null, '发送“背诵 [诗歌名]”，我就能试一下背诵这首诗');
    }
    var waiter = this.waiter;

    kw = kw.trim();
    var tmp = kw.split(/[\s\.]+/);
    console.log(tmp);
    if (tmp.length === 2) {
      kw = tmp[0] + '_(' + tmp[1] + ')';
    } else {
      // wiki supported format
      kw = kw.replace('（', '(').replace('）', ')').replace(/[\s\_]*\(/, '_(');
    }

    var url = 'https://zh.wikisource.org/wiki/' + encodeURIComponent(kw);
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

      cont = cont.replace(/<br[\s\/]*>/g, '');
      cont = cont.replace(/<\/p>/g, '\n');
      cont = cont.replace(/<[^<]+>/g, '');
      cont = cont.replace('消歧义页', '');
      cont = cont.replace(/&#160;/g, '');
      cont = cont.replace(/&lt;/, '');
      cont = cont.replace(/(\n\s*){3,}/g, '\n\n');
      cont = cont.trim();

      if (cont.indexOf(qiyi) !== -1) {
        cont = cont.replace(qiyi, '');
        cont = cont.replace(/(\n\s*){3,}/g, '\n\n');
        cont += '\n\n请输入完整标题';
        waiter.reserve(info.from, 'wikisource');
      }

      var wikilink = '<a href="' + url + '">维基文库</a>';
      if (cont.length > 800) {
        cont = cont.slice(0, 700) + '....\n\n原文太长了，' + wikilink + '有全文';
      } else {
        cont += '\n\n----来自' + wikilink;
      }
      next(null, cont);
    });
  }
};
