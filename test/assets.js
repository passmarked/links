// modules
const assert        = require('assert');
const _             = require('underscore');
const async         = require('async');
const path          = require('path');
const passmarked    = require('passmarked');
const fs            = require('fs');
const testFunc      = require('../lib/rules/assets');

// checks warnings that we check for
describe('assets', function() {

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
  it('Should not return a error if all items in the HAR return a OK (200)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.good.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error if all items in the HAR contained a redirect (302)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.redirect.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should not return a error if all items in the HAR contained a info (100)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.info.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(rule)
        assert.fail('Was not expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should return a error if the HAR contained a notfound (404)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.notfound.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(!rule)
        assert.fail('Was expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should return a error if the HAR contained a access denied defined (401)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.access.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(!rule)
        assert.fail('Was expecting a rule');

      // done
      done();

    });

  });

  // handle the error output
  it('Should return a error if the HAR contained a server error (501)', function(done) {

    var payload = passmarked.createPayload({

      url: 'http://example.com'

    }, require('../samples/assets.error.json'), '<p>TEST</p>');

    // execute the items
    testFunc(payload, function(err) {

      // check the error
      if(err) assert.fail('Got a error from the function');

      // get the rules
      var rules = payload.getRules();

      // check
      var rule = _.find(rules, function(item) { return item.key == 'asset' });

      // should have a error
      if(!rule)
        assert.fail('Was expecting a rule');

      // done
      done();

    });

  });

});
