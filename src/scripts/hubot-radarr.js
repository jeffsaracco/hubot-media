// Description:
//   Radarr Integration
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_RADARR_HTTP - Radarr"s base url
//   HUBOT_RADARR_API_KEY - key key key
//
// Commands:
//   media search movies <query> - Searches radarrs sources to find information about a movie
//   media upcoming movies - Reports what should download in the upcoming day
//
// Notes:
//   Copyright (c) 2015 Gavin Mogan
//   Licensed under the MIT license.
//
// Author:
//   halkeye

'use strict';
var radarr = require('./radarr.js');

/*
 * commands
 * !animeAdd <integer> [<quality]
 */

module.exports = function (robot) {
  robot.radarr = radarr;
  robot.respond(/media upcoming movies/i, function (res) {
    robot.radarr.fetchFromRadarr(robot.radarr.apiURL('calendar'))
      .then(function (body) {
        var movies = body.map(function (movie) {
          return movie.title;
        });
        res.send('Upcoming movies:\n' + movies.join(',\n '));
      }).catch(function (ex) {
        console.log('catch');
        res.send('Encountered an error :( ' + ex);
      });
  });

  robot.respond(/media search movies (.*)/i, function (res) {
    robot.radarr.fetchFromRadarr(
      robot.radarr.apiURL('movie/lookup', { term: res.match[1] })
    ).then(function (body) {
      if (body.length === 0) {
        res.send('No results found for [' + res.match[1] + ']');
        return;
      }
      var movies = body.map(function (movie) {
        var uuid = movie.titleSlug;
        robot.brain.set('searchMovies_movie_' + uuid, movie);
        return [
          uuid + ')',
          movie.title,
          '-',
          'https://www.themoviedb.org/movie/' + movie.tmdbId
        ].join(' ');
      });
      res.send('Results for [' + res.match[1] + ']:\n' + movies.join(', \n'));
    }).catch(function (ex) {
      res.send('Encountered an error :( ' + ex);
    });
  });
};
