'use strict';
var fs = require('fs');

module.exports = function (opt) {

    var _opt = JSON.parse(JSON.stringify(opt || {}));

    var Comp = {};
    var $mainTps = _opt.main;
    var $appFile = _opt.appsrc;
    var $pcsFile = _opt.pcssrc;
    var $xlsFile = _opt.xlsdir;

    // Comparison app file
    Comp.ComparisonAppFile = fs.readFileSync($appFile+$mainTps).toString();
    // Comparison app file
    Comp.ComparisonPcsFile = fs.readFileSync($pcsFile+$mainTps).toString();

    function DataTraversal(app, pcs, filter, ComparisonAppFile, ComparisonPcsFile, ExportdocumentsFile) {

        if(app === pcs)
        {
            if(ComparisonAppFile[app] === ComparisonPcsFile[app])
            {
                ExportdocumentsFile[app] = ComparisonAppFile[app];
            }
            else console.error(`ERROR: app:{ ${app}:${ComparisonAppFile[app]} } | pcs:{ ${pcs}:${ComparisonPcsFile[pcs]} }`)
        }
        else
        {

            if(ComparisonAppFile[app] === ComparisonPcsFile[pcs])
            {
                ExportdocumentsFile[app+'|'+pcs] = ComparisonAppFile[app]
                filter.push(app)
                filter.push(pcs)
            }

            if(!filter.includes(app)) ExportdocumentsFile[app] = ComparisonAppFile[app];
            else
            {
                if(ExportdocumentsFile[app]) delete ExportdocumentsFile[app];
            }

            if(!filter.includes(pcs)) ExportdocumentsFile[pcs] = ComparisonPcsFile[pcs];
            else
            {
                if(ExportdocumentsFile[pcs]) delete ExportdocumentsFile[pcs];
            }

        }

    }

    function DataNewView(types, files, comFile, url){
        files.forEach(function(key) {
            if(key != $mainTps)
            {
                let oldFiles = JSON.parse(fs.readFileSync($xlsFile+key).toString());
                let ferFiles = {};
                let newFiles = {};

                if(types === 'xlsFile')
                {
                    for(let app in comFile) {
                        if(Object.keys(oldFiles).length === 0) newFiles[app] = "";
                        else {
                            for(let xls in oldFiles) {
                                if(app === xls) newFiles[app] = oldFiles[app];
                                else {
                                    if(!oldFiles[app]) newFiles[app] = "";
                                }
                            }
                        }
                    }
                }
                else
                {
                    let historyFile = JSON.parse(fs.readFileSync(url+key).toString());

                    if(Object.keys(oldFiles).length != 0)
                    {
                        for(let app in oldFiles) {
                            if(app.includes('|')) app.split('|').forEach((key) => {
                                ferFiles[key] = oldFiles[app]
                            }); else ferFiles[app] = oldFiles[app];
                        }

                        for(let old in historyFile) {
                            for(let all in ferFiles) {
                                if(old == all) newFiles[old] = ferFiles[old].length != 0 ? ferFiles[old] : historyFile[old];
                            }
                        }
                    }
                    else
                    {
                        for(let old in historyFile) {
                            newFiles[old] = historyFile[old];
                        }
                    }
                }
                //打印文件
                fs.writeFile(url+key,JSON.stringify(newFiles,null,4),'utf8',function (err) {
                    if (err) {
                        return console.error(err);
                    }
                })
            }
        })
    }

    fs.readdir($xlsFile,function (err, files) {
        if (err) {
            return console.error(err);
        }

        //数据生成
        if(Comp.ComparisonAppFile && Comp.ComparisonPcsFile)
        {
            let ComparisonAppFile = JSON.parse(Comp.ComparisonAppFile),
                ComparisonPcsFile = JSON.parse(Comp.ComparisonPcsFile),
                filter = [],
                ExportdocumentsFile = {},
                GxportdocumentsFile = {},
                OxportdocumentsFile = {};

            //合并文件内容
            if(Object.keys(ComparisonAppFile).length >= Object.keys(ComparisonPcsFile).length)
            {
                for(let app in ComparisonAppFile) {
                    for(let pcs in ComparisonPcsFile) DataTraversal(app, pcs, filter, ComparisonAppFile, ComparisonPcsFile, ExportdocumentsFile);
                }
            }
            else
            {
                for(let pcs in ComparisonPcsFile) {
                    for(let app in ComparisonAppFile) DataTraversal(app, pcs, filter, ComparisonAppFile, ComparisonPcsFile, ExportdocumentsFile);
                }
            }
            //初始化后生成文件排序
            if(files.length == 0)
            {
                OxportdocumentsFile = ExportdocumentsFile;
            }
            else
            {
                for(let all in ExportdocumentsFile) {
                    for(let oxp in JSON.parse(fs.readFileSync($xlsFile+$mainTps).toString())) {
                        if(oxp == all){
                            OxportdocumentsFile[all] = ExportdocumentsFile[all];
                        } else {
                            GxportdocumentsFile[all] = ExportdocumentsFile[all];
                        }
                    }
                }
                Object.assign(OxportdocumentsFile,GxportdocumentsFile);
            }
            //打印文件
            fs.writeFile($xlsFile+$mainTps,JSON.stringify(OxportdocumentsFile,null,4),'utf8',function (err) {
                if (err) {
                    return console.error(err);
                }

                DataNewView('xlsFile', files, OxportdocumentsFile, $xlsFile);
            })
        }

        //数据更新
        if(files.length != 0)
        {
            DataNewView('appFile', files, JSON.parse(Comp.ComparisonAppFile), $appFile);
            DataNewView('pcsFile', files, JSON.parse(Comp.ComparisonPcsFile), $pcsFile);
        }

    })

}