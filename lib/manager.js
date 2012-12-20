var manager = {};

manager.menu = function(req, res, next) {
  var p = req.params.sub || '';
  var subs = ['', 'routes', 'dialogs', 'waits'];
  var subnames = ['首页', '路由', '对话', '侍者'];
  var i = subs.indexOf(p);
  res.locals({
    title: '微信机器人' + (i ? ' - ' + subnames[i] : ''),
    pagename: p,
    subs: subs,
    subnames: subnames
  });
  next();
};
manager.panel = function(robot) {
  return function(req, res, next) {
    var p = req.params.sub;
    if (p === 'routes') {
      res.locals['routes'] = json(robot.router.routes);
    } else if (p === 'dialogs') {
      res.locals['dialogs'] = json(robot.router.dialogs);
    } else if (p === 'waits') {
      res.locals['waits'] = json(robot.waiter.rules);
    } else {
      return next();
    }
    res.render(p);
  };
};
manager.home = function(robot) {
  return function(req, res, next) {
    res.locals['counts'] = {
      'routes': robot.router.routes.length,
      'dialogs': robot.router.dialogs.length,
      'waits': robot.waiter.rules.length
    };
    res.render('panel');
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
