
'use strict';

/**
 * Module dependencies.
 */

const resolve = require('path').resolve;
const assert = require('assert');
const debug = require('debug')('koa-static');
const send = require('koa-send');

/**
 * Expose `serve()`.
 */

module.exports = serve;

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve(root, opts) {
  opts = opts || {};

  assert(root, 'root directory is required to serve files');

  // options
  debug('static "%s" %j', root, opts);
  opts.root = resolve(root);
  var namespace = (opts.namespace || '/').trim();
  if (namespace.charAt(0) !== '/') namespace = '/' + namespace; // prefix with /
  if (opts.index !== false) opts.index = opts.index || 'index.html';

  function getPath(ctx) {
    return ctx.path.replace(namespace, '/').replace('//', '/')
  }

  if (!opts.defer) {
    return function *serve(next){
      if (this.path.indexOf(namespace) === 0 && (this.method == 'HEAD' || this.method == 'GET')) {
        if (yield send(this, getPath(this), opts)) return;
      }
      yield* next;
    };
  }

  return function *serve(next){
    yield* next;

    if (this.path.indexOf(namespace) !== 0) return;
    if (this.method != 'HEAD' && this.method != 'GET') return;
    // response is already handled
    if (this.body != null || this.status != 404) return;
    this.set('Cache-Control', 'max-age=' + (opts.maxAge || 31536000));
    yield send(this, getPath(this), opts);
  };
}

