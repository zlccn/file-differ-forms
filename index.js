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

    function DataTraversal(app,pcs,ComparisonAppFile,ComparisonPcsFile,ExportdocumentsFile) {
        if(app === pcs)
        {
            if(ComparisonAppFile[app] === ComparisonPcsFile[app])
            {
                ExportdocumentsFile[app] = ComparisonAppFile[app];
            }
            else console.error(`ERROR: { ${app}:${ComparisonAppFile[app]} } | { ${pcs}:${ComparisonPcsFile[pcs]} }`)
        }
        else
        {
            ExportdocumentsFile[app] = ComparisonAppFile[app];
            ExportdocumentsFile[pcs] = ComparisonPcsFile[pcs];
        }
    }

    function DataNewView(files, comFile, url){
        files.forEach(function(key) {
            if(key != $mainTps)
            {
                let oldFiles = JSON.parse(fs.readFileSync($xlsFile+key).toString());
                let newFiles = {};

                for(let app in comFile) {
                    for(let xls in oldFiles) {
                        if(app == xls) newFiles[app] = oldFiles[app]
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
                ExportdocumentsFile = {},
                GxportdocumentsFile = {},
                OxportdocumentsFile = {};

            //合并文件内容
            if(Object.keys(ComparisonAppFile).length >= Object.keys(ComparisonPcsFile).length)
            {
                for(let app in ComparisonAppFile) {
                    for(let pcs in ComparisonPcsFile) DataTraversal(app, pcs, ComparisonAppFile, ComparisonPcsFile, ExportdocumentsFile);
                }
            }
            else
            {
                for(let pcs in ComparisonPcsFile) {
                    for(let app in ComparisonAppFile) DataTraversal(app, pcs, ComparisonAppFile, ComparisonPcsFile, ExportdocumentsFile);
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
            })
        }

        //数据更新
        if(files.length != 0)
        {
            DataNewView(files, JSON.parse(Comp.ComparisonAppFile), $appFile);
            DataNewView(files, JSON.parse(Comp.ComparisonPcsFile), $pcsFile);
        }

    })

}