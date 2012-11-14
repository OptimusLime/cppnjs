
var xmlloaded = false;


function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            oldonload();
            func();
        }
    }
}


function importXML(xmlfile)
{
    var xmlDoc;
    try
    {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", xmlfile, false);
    }
    catch (Exception)
    {
        var ie = (typeof window.ActiveXObject != 'undefined');

        if (ie)
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            while(xmlDoc.readyState != 4) {}
            xmlDoc.load(xmlfile);
            xmlloaded = true;
            return xmlDoc;
        }
        else
        {
            xmlDoc = document.implementation.createDocument("", "", null);
            xmlDoc.load(xmlfile);
            xmlloaded = true;
            return xmlDoc;
        }
    }

    if (!xmlloaded)
    {
        xmlhttp.setRequestHeader('Content-Type', 'text/xml')
        xmlhttp.send("");
        xmlDoc = xmlhttp.responseXML;
        xmlloaded = true;
        return xmlDoc;
    }
}

ensureParserExists = function()
{
    if(typeof(DOMParser) == 'undefined') {
        DOMParser = function() {}
        DOMParser.prototype.parseFromString = function(str, contentType) {
            if(typeof(ActiveXObject) != 'undefined') {
                var xmldata = new ActiveXObject('MSXML.DomDocument');
                xmldata.async = false;
                xmldata.loadXML(str);
                return xmldata;
            } else if(typeof(XMLHttpRequest) != 'undefined') {
                var xmldata = new XMLHttpRequest;
                if(!contentType) {
                    contentType = 'application/xml';
                }
                xmldata.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
                if(xmldata.overrideMimeType) {
                    xmldata.overrideMimeType(contentType);
                }
                xmldata.send(null);
                return xmldata.responseXML;
            }
        }
    }
};