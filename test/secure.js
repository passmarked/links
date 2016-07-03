// modules
const assert        = require('assert');
const _             = require('underscore');
const async         = require('async');
const path          = require('path');
const passmarked    = require('passmarked');
const fs            = require('fs');
const testFunc      = require('../lib/rules/secure');

// checks warnings that we check for
describe('secure', function() {

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
  it('Should not return a insecure the origin redirect of the page -- http://example.com -> https://www.example.com/test', function(done) {

    var payload = passmarked.createPayload({

      url: 'https://example.com'

    }, require('../samples/secure.redirect.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'secure' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a insecure the origin redirect of the page -- http://example.com -> https://www.example.com', function(done) {

    var payload = passmarked.createPayload({

      url: 'https://example.com'

    }, require('../samples/secure.redirect.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'secure' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should return a error a non-secure asset was requested from a page using HTTPS', function(done) {

    var payload = passmarked.createPayload({

      url: 'https://example.com'

    }, require('../samples/secure.http.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'secure' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error if the page is not HTTPS', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/secure.http.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'secure' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

});
