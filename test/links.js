// modules
const assert        = require('assert');
const _             = require('underscore');
const async         = require('async');
const path          = require('path');
const passmarked    = require('passmarked');
const fs            = require('fs');
const testFunc      = require('../lib/rules/links');
const http          = require('http');

// checks warnings that we check for
describe('links', function() {

  // handle the error output
  it('Should just run if page content was null', function(done) {

    var payload = passmarked.createPayload({

        url: 'http://example.com'

      }, {}, null);

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // done
      done();

    });

  });

  // handle the error output
  it('Should just run if page content was blank', function(done) {

    var payload = passmarked.createPayload({

        url: 'http://example.com'

      }, {}, '');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // done
      done();

    });

  });

  // handle the error output
  it('Should just run if har was blank', function(done) {

    var payload = passmarked.createPayload({

        url: 'http://example.com'

      }, {}, '<p>test</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // done
      done();

    });

  });

  // handle the error output
  it('Should just run if har log was blank', function(done) {

    var payload = passmarked.createPayload({

        url: 'http://example.com'

      }, { log: {} }, '<p>test</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error for links that start with a hash', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, { log: { entries: [] } }, '<p><a href="#">TEST</a></p></body>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'link' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a error for the javascript call in href');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error for links that reference javascript', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, { log: { entries: [] } }, '<p><a href="javascript:void();">TEST</a></p></body>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'link' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a error for the javascript call in href');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error for links that reference javascript functions', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, { log: { entries: [] } }, '<p><a href="test();">TEST</a></p></body>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'link' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a error for the javascript call in href');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error if the target link responds with a status code from 200 to 400', function(done) {

    // we are actually starting servers, so just in case
    // we test on Travis etc with smaller boxes
    this.timeout(5000);

    // create a array of all the status codes
    var statusCodes = [];

    // loop
    for(var i = 200; i < 400; i++) { statusCodes.push(i); }

    async.eachLimit(statusCodes, 1, function(statusCode, cb) {

      // create a server we can call
      var server = http.createServer(function(req, res) {

        res.writeHead(statusCode, {'Content-Type': 'text/plain'});
        res.end('');

      });
      server.listen(0, function() {

        // get the port
        var serverPort = server.address().port;

        var payload = passmarked.createPayload({

          url: 'http://example.com'

        }, { log: { entries: [] } }, '<body><p><a href="http://localhost:' + serverPort + '/hello">TEST</a></p></body>');

        // execute the items
        testFunc(payload, function(err) {

          // check the error
          if(err) assert.fail('Got a error from the function');

          // get the rules
          var rules = payload.getRules();

          // check
          var rule = _.find(rules, function(item) { return item.key == 'link' });

          // should have a error
          if(rule)
            assert.fail('Was not expecting a error for status code ' + statusCode);

          // close the server
          server.close();

          // done
          cb(err);

        });

      });

    }, function(err) {

      // should not return a error
      if(err) assert.fail('Should not return a error');

      // finish
      done();

    });

  });

  // handle the error output
  it('Should return a error if the link returns a status between 400 and 600', function(done) {

    // we are actually starting servers, so just in case
    // we test on Travis etc with smaller boxes
    this.timeout(5000);

    // create a array of all the status codes
    var statusCodes = [];

    // loop
    for(var i = 405; i < 601; i++) { 

      if(i === 405) continue;
      statusCodes.push(i); 

    }

    async.eachLimit(statusCodes, 1, function(statusCode, cb) {

      // create a server we can call
      var server = http.createServer(function(req, res) {

        res.writeHead(statusCode, {'Content-Type': 'text/plain'});
        res.end('');

      });
      server.listen(0, function() {

        // get the port
        var serverPort = server.address().port;

        var payload = passmarked.createPayload({

          url: 'http://example.com'

        }, { log: { entries: [] } }, '<body><p><a href="http://localhost:' + serverPort + '/hello">TEST</a></p></body>');

        // execute the items
        testFunc(payload, function(err) {

          // check the error
          if(err) assert.fail('Got a error from the function');

          // get the rules
          var rules = payload.getRules();

          // check
          var rule = _.find(rules, function(item) { return item.key == 'link' });

          // should have a error
          if(!rule)
            assert.fail('Was expecting a error for status code ' + statusCode);

          // close the server
          server.close();

          // done
          cb(err);

        });

      });

    }, function(err) {

      // should not return a error
      if(err) assert.fail('Should not return a error');

      // finish
      done();

    });

  });

});
