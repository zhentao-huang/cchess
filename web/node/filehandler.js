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

    var mime = require('./mime');

    this.mime = mime[ext];
    if (!!this.mime)
    {
        this.result(1)
    }
    else
    {
        this.result(2)
    }

    this.go()
    return;
}

exports.FileHandler = filehandler
