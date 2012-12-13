$.get('/routes', function(ret) {
  var router = new $.Router(ret);
  $('#routes').html(router.render());
});
