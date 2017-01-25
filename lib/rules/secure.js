// get our required modules
const _             = require('underscore');
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
  var uri = url.parse(data.url);

  // if the page is not https, we skip ...
  if((uri.protocol || '').indexOf('https') != 0) {

    // done
    return setImmediate(fn, null);

  }

  // get the page content
  payload.getPageContent(function(err, content) {

    // did we get a error ?
    if(err) {

      // output the error
      payload.error('secure', err);

      // finish error
      return setImmediate(fn, err);

    }

    // content must not be empty
    if(S(content || '').isEmpty() === true) return setImmediate(fn, null);

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
        return setImmediate(fn, err);

      }

      // sanity check that we got the har
      if(!har) return setImmediate(fn, null);
      if(!har.log) return setImmediate(fn, null);
      if(!har.log.entries) return setImmediate(fn, null);

      // did we find our initial page yet ?
      var initialPageFound = false;

      // awesome so first we check all the entries in our HAR
      async.eachLimit(har.log.entries || [], 1, function(entry, cb) {

        // sanity checks
        if(!entry) return setImmediate(cb, null);
        if(!entry.request) return setImmediate(cb, null);
        if(!entry.response) return setImmediate(cb, null);

        // get the url
        var entryUrl = entry.request.url;
        var entryUri = url.parse(entry.request.url);

        // sanity check
        if(!entryUri) return setImmediate(cb, null);

        // check if this is a 200
        if(initialPageFound == false && 
            (entry.response.statusCode || entry.response.status == 200)) {

          // all good
          initialPageFound = true;

        }

        // yes we found it
        if(initialPageFound == false) return setImmediate(cb, null);

        // skip links to current page
        if((entryUri.hostname || '').toLowerCase().indexOf((uri.hostname || '' ).toLowerCase()) != -1 && 
            uri.path.toLowerCase() === entryUri.path.toLowerCase())
              return setImmediate(cb, null);

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

          return (line || '').toLowerCase().indexOf((entryUri.path || '').toLowerCase()) != -1;

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
        setImmediate(cb, null)
        
      }, function(err) {

        // done
        setImmediate(fn, null);

      });

    });

  });

};

    
