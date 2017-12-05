/*!
 * serve-favicon
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict' //�ϸ�ģʽ

/**
 * Module dependencies.//ģ������
 * @private//˽��
 */
//safe-buffer��etag��fs��ms��parseurl��path������ģ���ļ�
var Buffer = require('safe-buffer').Buffer
var etag = require('etag')
var fresh = require('fresh')
var fs = require('fs')  //�ļ�ģ��
var ms = require('ms')
var parseUrl = require('parseurl') 
var path = require('path')  //·��
var resolve = path.resolve

/**
 * Module exports.//ģ�����
 * @public//����
 */

module.exports = favicon   //����Ϊfavicon

/**
 * Module variables.//ģ�����
 * @private//˽��
 */

var ONE_YEAR_MS = 60 * 60 * 24 * 365 * 1000 // 1 year

/**
 * Serves the favicon located by the given `path`.//ָ��·���ṩͼ��
 *
 * @public
 * @param {String|Buffer} path //������path·��string|buffer
 * @param {Object} [options] //������    object����
 * @return {Function} middleware//����ֵ��middleware�м�� function
 */

function favicon (path, options) {
  var opts = options || {}

  var icon // favicon cache  //����
  var maxAge = calcMaxAge(opts.maxAge)  //������ĺ���

  if (!path) {  //���·�������׳�����path to favicon.ico is required
    throw new TypeError('path to favicon.ico is required')
  }

  if (Buffer.isBuffer(path)) {  //���·���Ƿ�Ϊbuffer����
    icon = createIcon(Buffer.from(path), maxAge)  //�����溯��
  } else if (typeof path === 'string') {  //���·���Ƿ����ַ���
    path = resolveSync(path) �����溯��
  } else {  //·������buffer���ַ����׳�����path to favicon.ico must be string or buffer
    throw new TypeError('path to favicon.ico must be string or buffer')
  }

  return function favicon (req, res, next) {   //���غ���
    if (parseUrl(req).pathname !== '/favicon.ico') { //������URL��ַ��Ϊ�ܶಿ�֣���ȡpathname
      next()  //ִ��next����
      return  //�˳�
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { //����ʽ����GET��HEAD
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405 //����ʽ����ͻ��˲鿴�������������򷵻�200�ɹ������򷵻�405�ͻ��˴���
      res.setHeader('Allow', 'GET, HEAD, OPTIONS') //������Ӧͷ
      res.setHeader('Content-Length', '0')
      res.end() //��Ӧ����
      return  //�˳�
    }

    if (icon) {//�����������ͼ��
      send(req, res, icon) //�������ӵ�socket�˿ںŷ������ݣ������溯��
      return //�˳�
    }

    fs.readFile(path, function (err, buf) {//���û��ͼ�꣬��ָ����·���ﴴ��һ��������һ��buf
      if (err) return next(err)
      icon = createIcon(buf, maxAge)
      send(req, res, icon)//��������
    })
  }
}

/**
 * Calculate the max-age from a configured value. //�������õ�ֵ����������䡣
 *
 * @private
 * @param {string|number} val //���� val  string��number����
 * @return {number}  //����ֵ number����
 */

function calcMaxAge (val) {
  var num = typeof val === 'string'  //����valΪ�ַ����򷵻غ����ʽ�������򲻱�
    ? ms(val)
    : val

  return num != null //��num��������Ĭ��ֵ
    ? Math.min(Math.max(0, num), ONE_YEAR_MS)  //��֤num��Ϊ�������Ҳ�����һ���Ĭ��ֵ
    : ONE_YEAR_MS
}

/**
 * Create icon data from Buffer and max-age.  //�ӻ����������ʱ�䴴��ͼ�����ݡ�
 *
 * @private
 * @param {Buffer} buf  //���� buf  buffer����
 * @param {number} maxAge  //���� maxAge number����
 * @return {object}  //����ֵ ����
 */

function createIcon (buf, maxAge) {
  return {
    body: buf,
    headers: {
      'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000),   //ȡ�����������cache-control�ĵ�
'ETag': etag(buf)	//������Web��Դ�����ļǺţ�token����
    }
  }
}

/**
 * Create EISDIR error.  //����EISDIR����
 *
 * @private
 * @param {string} path  //���� path  string����
 * @return {Error}  //���� error����
 */

function createIsDirError (path) {
  var error = new Error('EISDIR, illegal operation on directory \'' + path + '\'')  //�½�����EISDIR, xxxxĿ¼�ϵķǷ�����
  error.code = 'EISDIR'
  error.errno = 28
  error.path = path
  error.syscall = 'open'
  return error
}

/**
 * Determine if the cached representation is fresh. //ȷ�������ʾ�Ƿ����ʡ�
 *
 * @param {object} req  //���� req  ����
 * @param {object} res  //���� res  ����
 * @return {boolean}  //����ֵ  ����ֵ
 * @private
 */

function isFresh (req, res) {
  return fresh(req.headers, {
    'etag': res.getHeader('ETag'),
    'last-modified': res.getHeader('Last-Modified') //���������һ������ĳһ��URLʱ���������˵ķ���״̬����200�������ǿͻ����������Դ��ͬʱ��һ��Last-Modified�����Ա�Ǵ��ļ��ڷ�����������޸ĵ�ʱ�䡣
  })
}

/**
 * Resolve the path to icon.  //���ͼ���·����
 *
 * @param {string} iconPath  //���� icon  string����
 * @private
 */

function resolveSync (iconPath) {
  var path = resolve(iconPath)
  var stat = fs.statSync(path)

  if (stat.isDirectory()) { //��Ŀ¼�����ش���
    throw createIsDirError(path) 
  }

  return path
}

/**
 * Send icon data in response to a request. ����ͼ����������Ӧ����
 *
 * @private
 * @param {IncomingMessage} req //���� req ����
 * @param {OutgoingMessage} res //���� res ��Ӧ
 * @param {object} icon //���� icon ����
 */

function send (req, res, icon) {
  // Set headers
  var headers = icon.headers
  var keys = Object.keys(headers) //��icon��headersд������
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    res.setHeader(key, headers[key]) //��keyһ��һ��д����Ӧͷ
  }

  // Validate freshness//��֤���ʶ�
  if (isFresh(req, res)) {
    res.statusCode = 304
    res.end()
    return
  }

  // Send icon
  res.statusCode = 200
  res.setHeader('Content-Length', icon.body.length)
  res.setHeader('Content-Type', 'image/x-icon')
  res.end(icon.body)
}
