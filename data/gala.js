var fs = require('fs');

var cached = {};

function parseIntros(tmp) {
  tmp = tmp.toString().split(/\n{2,}/);
  var ret = {};
  tmp.forEach(function(item) {
    tmp = item.split(/\s*[\:：]\s*\n/)
    if (tmp.length === 2) ret[tmp[0].trim()] = tmp[1].trim();
  });
  return ret;
}

var reg_time = /[\d\:\ \-]+/;
function parseTimeline(tmp) {
  var ret = {};
  tmp = tmp.split(/\n/);
  tmp.forEach(function(item) {
    var time = item.match(reg_time)[0];
    ret[time.trim()] = item.replace(time, '').trim();
  });
  return ret;
}

function parseStage(tmp) {
  var ret = {};
  tmp = tmp.split(/\n{2,}/);
  tmp.forEach(function(item) {
    tmp = item.split(/\s*[\:：]\s*\n/);
    ret[tmp[0]] = parseTimeline(tmp[1]);
  });
  return ret;
}

var reg_dateline = /\s*[\d\-]{6,}\s*\n/;

var cwd = process.cwd();

function load(e) {
  var tmp = fs.readFileSync(cwd + '/static/' + e + '.txt');
  tmp = tmp.toString().split(/\n+={3,}\n+/);

  var result = {};
  tmp.forEach(function(item) {
    var date = item.match(reg_dateline)[0];
    result[date.trim()] = parseStage(item.replace(reg_dateline, '').trim());
  });
  cached[e] = result;
  return result;
}

module.exports = function(e) {
  return cached[e] || load(e);
};
module.exports.intros = parseIntros(fs.readFileSync(__dirname + '/musicians.txt'));
