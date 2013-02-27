function Queue()
{
    this.que = [];
    this.dc = [];         // Dispatch count
    this.uidmap = [null];
    this.name2uid = {};
    this.uidcur = [];
    this.cur = 0;
}

Queue.prototype.getStat = function()
{
    var userCur = [];
    for (var name in this.name2uid)
    {
        userCur.push({
            id : name,
            cursor : this.uidcur[this.name2uid[name]],
            });
    }
    return {
        queSize : this.que.length,
        users : userCur};
}

Queue.prototype.addUser = function(name)
{
    this.uidmap.push(name);
    var uid = this.uidmap.length - 1;
    this.name2uid[name] = uid;
    this.uidcur[uid] = this.que.length;
}

Queue.prototype.enque = function(obj)
{
    this.que.push(obj);
    this.dc.push(this.uidmap.length - 1);
}

Queue.prototype.check = function(name)
{
    var uid = this.name2uid[name];
    if (uid)
    {
        var cur = this.uidcur[uid];
        while(this.que[cur])
        {
            var obj = this.que[cur];
            if (obj)
            {
                return true;
            }
            ++cur;
        }
    }
    return false;
}

Queue.prototype.read = function(name)
{
    var uid = this.name2uid[name];
    var msg = []
    if (uid)
    {
        var cur = this.uidcur[uid];
        while(this.que[cur])
        {
            var obj = this.que[cur];
            if (obj)
            {
                msg.push(obj);
            }
            --this.dc[cur];
            ++cur;
        }
        this.uidcur[uid] = cur;
        this.clear();
    }
    return msg;
}

Queue.PurgeLimit = 4;
Queue.prototype.clear = function()
{
    if (this.que.length > Queue.PurgeLimit)
    {
        var c = 0
        while(this.dc.length > 0)
        {
            if (this.dc[0] == 0)
            {
                this.dc.shift();
                this.que.shift();
                ++c;
            }
            else
            {
                break;
            }
        }

        for (var i in this.uidcur)
        {
            this.uidcur[i] -= c;
        }
    }
}

exports.Queue = Queue
