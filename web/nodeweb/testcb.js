function A()
{
    this.val = 10
    this.show = function()
    {
        console.log("Value is " + this.val)
    }
}

require('./callback').applyCallback(A)
//require('./cb2').applyCallback(A)

a = new A()
b = new A()
a.val = 1000;

fa = a.callback('show')
fb = b.callback('show')

fb()
fa()
fc = a.callback('now')
fc()
