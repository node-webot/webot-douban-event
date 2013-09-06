var cmds = {
  'search': /^(search|搜索|\bs\b)\s*/i,
  'stop_search': /stop_search|别闹了/i
};

module.exports = {
  'handler': function(info) {
    var text = info.text;
    // parse command
    var lead = text.split(/\s+/)[0];
    for (var k in cmds) {
      if (cmds[k].test(text)) {
        info.cmd = k;
        info.text = text.replace(cmds[k], '');
      }
    }
  },
};
