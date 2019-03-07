'use strict';
var fs = require('fs');

module.exports = function (opt) {

    var _opt = JSON.parse(JSON.stringify(opt || {}));

    String.prototype.endWith=function(endStr){
        var d=this.length-endStr.length;
        return (d>=0&&this.lastIndexOf(endStr)==d)
    }

    const $mainTps = _opt.main;
    const $appFile = _opt.appsrc.endWith('/') ? _opt.appsrc : _opt.appsrc+'/';
    const $xlsFile = _opt.xlsdir.endWith('/') ? _opt.xlsdir : _opt.xlsdir+'/';

    fs.readdir($appFile, (err, files) => {

        if (err) {
            return console.error(err);
        }

        if(files.length !== 0) files.forEach(function (key)
        {
            if(key !== $mainTps)
            {

                const xlsComparisonFile = JSON.parse(fs.readFileSync($xlsFile+key).toString());
                const appComparisonFile = JSON.parse(fs.readFileSync($appFile+key).toString());

                let newComparisonFile = appComparisonFile;
                for( let app in xlsComparisonFile)
                {
                    for(let xls in appComparisonFile) {
                        if(xls === app) {
                            newComparisonFile[app] = xlsComparisonFile[app];
                        }
                    }
                }

                fs.writeFile($appFile+key,JSON.stringify(newComparisonFile,null,4),'utf8',function (err) {
                    if (err) {
                        return console.error(err);
                    }
                })
            }
        });

    });
}
