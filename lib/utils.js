var lodash = require('lodash');


var weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function pad(n) {
  if (n < 10) return '0' + n;
  return n;
}

function format_time(str) {
  var date = new Date(str);
  return pad(date.getMonth()) + '月' + pad(date.getDay()) + '日 ' +
         weekdays[date.getDay() - 1] + ' ' +
         pad(date.getHours()) + ':' + pad(date.getMinutes());
}

// Exports to lodash
lodash.format_time = format_time;

module.exports = {
  format_time: format_time,
  noop: function(){},
  lodash: lodash,
  defaults: lodash.defaults,
  extend: lodash.extend,
  shuffle: lodash.shuffle,
  union: lodash.union,
  difference: lodash.difference,
};
