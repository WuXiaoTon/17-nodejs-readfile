/*!
 * serve-favicon
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict' //严格模式

/**
 * Module dependencies.//模块依赖
 * @private//私有
 */
//safe-buffer、etag、fs、ms、parseurl、path见引用模块文件
var Buffer = require('safe-buffer').Buffer
var etag = require('etag')
var fresh = require('fresh')
var fs = require('fs')  //文件模块
var ms = require('ms')
var parseUrl = require('parseurl') 
var path = require('path')  //路径
var resolve = path.resolve

/**
 * Module exports.//模块出口
 * @public//公有
 */

module.exports = favicon   //出口为favicon

/**
 * Module variables.//模块变量
 * @private//私有
 */

var ONE_YEAR_MS = 60 * 60 * 24 * 365 * 1000 // 1 year

/**
 * Serves the favicon located by the given `path`.//指定路径提供图标
 *
 * @public
 * @param {String|Buffer} path //参数：path路径string|buffer
 * @param {Object} [options] //参数：    object参数
 * @return {Function} middleware//返回值：middleware中间件 function
 */

function favicon (path, options) {
  var opts = options || {}

  var icon // favicon cache  //缓存
  var maxAge = calcMaxAge(opts.maxAge)  //见下面的函数

  if (!path) {  //如果路径错误，抛出错误path to favicon.ico is required
    throw new TypeError('path to favicon.ico is required')
  }

  if (Buffer.isBuffer(path)) {  //检测路径是否为buffer对象
    icon = createIcon(Buffer.from(path), maxAge)  //见下面函数
  } else if (typeof path === 'string') {  //检测路径是否是字符串
    path = resolveSync(path) //见下面函数
  } else {  //路径不是buffer或字符串抛出错误path to favicon.ico must be string or buffer
    throw new TypeError('path to favicon.ico must be string or buffer')
  }

  return function favicon (req, res, next) {   //返回函数
    if (parseUrl(req).pathname !== '/favicon.ico') { //将请求URL地址分为很多部分，提取pathname
      next()  //执行next函数
      return  //退出
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { //请求方式不是GET和HEAD
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405 //请求方式允许客户端查看服务器的性能则返回200成功，否则返回405客户端错误
      res.setHeader('Allow', 'GET, HEAD, OPTIONS') //设置响应头
      res.setHeader('Content-Length', '0')
      res.end() //响应结束
      return  //退出
    }

    if (icon) {//如果缓存下了图标
      send(req, res, icon) //向已连接的socket端口号发送数据，看下面函数
      return //退出
    }

    fs.readFile(path, function (err, buf) {//如果没有图标，向指定的路径里创建一个。创建一个buf
      if (err) return next(err)
      icon = createIcon(buf, maxAge)
      send(req, res, icon)//发送数据
    })
  }
}

/**
 * Calculate the max-age from a configured value. //根据配置的值计算最大年龄。
 *
 * @private
 * @param {string|number} val //参数 val  string或number类型
 * @return {number}  //返回值 number类型
 */

function calcMaxAge (val) {
  var num = typeof val === 'string'  //传入val为字符串则返回毫秒格式，数字则不变
    ? ms(val)
    : val

  return num != null //若num出错，返回默认值
    ? Math.min(Math.max(0, num), ONE_YEAR_MS)  //保证num不为复数，且不大于一年的默认值
    : ONE_YEAR_MS
}

/**
 * Create icon data from Buffer and max-age.  //从缓冲区和最大时间创建图标数据。
 *
 * @private
 * @param {Buffer} buf  //参数 buf  buffer类型
 * @param {number} maxAge  //参数 maxAge number类型
 * @return {object}  //返回值 对象
 */

function createIcon (buf, maxAge) {
  return {
    body: buf,
    headers: {
      'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000),   //取整秒数，详见cache-control文档
'ETag': etag(buf)	//可以与Web资源关联的记号（token）。
    }
  }
}

/**
 * Create EISDIR error.  //创建EISDIR错误。
 *
 * @private
 * @param {string} path  //参数 path  string类型
 * @return {Error}  //返回 error类型
 */

function createIsDirError (path) {
  var error = new Error('EISDIR, illegal operation on directory \'' + path + '\'')  //新建错误：EISDIR, xxxx目录上的非法操作
  error.code = 'EISDIR'
  error.errno = 28
  error.path = path
  error.syscall = 'open'
  return error
}

/**
 * Determine if the cached representation is fresh. //确定缓存表示是否新鲜。
 *
 * @param {object} req  //参数 req  对象
 * @param {object} res  //参数 res  对象
 * @return {boolean}  //返回值  布尔值
 * @private
 */

function isFresh (req, res) {
  return fresh(req.headers, {
    'etag': res.getHeader('ETag'),
    'last-modified': res.getHeader('Last-Modified') //在浏览器第一次请求某一个URL时，服务器端的返回状态会是200，内容是客户端请求的资源，同时有一个Last-Modified的属性标记此文件在服务器端最后被修改的时间。
  })
}

/**
 * Resolve the path to icon.  //解决图标的路径。
 *
 * @param {string} iconPath  //参数 icon  string类型
 * @private
 */

function resolveSync (iconPath) {
  var path = resolve(iconPath)
  var stat = fs.statSync(path)

  if (stat.isDirectory()) { //是目录，返回错误
    throw createIsDirError(path) 
  }

  return path
}

/**
 * Send icon data in response to a request. 发送图标数据以响应请求
 *
 * @private
 * @param {IncomingMessage} req //参数 req 请求
 * @param {OutgoingMessage} res //参数 res 响应
 * @param {object} icon //参数 icon 对象
 */

function send (req, res, icon) {
  // Set headers
  var headers = icon.headers
  var keys = Object.keys(headers) //把icon的headers写入数组
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    res.setHeader(key, headers[key]) //把key一个一个写入响应头
  }

  // Validate freshness//验证新鲜度
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
