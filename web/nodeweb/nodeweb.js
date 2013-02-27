#!/usr/bin/env node

(
function main()
{
    console.log("Nodeweb starting...");
    // Import modules
    var cb = require("./callback")
    //var mime = require("./mime")
    var http = require('http')
    var url = require('url')
    var util = require('util')
    var path = require('path')
    var fs = require('fs')
    var chat = require('./chat.js');
    var fh = require('./filehandler')
    var user = require('./user')

    // For nodeweb path dispatch
    var rootroute = ['pub', 'cchess', 'qr', 'chat', ]

    // Function object to store HTTP response headers.
    function webres()
    {
        this['Content-Type'] = 'text/plain'
    }

    // Function object Nodeweb. 
    function NodeWeb()
    {
        this.server = http.createServer(this.callback('dispatch'))
        this.webroot = process.cwd() + '/pub';
        this.port = 8000
        this.address = '0.0.0.0'
        this.sessions = []
    }

    // Treat the path of this script as root to store scripts
    function scriptPath()
    {
        var re = /\.js/
        for (var p in process.argv)
        {
            var d = process.argv[p]
            r = re.exec(d)
            if (r != null)
            {
                var dirname = path.dirname(process.argv[p])
                if (dirname == '.')
                {
                    break;
                }
                return dirname;
            }
        }

        return path.resolve('.')
    }

    // Function object represent one http interaction (request and reply) 
    function NodeSession(req, res)
    {
        cb.initStateMachine(this)        
        this.req = req
        this.res = res
        this.webroot = scriptPath() + '/pub';
        this.path = '/'
//        console.log('webroot = ' + this.webroot);

        // State Machine 
        this.set({
            "states" : [
                ["urlparse", 4, 10, 12, 9, 11 ],    //  0
                ["filereq", 2, 3, 4, 5],            //  1
                ["filedone", 6],                    //  2
                ["restreq", 6],                     //  3
                ["notfound", 6],                    //  4
                ["fileerr", 6],                     //  5
                ["done", -1],                       //  6
                ["user", 6],                        //  7
                ['message', 6],                     //  8
                ['qr', 6],                          //  9
                ['pub', 1],                         // 10
                ['chat', 4, 6],                     // 11
                ['cchess', 1],                      // 12
                ['prepare', 0],                     // 13
            ]
        })

        // Collect post data
        this.collectData = function(data)
        {
            console.log('data event received ' + data);
            this.req.data += data;
        }

        // For a post request, try to collect post data
        // It would finally transfer to "urlparse"
        this.prepare = function()
        {
            this.req.data = '';
            console.log('NodeSession : req readable = '+ req.readable)

            req.setEncoding('utf8');
            req.on('data', this.callback('collectData'));
            req.once('end', this.result(1));
        }

        this.filedone = function()
        {
            var wr = new webres()
            wr['Content-Type'] = this.filereq.mime
            this.res.writeHead(200, wr)
            this.res.end(this.filereq.data)
            this.result(1)
            this.go()
        }

        this.notfound = function()
        {
            console.log("For " + this.req.url + ", found nothing")
            this.res.writeHead(404)
            this.res.end();
            this.result(1)
            this.go()
        }

        this.fileerr = function()
        {
            console.log("For " + this.req.url + ", unknown request");
            this.res.writeHead(404);
            this.res.end();
            this.result(1);
            this.go();
        }

        this.restreq = function()
        {
            this.res.writeHead(200,new webres());
            this.res.end("Wait for rest plugin to be implemented ...");
            this.result(1);
            this.go();
        }

        this.done = function()
        {
//            console.log("Access " + this.req.url + " done");
        }
        
        this.pathparse = function(route)
        {
            var p = this.reqobj.rest
            while (p.length > 0 && p[0] == '') p.shift();
            
            var it = p.shift()
            var r = route.indexOf(it);
            // r = -1 stands for not found, redirect to 1
            // r >= 0 stands for match a route.
            if (r >= 0) this.path = path.join(this.path, it)
            r += 2

            this.result(r);
        }

        this.urlparse = function()
        {
            req.removeAllListeners(); 
            this.reqobj = url.parse(this.req.url)
//            console.log("Accsse " + this.req.url);

            if (this.reqobj.pathname == '/favicon.ico')
            {
                this.reqobj.path = '/pub/favicon.ico'
            }

            var p = this.reqobj.path.split('/');
            this.reqobj.rest = p;
            req.rest = p;
            this.pathparse(rootroute)
            this.go();

        }

        this.pub = function()
        {
            p = path.join.apply(null, this.reqobj.rest)
            p = p.split('?')[0]            
            this.filepath = path.join(scriptPath(), this.path, p);
//            console.log("Access file : " + this.filepath)
            this.filereq = new fh.FileHandler(this.filepath);

            this.filereq.set({
                states: [
                    ["filter", 1, -2],
                    ["check", 2],
                    ["stat", 3, -3],
                    ["read", 4],
                    ["readed", -1, -4]
                ]
            })


            this.result(1);
            this.go();
        }

        this.cchess = this.pub
        
        this.qr = function()
        {
            str = path.join.apply(null,this.reqobj.rest)
            str = decodeURIComponent(str);
            console.log("QR : " + str);
            wr = new webres();
            wr["Content-Type"] = 'image/png';
            buf = process.str2qr(str);
            console.log("QR : retrieved success " + str);
            this.res.writeHead(200, wr)
            this.res.end(buf);
            this.result(1);
            this.go();
            return;
        }

        this.chat = function()
        {
            this.chatObj = new chat.Chat(req, res);
        }
        
        this.reg = function()
        {
            this.user = new user.User(id, req, res);
            this.user.set( 
            {
                "states" :[ 
                    ['reg', 1, 6],          // 0
                    ['buffer', 2],          // 1
                    ['deliver', 3],         // 2
                    ['regdone', 4],         // 3
                    ['send', 5],            // 4
                    ['commit', 4],          // 5
                    ['regged', -1]          // 6
                ]
            });
            wr = new webres();
            wr['Content-Type'] = 'text/plain';
            res.writeHead(200, wr);

            this.result(1);
            this.go();
            return;
        }
        
        this.say = function()
        {
            var message = this.reqobj.rest.shift();
            message = unescape(message);
            u = user.getUser(req);
            
            if (u)
            {
                u = new user.User(u.id, req, res);
                wr = new webres();
                wr['Content-Type'] = 'text/plain';
                this.res.writeHead(200,wr)
                u.message = u.id + ':' + message;
                u.set({'states': [
                        ['buffer', 1],      // 0
                        ['deliver', 2],     // 1
                        ['ack', -1],        // 2
                    ]
                });
                this.message = u
                this.result(2)
                this.go();
                return;
            }
            else
            {
                this.res.writeHead(200, new webres());
                this.end('Not regiestered user');
            }
            this.result(1);
            this.go();
            return;
        }

	this.list = function()
	{
	    res.end(user.listUser());
	    this.result(1);
	    this.go();
	    return;
	}

    }


    cb.applyStateMachine(NodeSession)
    cb.applyCallback(NodeWeb)

    NodeWeb.prototype.launch = function()
    {
        this.server.listen(this.port, this.address)
        //    user.heartbeat()
    }

    NodeWeb.prototype.dispatch = function(req, res)
    {
        var session = new NodeSession(req, res);
        this.sessions.push(session);
        if (req.method == 'POST' && req.readable)
        {
            session.start(13);   
        }
        else
        {
            session.start();
        }
    }

    var web = new NodeWeb()
    web.launch()
}
)();

