(function (app) {
  var _cache = {};

  app.template = function tmpl(str, data){
    var fn, dom;
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    if (str.indexOf('<?') == -1) {
      if (_cache[str]) {
        fn = _cache[str];
      } else if (dom = document.getElementById(str)) {
        fn = tmpl(dom.innerHTML);
      } else {
        throw "Non-valid template identificator: " + str;
      }
    } else {
        fn = new Function("$",
          "with($) {" +
            "var p=[];" +

            "p.push('" +

            // Convert the template into pure JavaScript
            str
                .replace(/[\r\t\n]/g, " ")
                .split("<\?").join("\t")
                .replace(/((^|\?>)[^\t]*)'/g, "$1\r")
                .replace(/\t=\s*(\$\..*?)\?>/g, "',$1,'")
                .replace(/\t=(.*?)\?>/g, "',$1,'")
                .split("\t").join("');")
                .split("\?>").join("p.push('")
                .split("\r").join("\\'")
            + "');return p.join('');" +
          "}"
        );
        _cache[str] = fn;
    }

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };

})(fApp);
