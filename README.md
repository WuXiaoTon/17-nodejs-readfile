# 本仓库存放nodejs2017学年大作业。

## 作业流程
-- 阅读理解[serve-favicon](https://github.com/expressjs/serve-favicon)模块代码。
-- 添加注释，到[index.js](https://github.com/WuXiaoTon/17-nodejs-readfile/blob/master/index.js)  
-- 使用jshint检查错误，除去句尾缺少分号，还有其它三个error
![]

## 项目内容介绍  
模块功能：将网页图标缓存入本地，减少请求。
- 借阅理解资料存放在docs文件夹内。  
   注释规范：头注释规范参考  
   引用模块：借口涉及的模块介绍  
   req的method简介  
   cache-control  
- .eslintrc代码检测
- .travis.yml持续集成
- [index.js](https://github.com/WuXiaoTon/17-nodejs-readfile/blob/master/index.js)  
   为本模块的出口文件，所有函数都封装在此文件中
- 函数
   本模块函数众多，以下按顺序列出：  
   	favicon (path, options)指定路径提供图标  
	calcMaxAge (val)根据配置的值计算最大年龄  
	createIcon (buf, maxAge)从缓冲区和最大时间创建图标数据  
	createIsDirError (path)创建EISDIR错误  
	isFresh (req, res)确定缓存表示是否新鲜  
	resolveSync (iconPath)解决图标的路径  
	send (req, res, icon)发送图标数据以响应请求  

## 模块介绍
serve-favicon是一个Node.js图标服务的中间件。
favicon是一个客户端软件的视觉提示，像浏览器，去标识一个网站。
- 为什么要用这个模块？
	用户代理会不停请求图标，所以你可能想在记录器前使用这个中间件，从日志中排除这些请求。
	这个模块将图标缓存在内存中，以跳过磁盘访问来提高性能。
	这个模块基于图标的内容提供ETag，而不是文件系统提供。
	这个模块会和最兼容的Content-Type一起提供服务。
- Note  
这个模块专门用于服务“default，implicit favicon”，它是GET /favicon.ico。 对于需要HTML标记的其他特定于供应商的图标，需要额外的中间件来提供相关文件，例如serve-static。


- Install安装  
这是通过npm注册表可用的Node.js模块。 安装使用npm install命令完成：
$ npm install serve-favicon


- API  
**favicon(path, options)**  
创建新的中间件，将favicon从指定路径提供给favicon文件。 路径也可能是服务的图标的缓冲区。

**Options**  
服务图标在选项对象中接受这些属性。
maxAge  
缓存控制max-age指令用ms表示，默认为1年。 这也可以是ms模块接受的字符串。

- Examples  
通常，如果我们已经知道请求是针对/favicon.ico的话，那么这个中间件会很早（或许甚至是第一次）来避免处理任何其他中间件。

express  
var express = require('express')  
var favicon = require('serve-favicon')  
var path = require('path')  
var app = express()  
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))  
// Add your routes here, etc.  
app.listen(3000)  

connect  
var connect = require('connect')  
var favicon = require('serve-favicon')  
var path = require('path')  
var app = connect()  
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))  
// Add your middleware here, etc.  
app.listen(3000)  

vanilla http server  
这个中间件可以在任何地方使用，甚至在外部快速/连接。 它需要req，res和回调。
var http = require('http')  
var favicon = require('serve-favicon')  
var finalhandler = require('finalhandler')  
var path = require('path')  
var _favicon = favicon(path.join(__dirname, 'public', 'favicon.ico'))  
var server = http.createServer(function onRequest (req, res) {  
  var done = finalhandler(req, res)  
  _favicon(req, res, function onNext (err) {  
    if (err) return done(err)  
    // continue to process the request here, etc.  
    res.statusCode = 404  
    res.end('oops')  
  })  
})  
server.listen(3000)  

- License    
[MIT](https://github.com/WuXiaoTon/17-nodejs-readfile/blob/master/LICENSE)

## 思路总结：  
传入path和options,options包含了maxAge属性来决定缓存时间，若没有传入options则默认为一年。根据path新建缓存区写入图片发送。

## 代码风格：  
注释清晰，函数作用与参数返回值都很简单明了。
