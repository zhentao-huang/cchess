// Shuffle Array Fisher & Yates

exports.shuffle = function (arr)
{
    var len = arr.length
    var i = len
    var j
    var temp

    if (i==0) return;
    while(--i)
    {
        j = Math.floor(Math.random() * len) % (i+1);
        temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
}

exports.more = function(arr, time)
{
    for (;time > 0; --time)
    {
        exports.shuffle(arr)
    }
}

exports.raw = function(len)
{
    var r = []

    if (len > 0)
    {
        for (var i=0; i<len ; ++i)
        {
            r.push(i)
        }
    }

    return r
}

exports.print = function(arr)
{
    console.log(arr.join(','))
}

