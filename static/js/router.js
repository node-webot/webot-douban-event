(function() {
  var reg = /\{(.+?)\}/g;

  $.substitute = function(str, obj) {
    return str.replace(reg, function(p0, p1) {
      return obj[p1] || '';
    });
  };

  function Router(routes){
    this.routes = routes;
  }


  var tmpl_route_item = $('#tmpl-route-item').html();

  Router.prototype.renderItem = function(item) {
    return $.substitute(tmpl_route_item, item);
  };
  Router.prototype.render = function() {
    var routes = this.routes;
    var html = '<ol id="routes-list">';
    for (var i = 0, l = routes.length; i<l; i++) {
      item = routes[i];
      item['id'] = i;
      html += this.renderItem(item);
    }
    return html + '</ol>';
  };
  $.Router = Router;
})();
