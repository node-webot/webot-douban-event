var cmds = {
  'search': /search|搜索|\\bs\\b/i,
  'stop_search': /stop_search|别闹了/i
};

module.exports = {
  'handler': function(info) {
    var _text = (info.text || '').trim();
    // parse command
    var lead = _text.split(/\s+/)[0];
    for (var k in cmds) {
      if (cmds[k].test(_text)) {
        info.cmd = k;
      }
    }
  },
};
