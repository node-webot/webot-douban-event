var manager = {};

manager.panel = function(robot) {
  return function(req, res, next) {
    var p = req.params.sub;
    var subs = ['panel', 'routes', 'dialogs', 'waits'];
    var subnames = ['所有', '路由', '对话', '侍者'];
    var i = subs.indexOf(p);
    if (i == -1) return next();

    var data = {
      title: '微信机器人' + (i ? ' - ' + subnames[i] : ''),
      pagename: p,
      subs: subs,
      subnames: subnames
    };

    if (p === 'routes' || p === 'panel') {
      data['routes'] = json(robot.router.routes);
    }
    if (p === 'dialogs' || p === 'panel') {
      data['dialogs'] = json(robot.router.dialogs);
    }
    if (p === 'waits' || p === 'panel') {
      data['waits'] = json(robot.waiter.rules);
    }
    res.render(p, data);
  };
};

function json(obj){
  var str = JSON.stringify(obj, function(key, item) {
    if (typeof item == 'function' || item instanceof RegExp) return item.toString();
    return item;
  });
  return JSON.parse(str);
}

manager.routes = function(robot) {
  return function(req, res, next) {
    res.json(json(robot.router.routes));
  };
};
manager.dialogs = function(robot) {
  return function(req, res, next) {
    res.json(json(robot.router.dialogs));
  };
};

module.exports = manager;
