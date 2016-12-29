// get our required modules
const _             = require('underscore');
const cheerio       = require('cheerio');
const url           = require('url');
const async         = require('async');
const S             = require('string');

/**
* Checks if any assets on the page are broken
**/
module.exports = exports = function(payload, fn) {

  // get the data
  var data = payload.getData();

  // parse the url
  var uri = url.parse(data.redirected || data.url);

  // get the page content
  payload.getPageContent(function(err, content) {

    // did we get a error ?
    if(err) {

      // output the error
      payload.error(err);

      // finish error
      return setImmediate(fn, err);

    }

    // content must not be empty
    if(S(content || '').isEmpty() === true) 
      return fn(null);

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
      if(!har) return fn(null);
      if(!har.log) return fn(null);
      if(!har.log.entries) return fn(null);

      // awesome so first we check all the entries in our HAR
      async.eachLimit(har.log.entries || [], 20, function(entry, cb) {

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
            (uri.path || '').toLowerCase() === (entryUri.path || '').toLowerCase())
              return cb(null);

        // the header
        var headerValue = '';

        // check the type
        for(var i = 0 ; i < (entry.response.headers || []).length; i++) {

          // get the val
          if((entry.response.headers[i].name || '').toLowerCase() != 'content-type') {

            // done
            continue;

          }

          // get the value
          headerValue = (entry.response.headers[i].value || '').toLowerCase();

        }

        // avoid a blank item
        if(S(headerValue).isEmpty() === true) {

          // done
          return setImmediate(cb, null);

        }

        // check the item
        if(headerValue.indexOf('text/html') !== -1) {

          // done
          return setImmediate(cb, null);

        }

        // check the item
        if(headerValue.indexOf('text/plain') !== -1) {

          // done
          return setImmediate(cb, null);

        }

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

        // get the status code
        var status = 1 * entry.response.status;

        // check the status of the request
        if(status >= 400) {

          // too slow, add to payload
          payload.addRule({

            type:           'error',
            message:        'Broken links to page assets',
            key:            'asset'

          }, _.extend({}, params, {

              message:      '$ responded with a $ error',
              identifiers:  [

                entryUrl,
                entry.response.status

              ]

            }));

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

    
