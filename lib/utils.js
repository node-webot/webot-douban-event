var lodash = require('lodash');


var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(n) {
  if (n < 10) return '0' + n;
  return n;
}

function format_time(str) {
  var date = new Date(str);
  return pad(date.getMonth() + 1) + '月' + pad(date.getDate()) + '日 ' +
         weekdays[date.getDay()] + ' ' +
         pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function trunc(str, limit) {
  limit = limit || 140;
  return str.length > limit ? str.slice(0, limit - 3) + '..' : str;
}

// Exports to lodash
lodash.format_time = format_time;

module.exports = {
  format_time: format_time,
  trunc: trunc,
  noop: function(){},
  lodash: lodash,
  defaults: lodash.defaults,
  extend: lodash.extend,
  shuffle: lodash.shuffle,
  union: lodash.union,
  difference: lodash.difference,
};
