
function chater(id, sid)
{
    this.comm = location.protocol + "//" + location.hostname;
    if (location.port != '')
    {
        this.comm += ':' + location.port
    }
    this.comm += '/chat/'

    this.id = id;
    this.state = "standby";
    this.goon = true;

    this.perform = function(state)
    {
        var args = Array.prototype.slice.call(arguments);
        var state = args.shift();
        var action = this.setup[state];
        if (action)
        {
            action.apply(null, args);
        }
    }

    this.reg = function()
    {
        var self = this;
        if (this.state == 'standby')
        {
            var regurl = this.comm + this.id + "/reg";
            if (!!sid)
            {
                regurl = regurl + "?sid=" + sid;
            }
            jQuery.ajax({
                url: regurl,
                success : function(data)
                {   
                    self.perform('reg', data);
                    if (data[0].reply == 'success')
                    {
                        self.listen();
                    }
                },
                error : function(e)
                {
                    this.state = 'broken';
                    self.perform('regError', e);
                }
            });
            this.state = 'reg';
        }
    }
    
    this.listen = function()
    {       
        var self = this;
        jQuery.ajax({
            url : this.comm + this.id + "/listen",
            success : function(data)
            {
                //alert(JSON.stringify(data));
                self.perform('listen', data);
                if (self.goon)
                {
                    self.listen();
                }
            },
            error : function(e)
            {
                this.state = 'offline';
                self.perform('listenError', e)
            }
        });
        this.state = 'listen';
    }

    this.send = function(message, type)
    {
        var self = this;
        jQuery.ajax({
            type: 'POST',
            url : this.comm + this.id + "/send",
            data : JSON.stringify({'message': message, 'type':type}),
            success : function(data)
            {
                self.perform('send', data);
            },
            error : function(e)
            {
                self.perform('sendError', e);
            }
        });
    }

    this.query = function(queryString)
    {
        var self = this;
        jQuery.ajax({
            type : 'POST',
            url : this.comm + this.id + '/query',
            data : queryString,
            success : function(data)
            {
                self.perform('query', data);
            },
            error : function(e)
            {
                alert(e);
                self.perform('queryError', e);
            },
        });
    }

    this.bye = function()
    {
        var self = this;
        jQuery.ajax({
            type : 'GET',
            url : this.comm + this.id + '/bye',
            success : function(data)
            {
                self.perform('bye', data);
            },
            error : function(e)
            {
                self.perform('goodbyeError', e);
            },
        });
    }
        
}

/*
    this.role = role

    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
            {
                var ready = xmlhttp.readyState;
                if (ready == 3 || ready == 4)
                {
                    document.body.innerHTML = xmlhttp.responseText;
                }
            }
    xmlhttp.open("GET", this.comm + "/reg/" + role, true)
    xmlhttp.send(null);
    jQuery.ajax({
        url : this.comm + "/reg/" + role,
        success : function(data)
        {
            alert("data received<br/>" + data)
        }, 
        error : function(e){
            alert("Error occured " + e)
        }
        });
*/

chater.states = ['standby', 'reg', 'listen', 'send', 'deal', 'broken'];
