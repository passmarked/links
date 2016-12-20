// get our required modules
const _             = require('underscore');
const needle        = require('needle');
const cheerio       = require('cheerio');
const url           = require('url');
const async         = require('async');
const S             = require('string');

/**
* Checks if any of the links on the page are non-secure when on https
**/
module.exports = exports = function(payload, fn) {

  // get the data
  var data = payload.getData();

  // parse the url
  var uri = url.parse(data.redirected || data.url);

  // if the page is not https, we skip ...
  if(uri.protocol !== 'https:') return fn(null);

  // get the page content
  payload.getPageContent(function(err, content) {

    // did we get a error ?
    if(err) {

      // output the error
      payload.error(err);

      // finish error
      return fn(err);

    }

    // content must not be empty
    if(S(content || '').isEmpty() === true) return fn(null);

    // parse out our line strs
    var lines = content.split('\n')
    var last_current_line = -1;

    // get the page content
    payload.getHAR(function(err, har) {

      // did we get a error ?
      if(err) {

        // output to stderr
        payload.error(err);

        // done
        return fn(err);

      }

      // sanity check that we got the har
      if(!har) return fn(null);
      if(!har.log) return fn(null);
      if(!har.log.entries) return fn(null);

      // awesome so first we check all the entries in our HAR
      async.each(har.log.entries || [], function(entry, cb) {

        // sanity checks
        if(!entry) return cb(null);
        if(!entry.request) return cb(null);
        if(!entry.response) return cb(null);

        // get the url
        var entryUrl = entry.request.url;
        var entryUri = url.parse(entry.request.url);

        // sanity check
        if(!entryUri) return cb(null);

        // skip links to current page
        if(uri.hostname === entryUri.hostname && 
            uri.path.toLowerCase() === entryUri.path.toLowerCase())
              return cb(null);

        // params for the rule
        var params = {

          url:        entryUrl,
          external:   false,
          code:       entry.response.status,
          timing:     1 * entry.time,
          display:    'url'

        };

        // get the current line
        var build = payload.getSnippetManager().build(lines, last_current_line, function(line) {

          return line.toLowerCase().indexOf((entryUri.path || '').toLowerCase()) != -1;

        });

        // check if we found the asset
        if(build) {

          // set as code !!!!!!
          params.display      = 'code';
          params.code         = build;

        }

        // check the status of the request
        if(entryUrl.indexOf('http://') === 0) {

          // add to payload
          payload.addRule({

            type:         'critical',
            message:      'Non-Secure assets on secure page',
            key:          'secure'

          }, _.extend({}, params, {

              message:      '$ references a non-secure asset on secure page, causing the mixed-content warning from browsers',
              identifiers:  [ entryUrl, data.redirected || data.url ]

            }))

        }
        
        // done
        cb(null)
        
      }, function(err) {

        // done
        fn(null);

      });

    });

  });

};

    
