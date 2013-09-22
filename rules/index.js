module.exports = function(webot) {

webot.loads(
  'location', 'special',
  'mine', 'drama', 'lottery', // require login
  'parse_cmd', 'parse_loc', 'want_city',
  'event', 'event/more', 'event/list',
  'dialogs', 'jielong', 'wikisource',
  'event/search', 'waits'
);

};
