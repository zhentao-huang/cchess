/**
 Get query parameters of the request 
 */
function queryParam(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i=0; i<vars.length; ++i)
    {
        var pair = vars[i].split("=");
        if (pair[0] == variable)
        {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

function save(name, value, succfunc, errfunc)
{
	var ok = false;
	var error;
    jQuery.ajax({
        type: 'POST',
        async : false,
        url : "/save/" + name,
        data : JSON.stringify(value),
        success : function(data)
        {
        	ok = true ;
        },
    });
    return ok;
}

function load(name)
{
	var obj = null;
	jQuery.ajax({
		type: 'GET',
		async: false,
		url : '/load/' + name,
		success : function(data)
		{
			obj = data;
		}
	})
	return obj;
}