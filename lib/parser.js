var data = require('../data');
var cities = data.cities;

function testContain(str, det) {
  if (str.search(det) !== -1) {
    return str.match(det)[0];
  }
}
function cleanMsg(msg, t) {
  return msg.replace(t, '');
}
function listParam(text) {
  var ret = {};

  var text1 = text.replace(/\s+/, '');
  var msg = text1;

  var p_city = text.split(/\s+/)[0].replace('市', '').replace('县');

  var has_city = false;
  if (p_city in cities.name2id) {
    ret['loc'] = cities.name2id[p_city];
    msg = cleanMsg(msg, p_city);
    has_city = true;
  } else {
    for (var i = 0, l = cities.length; i < l; i++) {
      var item = cities[i];
      // message has city's Chinese name
      var t = testContain(msg, item['name']);
      if (t) {
        ret['loc'] = item['id'];
        has_city = true;
        if (!text.cmd && msg.search(t + '大学') === -1) {
          msg = cleanMsg(msg, t);
        }
        break;
      }
    }
  }
  if (msg.indexOf('搜索') === 0) {
    msg = msg.replace('搜索', '');
  } else {
    if (msg) {
      var day_types = data.day_types;
      for (var j in day_types) {
        var t = testContain(msg, day_types[j]);
        if (t) {
          ret['day_type'] = j;
          msg = cleanMsg(msg, t);
          break;
        }
      }
    }
    if (msg) {
      var types = data.types;
      for (var j in types) {
        var t = testContain(msg, types[j]);
        if (t) {
          ret['type'] = j;
          msg = cleanMsg(msg, t);
          break;
        }
      }
    }
  }

  if (has_city || index.param['day_type'] || index.param['type']) {
    msg = msg.replace(/都?有(什么|哪些)/, '')
    .replace(/活动/g, '')
    .replace('市', '')
    .replace('县', ''); 
  }

  // 城市类型时间都处理完之后，还有剩余字符
  if (msg) {
    // 剩余字符被当做搜索关键字
    // 被替换掉城市等关键字的剩余字符如果和以前一样，使用包含空格的搜索词
    ret['q'] = (msg == text1) ? text.replace('搜索 ', '') : msg;
  }

  return ret;
}
module.exports = {
  listParam: listParam 
};
