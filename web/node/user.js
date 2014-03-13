var cb = require('./callback');
var util = require('util');
var queue = require('./queue');
var fh = require('./filehandler');

var registry = {
    'players': {},
    'queue' : new queue.Queue(),
    'playlog': null,
    'register': function(id, ip)
    {
    	if (!!this.players[id])
    	{
    		this.players[id].ip = ip;
    	}
    	else
    	{
            var u = new User(id, ip);
            this.players[id] = u;
            this.queue.addUser(id);
    	}
    },
    'verify': function(id, ip)
    {
        var u = this.players[id];
        return (!!u && u.ip == ip);
    },
    'isExists': function(id)
    {
        return !!this.players[id];
    },
    'isOnline': function(id)
    {
        return (!!this.players[id] && this.players[id].chat); 
    },
    'send': function(message)
    {
        message.reply = 'success';
        console.log('Registry send message ' + JSON.stringify(message));
        this.queue.enque(message);
        this.notifyAll();
        // this.save();
    },
    'goodbye': function(id)
    {
        var message = {id:id, reply:'goodbye', type:'string', message:'goodbye'};
        console.log('Registry send goodbye message ' + JSON.stringify(message));
        this.queue.enque(message);
        this.notifyAll();

        var player = this.players[id];
        if (player && !player.chat)
        {
            player.dismiss();
        }
    },
    'save': function(message)
    {
        if (!this.playlog)
        {
            this.playlog = new fh.FileHandler('./playlog.txt');
            this.playlog.set({
                states: [
                    ['waitData', 1],
                    ['append', 2],
                    ['appended', 0],
                ],
            });

            this.playlog.start();
        }

        this.play.emit('data', message);
    },
    'query': function(message)
    {
        switch(message)
        {
        case 'getUserInfo':
            var users = [];
            for (var i in this.players)
            {
                var user = this.players[i];
                var stat = 'standby';
                if (user.offline)
                {
                    stat = 'offline';
                }
                else if (user.chat)
                {
                    stat = 'online';
                }

                users.push({
                    id: user.id,
                    stat : stat,
                });
            }
            return users;
            break;
        case 'getQueueState':
            return this.queue.getStat();
            break;
        }
        return null;
    },
    'enter': function(chat)
    {
        var player = this.players[chat.id];
        player.chat = chat;
        player.goemit('connect');
    },
    'broken': function(id)
    {
        var player = this.players[id];
        if (player && player.chat)
        {
            player.broken();
        }
    },
    'notifyAll': function()
    {
        for (var id in this.players)
        {
            if (this.isOnline(id))
            {
                var player = this.players[id];
                player.goemit('message');
            }
        }
    },
    'heartbeat': function()
    {
        var self = this;
        if (!this.hb)
        {
            this.hb = setInterval(
                function()
                {
                    console.log('sys : heartbeat = ' + self.count);
                    self.send({id:'sys', count:self.count++, type:'string', message:'heart beat'});
                },
                60000
            );
            this.count = 0;
        }
    }
}

exports.getRegistry = function()
{
    return registry;
}

registry.heartbeat();

exports.getUser = function(req)
{
    var ip = req.connection.remoteAddress;
    return Players.getUserByIp(ip);
}

exports.listUser = function()
{
    var ids = []
    for (var u in Players.users)
    {
        ids.push(Players.users[u].id)
    }
    return ids.join(':')
}

/*
exports.heartbeat = function()
{
    setInterval(function() {
        for (var i in Players.users)
        {
            var chat = Players.users[i]
            chat.heartbeat();
        }
    }, 10000)
}
*/

function User(id, ip)
{
    cb.initStateMachine(this);
    this.id = id;
    this.ip = ip;
    this.offline = false;
    var q = registry.queue;

    this.set({
        states: [
            ['standby' , 1],       // 0
            ['enter'   , 2],       // 1
            ['leave'   , 0, 2],    // 2
            ['heart'   , 0],       // 3
            ['message' , 0],       // 4
            ['bye'     , -1],      // 5
       ] 
    });


    this.standby = function()
    {
        console.log(this.id + ' is standby');
        this.once('connect', this.result(1));
    }

    this.enter = function()
    {
        console.log(this.id + ' is waiting for message');
        if (this.offline)
        {
            registry.send({id:this.id, type:'string', message:'online'});
            this.offline = false;
        }
        if (q.check(this.id))
        {
            console.log(this.id + ' get message immediately');
            this.result(1);
            this.go();
        }
        else
        {
            this.once('message', this.result(1));
        }
    }

    this.message = function()
    {
        this.chat.message = q.read(this.id);
        this.chat.goemit('message');
    }

    this.broken = function()
    {
        if (!this.offline)
        {
            console.log(this.id + ' is broken');
            if (this.chat)
            {
                this.chat.removeAllListeners();
            }
            this.chat = null;
            registry.send({id:this.id, type:'string', message:'broken'});
            this.offline = true;
            this.removeAllListeners();
            this.start(0);
        }
    }

    this.filter = function(msgs)
    {
        var ret = []
        var heartbeat = null;
        for (var i in msgs)
        {
            var msg = msgs[i];
            if (msg.id == 'sys' && msg.message == 'heart beat')
            {
                heartbeat = msg;
            }
            else if (msg.id != this.id || msg.reply == 'goodbye')
            {
                ret.push(msg);
            }
        }

        if (ret.length == 0 && heartbeat)
        {
            ret.push(heartbeat);
        }
        return ret;
    }

    this.leave = function()
    {
        console.log(this.id + ' reads message');
        if (!this.chat)
        {
            console.log(this.id + ' was leaved already');
            this.broken();
            this.result(1);
            this.go();
        }

        var msgs = q.read(this.id);
        msgs = this.filter(msgs);

        if (msgs.length == 0)
        {
            console.log(this.id + ' finds no message');
            this.once('message', this.result(2));
            return;
        }
        
        this.chat.message = msgs;
        console.log(this.id + " : " + JSON.stringify(msgs));

        this.chat.goemit('message');
        this.chat = null;

        var last = msgs[msgs.length - 1];
        if (last.reply == 'goodbye' && last.id == this.id)
        {
            this.dismiss();
            return;
        }

        this.result(1);
        this.go();
    }

    this.dismiss = function()
    {
        this.removeAllListeners();
        delete registry.players[this.id];
    }

    this.start();
}

cb.applyStateMachine(User);

exports.User = User;

exports.User.timeLimit = 2000; // 2 second

