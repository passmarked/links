// get our required modules
const _               = require('underscore');
const S               = require('string');
const cheerio         = require('cheerio');
const url             = require('url');
const async           = require('async');
const request         = require('request');

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
      return setImmediate(fn, err);

    }

    // sanity check if empty
    if(S(content || '').isEmpty() === true)
      return setImmediate(fn, null);

    // local variables to work with
    var lines                 = content.split('\n');
    var last_current_line     = -1;

    // default url
    var uri = url.parse(data.url);

    // list of links that we found to test
    var testableLinks   = [];
    var testingSlugs    = [];

    // local cheerio instance for lookups
    var $ = cheerio.load(content);

    // get all the links
    $('body a').each(function(i, elem) {

      // ref of the link
      var href = S($(elem).attr('href') || '').trim().s;

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

      // check if it starts with relative
      if(href.indexOf('//') == 0) {

        // set it
        href = uri.protocol + href;

      } else if(href.indexOf('/') == 0) {

        // set it
        href = uri.protocol + '//' + uri.host + href;

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
          uri.pathname.toLowerCase() === hrefUri.pathname.toLowerCase())
            return;

      // the final ref
      var hrefTarget    = url.format(hrefUri);
      var hrefSlugged   = S(hrefTarget).slugify().s;

      // sanity check
      if(S(hrefTarget || '').isEmpty() === true) return;

      // avoid dups
      if(testingSlugs.indexOf(hrefSlugged) != -1) return;

      // add it
      testingSlugs.push(hrefSlugged);

      // add the link
      testableLinks.push({

        url:        S(hrefTarget).trim().s,
        uri:        hrefUri,
        external:   hrefUri.hostname != uri.hostname

      });

    });

    // keep track of url last lines
    var urlLastLines = {};

    // loop each of the links
    async.eachLimit(testableLinks || [], 100, function(link, cb) {

      // params for the rule
      var params = {

        url:        link.url,
        display:    'url'

      };

      // get the url
      var entryUri  = url.parse(link.url);

      // get the current line
      var build     = payload.getSnippetManager().build(lines, urlLastLines[link.url] || -1, entryUri.path);

      // if we found it, this is code !
      if(build) {

        // set as code !!!!!!
        params.display    = 'code';
        params.code       = build;

        // set the last line
        urlLastLines[link.url] = build.subject;

      }

      // do the requests
      payload.doRequest({

        url:      link.url,
        type:     'GET',
        session:  data.session,
        kill:     true

      }, function(err, response, body) {

        // get the status code
        var statusCode = parseInt((response || {}).statusCode || '');

        // check for timeout
        if(err && 
            err.code === 'ETIMEDOUT') {

          // output error
          payload.error('Problem requesting page contents timed out', err);
          
          // set the message
          params.identifiers      = [ link.url, 10 ]
          params.message          = 'GET request to $ timed out after $ seconds'

          // add each rule
          payload.addRule({

            type:       'error',
            message:    'Broken links in page content',
            key:        'link'

          }, params);

        } else if(err && 
            err.code === 'ECONNREFUSED') {

          // output error
          payload.error('Problem requesting page contents', err);
          
          // set the message
          params.identifiers      = [ link.url ]
          params.message          = 'Unable to verify that $ is working with GET request'

          // add each rule
          payload.addRule({

            type:       'error',
            message:    'Broken links in page content',
            key:        'link'

          }, params);

        } else if(!err && 
            statusCode !== null && 
              statusCode !== undefined && 
                statusCode !== NaN &&
                  statusCode !== 405 &&
                    statusCode !== 403 &&
                      statusCode > 400 && 
                        statusCode <= 500) {

          // set the message
          params.identifiers    =   [ link.url, statusCode ];
          params.message        =   '$ returned status code of $';

          // add each rule
          payload.addRule({

            type:         link.external === true ? 'notice' : 'error',
            message:      'Broken links in page content',
            key:          'link'

          }, params);

        }

        // done
        setImmediate(cb, null);

      });

    }, function(err) {

      // done
      setImmediate(fn, null);

    });

  });

};
