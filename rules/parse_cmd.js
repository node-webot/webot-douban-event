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
    if (info.cmd === 'stop_search') {
      // 别闹了
      delete info.session.ask_search;
      return '好的，有关自动搜索的设定已重置';
    }
  },
};
