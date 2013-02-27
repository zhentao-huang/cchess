exports = {}
process = {
    'nextTick':function(func)
    {
        func.call();
    }
}
