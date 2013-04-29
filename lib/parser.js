var conf = require('../conf');
var data = require('../data');

var request = require('request');

var cities = data.cities;

function testContain(str, det) {
  if (str.search(det) !== -1) {
    return str.match(det)[0];
  }
}
function cleanMsg(msg, t) {
  return msg.replace(t, '');
}
var reg_has = /(有|在|属于|和|与|跟|^)(.+?)(相关|有关)的?有?(么|吗|没有)/;
var reg_punc = /[,，\!！\?？“”\'\"]/g;
function cleanSearchKeyword(q) {
  var m = q.match(reg_has);
  if (m) {
    return m[2];
  }

  q = q.replace(/都?有(什么|哪些)/, '')
  .replace(/我?在/, '')
  .replace('找', '')
  .replace(/活动/g, '')
  .replace('市', '')
  .replace(/.{2}省/, '')
  .replace('县', '') 
  .replace(/的$/, '')
  .replace('搜索', '')
  .replace(reg_punc, '');

  return q;
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
          msg = cleanMsg(msg, '展览会');
          msg = cleanMsg(msg, t);
          if (j === 'music' && msg === '会') {
            msg = '音乐会';
          }
          break;
        }
      }
    }
  }

  // 城市类型时间都处理完之后，还有剩余字符
  if (msg) {
    // 剩余字符被当做搜索关键字
    // 被替换掉城市等关键字的剩余字符如果和以前一样，使用包含空格的搜索词
    ret['q'] = cleanSearchKeyword((msg == text1) ? text : msg);
  }

  return ret;
}


module.exports.geo2loc = function geo2loc(param, cb){
  var options = {
    qs: {
      key: conf.amap,
      resType: 'json',
      encode: 'utf-8',
      range: 3000,
      key: conf.amap,
      roadnum: 0,
      crossnum: 0,
      poinum: 0,
      retvalue: 1,
      sid: 7001,
      region: [param.lng, param.lat].join(',')
    }
  };

  //查询
  request.get('http://restapi.amap.com/rgeocode/simple', options, function(err, res, body){
    if(err){
      return cb(err);
    }
    var data = JSON.parse(body);
    if (data.list && data.list.length>=1){
      data = data.list[0];
      var city = data.city.name || data.province.name;
      return cb(null, city);
    }
    return cb('geo2loc found nth.');
  });
};
module.exports.listParam = listParam;
