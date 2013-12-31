//smod = require('./statemachine')
//cb = require('./callback')

exports.Euclidean = function(n1, n2)
{
    this.n1 = this.t1 = n1
    this.n2 = this.t2 = n2

    this.compare = function()
    {
        if (this.t1 >= this.t2)
        {
            this.result(1);   
            this.go();
            return;
        }
        this.result(2);
        this.go();
    }

    this.minus = function()
    {
        this.t1 = this.t1 - this.t2
        if (this.t1 == 0)
        {
            this.result(2);
            this.go();
            return;
        }
        this.result(1);
        this.go();
    }

    this.exchange = function()
    {
        var t = this.t1
        this.t1 = this.t2
        this.t2 = t
        this.result(1);
        this.go()
    }

    this.output = function()
    {
        console.log('Euclidean = ' + this.t2);
        this.result(1);
        this.go()
    }
}

