var fs = require('fs');
var tmp = fs.readFileSync(__dirname + '/chengyu.txt');
tmp = tmp.toString().split('\n\n');

var chengyu = {
  'index': {},
  'explain': {}
};

tmp.sort().forEach(function(item, i) {
  var index = item.indexOf(' ');
  var word = item.slice(0, index);
  var char0 = word[0];
  var list = chengyu['index'][char0] || (chengyu['index'][char0] = []);
  list.push(word);
  chengyu.explain[word] = item.slice(index);
});

module.exports = chengyu;
