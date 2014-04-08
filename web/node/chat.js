var cb = require('./callback');
var user = require('./user');
var fs = require('fs');


/* 
    Depends on :
        Global variable:
            Registry        -- User Registry
            StatusLoop      -- User Status Loop
            Queue           -- Message Queue

*/
function Chat(req, res, logpath, sid)
{
    cb.initStateMachine(this);

    console.log('instance chat url = ' + req.url);
    this.id = req.rest.shift()
    this.action = req.rest.shift()
    this.ip = req.connection.remoteAddress;
    var regs = user.getRegistry();
    if (!regs.logfile)  // First time load
    {
        if (!sid)
        {
            sid = Math.floor(Math.random() * 10000000);
        }
        regs.logfile = logpath + '/' + sid;
    }

    console.log("regs.logfile = " + regs.logfile + ", sid = " + sid);

    this.set({
        states: [
        ['parse', -1,1,2,3,4,5,7,8],    // 0
        ['reg', 6],                     // 1
        ['send', 6],                    // 2
        ['query', 6],                   // 3
        ['listen', 6],                  // 4
        ['bye', 6],                     // 5
        ['reply', -2],                  // 6
        ['list', 6],                    // 7
        ['load', 6]						// 8
        ]});
        
    this.list = function()
    {
    	
    }
    
    this.parse = function()
    {
        console.log(["Chat : ", this.id, this.action, ': parsing'].join(' '));
        var r = Chat.route.indexOf(this.action) + 2;
        if (r >= 3 && (!regs.isExists(this.id) || !regs.verify(this.id, this.ip)))
        {
            r = 1;
        }
        this.result(r);
        this.go();
    }

    this.writeLog = function(text)
    {
        if (fs.existsSync(regs.logfile))
        {
            fs.appendFileSync(regs.logfile, ',\n');
        }
        fs.appendFileSync(regs.logfile, text);
    }

    this.reg = function()
    {
        // Register User
        // Check whether user registed
        console.log(['Chat : ', this.id, ': register'].join(' '));
//        if (regs.isExists(this.id)) // If yes, construct reg failure message and return
//        {
//            this.message = [{id:this.id, reply:'failure', message:'The user is online already'}];
//        }
//        else                        // Else conduct to instance User 
        {
            regs.register(this.id, this.ip)
            regs.send({id:this.id, type:'string', message:'registered'});
            this.message = [{id:this.id, reply:'success', message:'The user is registered success'}];
        }
        
        // Construct reply message
        // goto reply
        this.result(1);
        this.go();
        return;
    }

    this.messageFromRequest = function()
    {
        /*
        var message = req.rest.shift();
        if (message)
        {
            message = unescape(message)
        }

        return message;
        */

        return req.data;
    }

    this.send = function()
    {
        console.log(['Chat : ', this.id, ' : send message'].join(' '));
        // Restruct sending message
        var message = this.messageFromRequest();

        if (message)
        {
            this.writeLog(message);
            message = this.messageToObject(message);
            console.log(['Chat', this.id, ' : After convert :', JSON.stringify(message)].join(' '));
            if (message)
            {
                this.message = [{id:this.id, reply:'success', type:'string', message:'sent success'}];
                regs.send(message);
            }
            else
            {
                this.message = [{id:this.id, reply:'failure', message:'syntax error'}];
            }

        }
        else
        {
            this.message = [{id:this.id, reply:'success', message:'no message'}];
        }
        // Goto reply
        this.result(1);
        this.go();
    }

    this.messageToObject = function(message)
    {
        if (message)
        {
            message = JSON.parse(message);
            message.id = this.id;
        }

        return message;
    }

    this.query = function()
    {
        // Call user to retrieve info
        var message = this.messageFromRequest();
        if (message)
        {
            // Construct reply message
            if (message)
            {
                message = regs.query(message);
                this.message = [{id:this.id, reply:'success', message:message}];
            }
            else
            {
                this.message = [{id:this.id, reply:'failure', message:'syntax error'}];
            }
        }
        else
        {
            this.message = [{id:this.id, reply:'failure', message:'no message'}];
        }

        // Goto reply
        this.result(1);
        this.go();
    }

    this.listen = function()
    {
        console.log(['Chat : ', this.id, ' : listening'].join(' '));
        if (regs.isOnline(this.id))
        {
            this.message = [{id:this.id, reply:'stop', message:'already listen'}];
            this.result(1);
            this.go();
            return;
        }
        // Drive user's status loop, from 'standby' to 'online'
        this.once('message', this.result(1));
        regs.enter(this);
        // listen to disconnection event
        res.once('close', this.callback('broken'));
        // Wait for message 'deliver'
    }

    this.bye = function()
    {
        console.log(['Chat: ', this.id, ' : bye'].join(' '));
        // Send message
        // Dismiss user
        regs.goodbye(this.id);
        // Goto reply
        this.message = [{id:this.id, reply:'stop', message:'Say goodbye'}];
        this.result(1);
        this.go();
    }

    this.reply = function()
    {
        console.log(['Chat : ', this.id, ' : reply client'].join(' '));
        // Response http request by message
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify(this.message));
        // Drive user's status loop, from 'online' to 'standby'
    }

    this.broken = function()
    {
        // Drive user status loop, from 'online' to 'broken'
        // Send broken message
        regs.broken(this.id);
        // Cancel reply and return;
    }

    this.start();
}

Chat.route = ['reg', 'send', 'query', 'listen', 'bye', 'list', 'load'];

cb.applyStateMachine(Chat)

exports.Chat = Chat;
