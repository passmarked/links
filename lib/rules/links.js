// get our required modules
const _               = require('underscore');
const S               = require('string');
const cheerio         = require('cheerio');
const url             = require('url');
const async           = require('async');

/**
* Checks if any links on the page return a 404
**/
module.exports = exports = function(payload, fn) {

  // data
  var data = payload.getData();

  // get the page content
  payload.getPageContent(function(err, content) {

    // did we get a error ?
    if(err) {

      // output to stderr
      payload.error(err);

      // calback is done
      return fn(err);

    }

    // sanity check if empty
    if(S(content || '').isEmpty() === true)
      return fn(null);

    // local variables to work with
    var lines                 = content.split('\n');
    var last_current_line     = -1;

    // default url
    var uri = url.parse(data.url);

    // list of links that we found to test
    var testableLinks = [];

    // local cheerio instance for lookups
    var $ = cheerio.load(content);

    // get all the links
    $('a').each(function(i, elem) {

      // ref of the link
      var href = $(elem).attr('href');

      // double check that we got a ref ...
      if(S(href || '').isEmpty() === true) return;

      // if the link does not point with a protocol
      // we can assume this is a local link
      if(href.toLowerCase().indexOf('https://') !== 0 &&
          href.toLowerCase().indexOf('http://') !== 0 && 
            href.toLowerCase().indexOf('//') !== 0 && 
            href.toLowerCase().indexOf('/') !== 0) {

        // resolve the path to make a complete url
        href = url.resolve(uri.protocol + "//" + uri.host, href);

      }

      // check that this is a actual url, this should stop
      // a few other links like #,javascript:void(0); too
      if(href.toLowerCase().indexOf('http://') !== 0 &&
           href.toLowerCase().indexOf('https://') !== 0) return;

      // check that this is not a js function
      if(href.match(/^[A-Za-z]+.*\(/gi) !== null) return;

      // now parse the href
      var hrefUri = url.parse(href);

      // could we parse the href ?
      if(!hrefUri) return;

      // skip links to current page
      if(uri.hostname === hrefUri.hostname && 
          uri.path.toLowerCase() === hrefUri.path.toLowerCase())
            return;

      // the final ref
      var hrefTarget = url.format(hrefUri);

      // sanity check
      if(S(hrefTarget || '').isEmpty() === true) return;

      // avoid dups
      if(testableLinks.indexOf(hrefTarget) != -1) return;

      // add the link
      testableLinks.push({

        url:        hrefTarget,
        uri:        hrefUri,
        external:   hrefUri.hostname != uri.hostname

      });

    });

    // keep track of url last lines
    var urlLastLines = {};

    // loop each of the links
    async.each(testableLinks, function(link, cb) {

      // make the callback a singleton, just for some 
      // protection. Was having random casses in <0.12
      // where the callback was being called twice
      var callback = _.once(cb);

      // params for the rule
      var params = {

        url:        link.url,
        display:    'url'

      };

      // get the url
      var entryUri = url.parse(link.url);

      // get the current line
      var build = payload.getSnippetManager().build(lines, urlLastLines[link.url] || -1, entryUri.path);

      // if we found it, this is code !
      if(build) {

        // set as code !!!!!!
        params.display    = 'code';
        params.code       = build;

        // set the last line
        urlLastLines[link.url] = build.subject;

      }

      // http lib to use
      var http = null;

      // try to get the library
      try {

        // pull in the required library
        http = require(link.uri.protocol.replace(/\:/gi, ''));

      } catch(err) {

        /**
        * For now we don't care about this as it just means the
        * user used a likn format we don't understand which can
        * happen in the wild.
        **/
        return callback(null);

      }

      // do a request and kill it before getting the actual body in
      var request = http.get(link.url, function(client) {

        // destroy just as the stream starts
        client.destroy();

        // handle the chunk of data we got in, showing the HTTP status
        client.resume();

        try {

          // get the status code
          var statusCode = 1 * request.parser.incoming.statusCode;

        } catch(err) { return callback(null); }

        // if the status was not healty we report it
        if(statusCode >= 400 && statusCode <= 600) {

          // set the message
          params.identifiers    =   [ link.url, statusCode ];
          params.message        =   '$ return a status code $';

          // add each rule
          payload.addRule({

            type:     'error',
            message:  'Broken links in page content',
            key:      'link'

          }, params)

        }

        // right close the connection
        try {
          request.abort()
        } catch(err) {}

        // done
        callback();

      });

      // handle errors
      request.on('error', function(err) {

        // output error
        payload.error('Problem requesting page contents', err);
        
        // set the message
        params.identifiers      = [ link.url ]
        params.message          = 'Was not able to connect to $'

        // add each rule
        payload.addRule({

          type:       'error',
          message:    'Broken links in page content',
          key:        'link'

        }, params);

        // done
        callback();

      });

      // stand ready with a timeout of 10 seconds
      setTimeout(function() {
        
        // set the message
        params.identifiers      = [ link.url ]
        params.message          = '$ took more than 10 seconds to respond and timed out'

        // add each rule
        payload.addRule({

          type:       'error',
          message:    'Broken links in page content',
          key:        'link'

        }, params)

        // done
        callback()

      }, 10 * 1000);

    }, function(err) {

      // done
      fn(null);

    });

  });

};
