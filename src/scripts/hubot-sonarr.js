// Description:
//   Sonarr Integration
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_SONARR_HTTP - Sonarr"s base url
//   HUBOT_SONARR_API_KEY - key key key
//
// Commands:
//   media search tv <query> - Searches sonarrs sources to find information about a tv show
//   media upcoming tv - Reports what should download in the upcoming day
//
// Notes:
//   Copyright (c) 2015 Gavin Mogan
//   Licensed under the MIT license.
//
// Author:
//   halkeye

'use strict';
var sonarr = require('./sonarr.js');

module.exports = function (robot) {
  robot.sonarr = sonarr;
  robot.respond(/media upcoming tv/i, function (res) {
    robot.sonarr.fetchFromSonarr(robot.sonarr.apiURL('calendar'))
      .then(function (body) {
        var shows = body.map(function (show) {
          return show.series.title + ' - ' + show.title;
        });
        res.send('Upcoming shows:\n' + shows.join(',\n '));
      }).catch(function (ex) {
        console.log('catch');
        res.send('Encountered an error :( ' + ex);
      });
  });

  robot.respond(/media search tv (.*)/i, function (res) {
    robot.sonarr.fetchFromSonarr(
      robot.sonarr.apiURL('series/lookup', { term: res.match[1] })
    ).then(function (body) {
      if (body.length === 0) {
        res.send('No results found for [' + res.match[1] + ']');
        return;
      }
      var shows = body.map(function (show) {
        var uuid = show.titleSlug;
        robot.brain.set('searchTV_show_' + uuid, show);
        return [
          uuid + ')',
          show.title,
          '-',
          'http://www.imdb.com/title/' + show.imdbId,
          '-',
          'http://thetvdb.com/?tab=series&id=' + show.tvdbId
        ].join(' ');
      });
      res.send('Results for [' + res.match[1] + ']:\n' + shows.join(', \n'));
    }).catch(function (ex) {
      res.send('Encountered an error :( ' + ex);
    });
  });
};
