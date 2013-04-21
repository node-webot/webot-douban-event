/**
* 从维基文库找诗文
*/
var request = require('request');

var reg_recite = /^(背|念|来|吟|唱)(背|念|唱|诵|一?(遍|下|首|曲)|首|\s)[\s《“”\<\>\"\']*(.+?)[\.。…“”》\<\>\"\']*$/;

var reg_content = /<!-- bodycontent -->([\s\S]+?)<!-- \/bodycontent -->/;
var reg_noprint = /<([\w]+)\s+[^<]+?noprint[^>]+>.*?<\/\1>/g;

var qiyi = "這是一個消歧義頁——使用相同或相近標題，而主題不同的條目列表。如果您是通過某個内部鏈接轉到本頁，希望您能協助將該內部鏈接指向正確的主條目。";

var notable_poets = '辛弃疾 欧阳修 周邦彦 吴文英 李清照 史达祖 王安石 王沂孙 晏几道 晏殊 苏轼 柳永 姜夔 秦观 贺铸 张先 张炎 陆游 李煜 黄庭坚 朱淑真 李之仪 冯延巳 陈与义 朱敦儒 刘辰翁 岳飞 周密 范成大 叶梦德 张泌 范仲淹 张孝祥 赵佶 万俟咏 吕本中 王观 周紫芝 胡铨 黄公度 潘阆 朱熹 黄裳 张耒 阎选 徐俯 孙光宪 顾夐 文天祥 魏承班 李纲 杨万里 戴复古 曾觌 康与之 李重元 唐婉 唐琬 '
notable_poets += '李白 白居易 杜甫 王维 韩愈 柳宗元';

notable_poets = notable_poets.split(' ');

var exports = {
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

    kw = kw.trim();
    var tmp = kw.split(/[\s\.]+/);
    if (tmp.length === 2) {
      kw = tmp[0] + '_(' + tmp[1] + ')';
    } else {
      tmp = kw.split('的');
      if (tmp.length === 2 && notable_poets.indexOf(tmp[0]) !== -1) {
        kw = tmp[1] + '_(' + tmp[0] + ')';
      } else {
        // wiki supported format
        kw = kw.replace('（', '(').replace('）', ')').replace(/[\s\_]*\(/, '_(');
      }
    }

    var url = 'https://zh.wikisource.org/wiki/' + encodeURIComponent(kw);
    request(url, {
      qs: {
        printable: 'yes',
      },
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
        var m = res.body.toString().match(reg_content);
        cont = m && m[1];
      }

      if (!cont) return next(null, '你要我背的东西我不太会诶……换首大家都知道的诗吧！');

      cont = cont.replace(/<br[\s\/]*>/g, '');
      cont = cont.replace(/<\/p>/g, '\n');
      cont = cont.replace(reg_noprint, '');
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
        info.wait('wait_wiki_fulltile');
      }

      var wikilink = '<a href="' + url + '">维基文库</a>';
      if (cont.length > 520) {
        cont = cont.slice(0, 520) + '....\n\n原文太长了，' + wikilink + '有全文';
      } else {
        cont += '\n\n----来自' + wikilink;
      }
      next(null, cont);
    });
  }
};

module.exports = exports;
