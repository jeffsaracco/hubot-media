/* eslint-env mocha */
process.env.HUBOT_RADARR_HTTP = process.env.HUBOT_RADARR_HTTP || 'http://radarr/';
process.env.HUBOT_RADARR_API_KEY = process.env.HUBOT_RADARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

require('should');
const path = require('path');
const sinon = require('sinon');
const radarr = require('../scripts/radarr.js');
const Helper = require('hubot-test-helper');
const helper = new Helper('../scripts/hubot-radarr.js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('hubot_radarr', function () {
  beforeEach(() => {
    this.room = helper.createRoom();
    if (this.mock) {
      if (this.mock.restore) {
        this.mock.restore();
      } else if (this.mock.reset) {
        this.mock.reset();
      } else {
        throw new Error('Not sure what to do with this mock');
      }
    }
  });
  afterEach(() => {
    this.room.destroy();
  });
  describe('help', () => {
    it('all commands', () => {
      this.room.robot.helpCommands().should.eql([
        'media search movies <query> - Searches radarrs sources to find information about a movie',
        'media upcoming movies - Reports what should download in the upcoming day'
      ]);
    });
  });
  describe('media upcoming movies', () => {
    describe("shouldn't work inline", () => {
      it('output title', () => {
        return this.room.user.say('Shell', 'aasdadasdasd media upcoming movies').then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd media upcoming movies']
          ]);
        });
      });
    });
    describe('failure', () => {
      it('output title', () => {
        this.mock = sinon.mock(radarr);
        this.mock.expects('fetchFromRadarr').once().rejects(new Error('Error 500'));

        return this.room.user.say('Shell', '@hubot media upcoming movies').then(() => sleep(1)).then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media upcoming movies'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
      });
    });
    describe('empty response', () => {
      it('output title', () => {
        this.mock = sinon.mock(radarr);
        this.mock.expects('fetchFromRadarr').once().resolves([]);

        return this.room.user.say('Shell', '@hubot media upcoming movies').then(() => sleep(1)).then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media upcoming movies'],
            ['hubot', 'Upcoming movies:\n']
          ]);
        });
      });
    });
    describe('single response', () => {
      it('output title', () => {
        this.mock = sinon.mock(radarr);
        this.mock.expects('fetchFromRadarr').once().resolves(
          require(path.join(__dirname, '/http_responses/radarr_calendar_single_series.json'))
        );
        return this.room.user.say('Shell', '@hubot media upcoming movies')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '@hubot media upcoming movies'],
              ['hubot', 'Upcoming movies:\nWidows']
            ]);
          });
      });
    });
    describe('multiple response', () => {
      it('output title', () => {
        this.mock = sinon.mock(radarr);
        this.mock.expects('fetchFromRadarr').once().resolves(
          require(path.join(__dirname, '/http_responses/radarr_calendar_multiple_series.json'))
        );
        return this.room.user.say('Shell', '@hubot media upcoming movies')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '@hubot media upcoming movies'],
              ['hubot', 'Upcoming movies:\nWidows,\n' +
                ' Ralph Breaks the Internet']
            ]);
          });
      });
    });
  });

  describe('@hubot media search movies batman', () => {
    it("shouldn't work inline", () => {
      return this.room.user.say('Shell', 'aasdadasdasd @hubot media search movies batman')
        .then(() => sleep(10))
        .then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd @hubot media search movies batman']
          ]);
        });
    });
    it('failure', () => {
      this.mock = sinon.mock(radarr);
      this.mock.expects('fetchFromRadarr').once().rejects(new Error('Error 500'));

      return this.room.user.say('Shell', '@hubot media search movies batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search movies batman'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
    });
    it('empty response', () => {
      this.mock = sinon.mock(radarr);
      this.mock.expects('fetchFromRadarr').once().resolves(
        require(path.join(__dirname, '/http_responses/movie_lookup_empty.json'))
      );
      return this.room.user.say('Shell', '@hubot media search movies batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search movies batman'],
            ['hubot', 'No results found for [batman]']
          ]);
        });
    });
    it('single response', () => {
      this.mock = sinon.mock(radarr);
      this.mock.expects('fetchFromRadarr').once().resolves(
        require(path.join(__dirname, '/http_responses/movie_lookup_single.json'))
      );
      return this.room.user.say('Shell', '@hubot media search movies happy gilmore')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search movies happy gilmore'],
            [
              'hubot',
              'Results for [happy gilmore]:\nhappy-gilmore-9614) Happy Gilmore - https://www.themoviedb.org/movie/9614'
            ]
          ]);
        });
    });
    it('multiple response', () => {
      this.mock = sinon.mock(radarr);
      this.mock.expects('fetchFromRadarr').once().resolves(
        require(path.join(__dirname, '/http_responses/movie_lookup_batman.json'))
      );
      return this.room.user.say('Shell', '@hubot media search movies batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search movies batman'],
            ['hubot', 'Results for [batman]:\n' +
              [
                'batman-268) Batman - https://www.themoviedb.org/movie/268',
                'batman-2661) Batman - https://www.themoviedb.org/movie/2661',
                'batman-begins-272) Batman Begins - https://www.themoviedb.org/movie/272',
                'batman-returns-364) Batman Returns - https://www.themoviedb.org/movie/364',
                'batman-robin-415) Batman & Robin - https://www.themoviedb.org/movie/415',
                'batman-forever-414) Batman Forever - https://www.themoviedb.org/movie/414',
                'the-lego-batman-movie-324849) The Lego Batman Movie - https://www.themoviedb.org/movie/324849',
                'batman-ninja-485942) Batman Ninja - https://www.themoviedb.org/movie/485942',
                'batman-v-superman-dawn-of-justice-209112) Batman v Superman: Dawn of Justice - https://www.themoviedb.org/movie/209112',
                'batman-and-harley-quinn-408648) Batman and Harley Quinn - https://www.themoviedb.org/movie/408648'
              ].join(', \n')
            ]
          ]);
        });
    });
  });
});
