/* eslint-env mocha */
process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || 'http://sonarr/';
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

require('should');
const path = require('path');
const sinon = require('sinon');
const sonarr = require('../scripts/sonarr.js');
const Helper = require('hubot-test-helper');
const helper = new Helper('../scripts/hubot-sonarr.js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('hubot_sonarr', function () {
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
        'media search tv <query> - Searches sonarrs sources to find information about a tv show',
        'media upcoming tv - Reports what should download in the upcoming day'
      ]);
    });
  });
  describe('media upcoming tv', () => {
    describe("shouldn't work inline", () => {
      it('output title', () => {
        return this.room.user.say('Shell', 'aasdadasdasd media upcoming tv').then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd media upcoming tv']
          ]);
        });
      });
    });
    describe('failure', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().rejects(new Error('Error 500'));

        return this.room.user.say('Shell', '@hubot media upcoming tv').then(() => sleep(1)).then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media upcoming tv'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
      });
    });
    describe('empty response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves([]);

        return this.room.user.say('Shell', '@hubot media upcoming tv').then(() => sleep(1)).then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media upcoming tv'],
            ['hubot', 'Upcoming shows:\n']
          ]);
        });
      });
    });
    describe('single response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves(
          require(path.join(__dirname, '/http_responses/calendar_single_series.json'))
        );
        return this.room.user.say('Shell', '@hubot media upcoming tv')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '@hubot media upcoming tv'],
              ['hubot', "Upcoming shows:\nBob's Burgers - Easy Com-mercial, Easy Go-mercial"]
            ]);
          });
      });
    });
    describe('multiple response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves(
          require(path.join(__dirname, '/http_responses/calendar_multiple_series.json'))
        );
        return this.room.user.say('Shell', '@hubot media upcoming tv')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '@hubot media upcoming tv'],
              ['hubot', 'Upcoming shows:\nExtant - The Other Side,\n' +
                ' Mr. Robot - eps1.8_m1rr0r1ng.qt,\n Why? With Hannibal Buress - Episode 7']
            ]);
          });
      });
    });
  });

  describe('@hubot media search tv batman', () => {
    it("shouldn't work inline", () => {
      return this.room.user.say('Shell', 'aasdadasdasd @hubot media search tv batman')
        .then(() => sleep(10))
        .then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd @hubot media search tv batman']
          ]);
        });
    });
    it('failure', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().rejects(new Error('Error 500'));

      return this.room.user.say('Shell', '@hubot media search tv batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search tv batman'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
    });
    it('empty response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_empty.json'))
      );
      return this.room.user.say('Shell', '@hubot media search tv batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search tv batman'],
            ['hubot', 'No results found for [batman]']
          ]);
        });
    });
    it('single response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_single.json'))
      );
      return this.room.user.say('Shell', '@hubot media search tv batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search tv batman'],
            [
              'hubot',
              'Results for [batman]:\nthe-blacklist) The Blacklist - ' +
              'http://www.imdb.com/title/tt2741602 - http://thetvdb.com/?tab=series&id=266189'
            ]
          ]);
        });
    });
    it('multiple response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_batman.json'))
      );
      return this.room.user.say('Shell', '@hubot media search tv batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '@hubot media search tv batman'],
            ['hubot', 'Results for [batman]:\n' +
              [
                'batman) Batman - http://www.imdb.com/title/tt0059968 - http://thetvdb.com/?tab=series&id=77871',
                'batman-the-brave-and-the-bold) Batman: The Brave and the Bold - http://www.imdb.com/title/tt1213218 - http://thetvdb.com/?tab=series&id=82824',
                'batman-the-animated-series) Batman: The Animated Series - http://www.imdb.com/title/tt0103359 - http://thetvdb.com/?tab=series&id=76168',
                'batman-the-1943-serial) Batman: The 1943 Serial - http://www.imdb.com/title/tt0035665 - http://thetvdb.com/?tab=series&id=93341',
                'the-new-batman-adventures) The New Batman Adventures - http://www.imdb.com/title/tt0118266 - http://thetvdb.com/?tab=series&id=77084',
                'batman-and-robin---the-1949-serial) Batman and Robin - The 1949 Serial - http://www.imdb.com/title/tt0041162 - http://thetvdb.com/?tab=series&id=144771',
                'batman---black-and-white-motion-comics) Batman - Black and White Motion Comics - http://www.imdb.com/title/tt1458796 - http://thetvdb.com/?tab=series&id=103851'
              ].join(', \n')
            ]
          ]);
        });
    });
  });
});
