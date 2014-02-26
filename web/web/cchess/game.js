function perform(match, comm, playlog)
{
    var set = new game(match, comm, playlog)
    set.launch()
    return set
}

function game(match, id, playlog)
{
    this.match = match
    this.comm = new chater(id);

    // this.timeout = 60

    this.launch = function()
    {
        this.comm.setup = {
            'reg': this.callback('reged'),
            'listen': this.callback('received'),
        }
        this.comm.reg();
    }

    this.received = function(data)
    {
        var goon = true;
        var msg;
        for (var i in data)
        {
            msg = data[i];
            //if (msg.id === 'sys')
            //{
            //    this.handleSysMessage(msg);
            //}
            //else
            if (msg.type === 'cchess')
            {
                this.handleGameMessage(msg);
            }
        }
    }

    this.reged = function(data)
    {
        // Register success fully and do nothing
    }

    this.handleSysMessage = function(msg)
    {
        if (msg.message === 'heart beat');
        {
            if (!!this.hbcount && msg.count - this.hbcount > 1)
            {
                alert("Miss some heart beat");
            }
            this.hbcount = msg.count;
        }
    }

    this.handleGameMessage = function(msg)
    {
        //alert(this.id + " handle game!");
        var obj = msg.message;
        if (!!obj)
        {
            if (obj !== "registered")
            {
                var turn = JSON.parse(obj);
                turn.isMine = false
                this.match.performMove(turn)
            }
        }
    }

    this.onestep = function(step)
    {
        if (step.isMine)
        {
            step.id = this.comm.id;
            var str = JSON.stringify(step);
            this.comm.send(str, 'cchess');
        }

        this.match.play.toggleTurn();
        updateTitle()
    }
    
    this.load = function()
    {
    	if (!!playlog)
    	{
                this.match.loading = true;
    		for (var t in playlog)
    		{
    			var turn = JSON.parse(playlog[t].message);
    			console.log("turn = " + turn);
                        turn.isMine = false;
    			if (turn.id != this.comm.id)
    			{
    				console.log("Perform opponent's step")
    				console.log("this.comm.id = " + this.comm.id + "; turn.id = " + turn.id);
    				this.match.performMove(turn);
    			}
    			else
    			{
    				console.log("Perform self step");
    				this.match.selfMove(turn.oldX, turn.oldY, turn.newX, turn.newY);
    			}
    			console.log("perform turn ", JSON.stringify(turn));
    		}
                this.match.loading = false;
    	}
    }
    	
    console.log("game is started");
    this.match.setLoadHandler(this.callback("load"));
    this.match.setTurnHandler(this.callback("onestep"));
}

applyCallback(game)
