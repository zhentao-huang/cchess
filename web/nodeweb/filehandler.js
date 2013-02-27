#!/usr/bin/env node

var fs = require('fs')
var cb = require('./callback')

function filehandler(name)
{
    cb.initStateMachine(this)
    this.filename = name
}

cb.applyStateMachine(filehandler)


filehandler.prototype.check = function()
{
    fs.stat(this.filename, this.result(1));
}

filehandler.prototype.stat = function(err, stats)
{
    if (err)
    {
        this.result(2)
        this.reason = "Stat error, " + err
        this.go()
        return
    }
    
    this.stats = stats
    this.result(1)
    this.go()
}

filehandler.prototype.read = function()
{
    fs.readFile(this.filename, this.result(1))
}

filehandler.prototype.readed = function(err, data)
{
    if (err)
    {
        this.result(2)
        this.reason = "Read file error, " + err
        this.go()
        return
    }

    this.data = data
    this.result(1)
    this.go()
    return
}

filehandler.prototype.append = function()
{
    fs.appendFile(this.filename, data, this.result(1));
}

filehandler.prototype.appended = function(err)
{
    if (err)
    {
        this.result(2);
        this.reason = "Append file error, " + err;
    }
    else
    {
        this.result(1);
    }
    this.go();
}

filehandler.prototype.filter = function()
{
    var extIndex = this.filename.lastIndexOf('.')
    var ext = "";
    if (extIndex > 0 && extIndex < this.filename.length - 1)
    {
        ext = this.filename.substring(extIndex + 1)
    }
    else
    {
        this.result(2)
        this.go();
        return 
    }

    switch (ext)
    {
        case "html":
        case "htm":
            this.mime = "text/html"
            this.result(1)
            break;
        case "txt":
            this.mime = "text/plain"
            this.result(1)
            break;
        case "json":
            this.mime = "application/json";
            this.result(1)
            break;
        case "js":
            this.mime = "text/javascript"
            this.result(1)
            break;
        case "png":
            this.mime = "image/png"
            this.result(1)
            break;
        case "jpg":
            this.mime = "image/jpeg"
            this.result(1)
            break;
        case "ico":
            this.mime = "image/x-icon"
            this.result(1)
            break;
        case "css":
            this.mime = "text/css"
            this.result(1)
            break;
        case "manifest":
            this.mime = "text/cache-manifest"
            this.result(1)
            break;
        case 'apk':
            this.mime = "applicaiton/octet-stream";
            this.result(1);
            break;
        default:
            this.result(2)
            break;
    }

    this.go()
    return;
}

exports.FileHandler = filehandler
