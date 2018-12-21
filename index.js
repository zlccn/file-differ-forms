'use strict';
var fs = require('fs');

module.exports = function (opt) {

    var _opt = JSON.parse(JSON.stringify(opt || {}));

    String.prototype.endWith=function(endStr){
        var d=this.length-endStr.length;
        return (d>=0&&this.lastIndexOf(endStr)==d)
    }

    let Comp = {};
    const $mainTps = _opt.main;
    const $appFile = _opt.appsrc.endWith('/') ? _opt.appsrc : _opt.appsrc+'/';
    const $pcsFile = _opt.pcssrc.endWith('/') ? _opt.pcssrc : _opt.pcssrc+'/';
    const $xlsFile = _opt.xlsdir.endWith('/') ? _opt.xlsdir : _opt.xlsdir+'/';

    // Comparison app file
    Comp.ComparisonAppFile = fs.readFileSync($appFile+$mainTps).toString();
    // Comparison app file
    Comp.ComparisonPcsFile = fs.readFileSync($pcsFile+$mainTps).toString();

    let
    ComparisonAppFile = Comp.ComparisonAppFile.length != 0 ? JSON.parse(Comp.ComparisonAppFile) : '',
    ComparisonPcsFile = Comp.ComparisonPcsFile.length != 0 ? JSON.parse(Comp.ComparisonPcsFile) : '',
    ComparisonAppReaddir = [],
    ComparisonPcsReaddir = [];

    if(ComparisonAppFile === '' || ComparisonPcsFile === '') {
        return console.error('No content in the table.')
    }

    Array.prototype.indexOf = function(val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };

    function diff(arr1, arr2) {
        var newArr = [];
        var arr3=arr1.concat(arr2);
        function isContain(value){
            return arr1.indexOf(value)==-1||arr2.indexOf(value)==-1
        }
        newArr = arr3.filter(isContain);
        return newArr;
    }

    function DataNewView(types, proFiles, comFiles, url){

        let newFileElse = {},
            newDateElse = {};

        //过滤数据
        for (let xls in comFiles) {

            if(types === 'app')
            {
                if(xls.includes('|')) {
                    xls.split('|').forEach((key) => {
                        newFileElse[key] = comFiles[xls]
                    });
                } else if(xls.includes('app-')) {
                    newFileElse[xls.replace('app-','')] = comFiles[xls];
                } else if(xls.includes('pcs-')) {
                    delete newFileElse[xls]
                } else {
                    newFileElse[xls] = comFiles[xls];
                }
            }
            if(types === 'pcs')
            {
                if(xls.includes('|')) {
                    xls.split('|').forEach((key) => {
                        newFileElse[key] = comFiles[xls]
                    });
                } else if(xls.includes('app-')) {
                    delete newFileElse[xls]
                } else if(xls.includes('pcs-')) {
                    newFileElse[xls.replace('pcs-','')] = comFiles[xls];
                } else {
                    newFileElse[xls] = comFiles[xls];
                }
            }

        }

        for (let datas in proFiles) {
            for (let news in newFileElse) {
                if(datas === news) newDateElse[datas] = newFileElse[datas] !== ''
                    ? newFileElse[datas]
                    : proFiles[datas];
            }
        }

        fs.writeFile(url,JSON.stringify(newDateElse,null,4),'utf8',function (err) {
            if (err) {
                return console.error(err);
            }
        })
    }

    function DataTraversal(longs, short, types, filter, ComparisonLongsFile, ComparisonShortFile, ExportContent) {
        //如果属性名称相同
        if(longs === short)
        {   //要先判断内容是否也相同
            if(ComparisonLongsFile[longs] === ComparisonShortFile[short])
            {   //如果相同，则正常添加
                ExportContent[longs] = ComparisonLongsFile[longs];
            }
            else
            {   //如果不同，则分别创建
                if(types === 'app'){
                    ExportContent['app-'+longs] = ComparisonLongsFile[longs];
                    ExportContent['pcs-'+longs] = ComparisonShortFile[longs];
                } else {
                    ExportContent['pcs-'+longs] = ComparisonLongsFile[longs];
                    ExportContent['app-'+longs] = ComparisonShortFile[longs];
                }
                //去重枚举
                filter.push(longs);
            }
        }
        else
        {
            //要先判断内容是否也相同
            if(ComparisonLongsFile[longs] === ComparisonShortFile[short])
            {   //如果相同，则合并属性名
                ExportContent[longs+'|'+short] = ComparisonLongsFile[longs];
                //去重枚举
                filter.push(longs);
                filter.push(short);
            }
            else
            {   //如果属性名与内容都不一致，说明两个表中数据条数不同，差异直接追加
                ExportContent[longs] = ComparisonLongsFile[longs];
                ExportContent[short] = ComparisonShortFile[short];
            }
        }
    }

    //合并文件内容
    function Exportdocuments(ComparisonAppFile, ComparisonPcsFile) {
        let filter = [],
            ExportContent = {};

        //合并
        if(Object.keys(ComparisonAppFile).length >= Object.keys(ComparisonPcsFile).length)
        {   // app 内容条数高于 pcs 时,依据 app 条数遍历
            for(let app in ComparisonAppFile) {
                for(let pcs in ComparisonPcsFile) DataTraversal(app, pcs, 'app', filter, ComparisonAppFile, ComparisonPcsFile, ExportContent);
            }
        }
        else
        {   // pcs 内容条数高于 app 时,依据 pcs 条数遍历
            for(let pcs in ComparisonPcsFile) {
                for(let app in ComparisonAppFile) DataTraversal(pcs, app, 'pcs', filter, ComparisonPcsFile, ComparisonAppFile, ExportContent);
            }
        }

        //重定义
        for (let news in ExportContent) {
            for (let arr in filter) {
                if(news === filter[arr]) delete ExportContent[news];
            }
        }

        return ExportContent;
    }

    fs.readdir($appFile, function (err, files) {
        if (err) { return console.error(err); }
        ComparisonAppReaddir = files;
    });

    fs.readdir($pcsFile, function (err, files) {
        if (err) { return console.error(err); }
        ComparisonPcsReaddir = files;
    });

    fs.readdir($xlsFile, function (err, files) {

        if (err) {
            return console.error(err);
        }

        let Gxportdocuments = {};
        let Oxportdocuments = {};
        let history = {
            status: 'updated', // {状态} not=未更新; updated=已更新;
            olds : [],
            news : [],
            adds : [],
            delete : [],
            default : []
        };
        let Deduplication = 0;// 去重复

        // 项目表 对 通用表 合成
        try {

            if(files.length === 0)
            { //首次添加直接打印中文表
                Oxportdocuments = Exportdocuments(ComparisonAppFile, ComparisonPcsFile);
            }
            else
            { //修改更新时重新合并
                let
                    //打开合成后的中文表
                    xlsComparisonFile = JSON.parse(fs.readFileSync($xlsFile+$mainTps).toString()),
                    //调取修改后新生成的中文表
                    newComparisonFile = Exportdocuments(ComparisonAppFile, ComparisonPcsFile);

                if(Object.keys(xlsComparisonFile).length !== 0)
                {   //当原合成表中不为空时
                    for (let xls in xlsComparisonFile) {
                        history['default'].push(xls); //获取历史属性值
                        for (let news in newComparisonFile) {
                            if(xlsComparisonFile[xls] === newComparisonFile[news])
                            {   // 对比内容是否相同，如果相同依照原合成表顺序，修改 key 值
                                // 并从调取表中删除这一条数据
                                history['olds'].push(xls);
                                history['news'].push(news);
                                Gxportdocuments[news] = newComparisonFile[news];
                                if(newComparisonFile[news]) delete newComparisonFile[news];
                            }
                        }
                    }
                    //这时未删除的数据，看做新增内容，顺延添加至原合成表
                    if(Object.keys(newComparisonFile).length !== 0)
                    {
                        for (let news in newComparisonFile) {
                            history['adds'].push(news);
                            Gxportdocuments[news] = newComparisonFile[news];
                        }
                    }

                    //重组历史数据
                    history.delete = diff(history.default, history.news);
                    history.news.forEach(names => {
                        history.delete.forEach(dele => {
                            if(names === dele) history.delete.remove(names);
                        });
                    });

                    Oxportdocuments = Gxportdocuments;

                } else throw new Error('Universal language table cannot be empty.');

            }

            // 值为空，直接退出
            if(Object.keys(Oxportdocuments).length === 0) {
                throw new Error('Common statement ‘zh.json’ error, please try again.')
            }

            if(files.length !== 0) files.forEach(function (key) {
                if(key !== $mainTps) {
                    let xlsComparisonElseFile = JSON.parse(fs.readFileSync($xlsFile + key).toString()), xlsElArray = [];
                    for (let xlsEl in xlsComparisonElseFile) {
                        xlsElArray.push(xlsEl);
                        if(xlsComparisonElseFile[xlsEl] === '') return history.status = 'not';
                    }

                    // 通用中文表与其他语言表 条数 | 属性名 必须保存一致，否则直接报错
                    if (history['default'].toString() !== xlsElArray.toString()) {
                        throw new Error(`Common statement "${key}" error, please try again: \n\n [ ${diff(history['default'],xlsElArray)} ] \n\n`);
                    }
                }
            })

            //如果未更新，则只支持新添加，不生成 修改|删除
            if(files.length !== 0 && history.status === 'not')
            {
                let
                    //打开合成后的中文表
                    xlsComparisonFile = JSON.parse(fs.readFileSync($xlsFile+$mainTps).toString()),
                    //调取修改后新生成的中文表
                    newComparisonFile = Exportdocuments(ComparisonAppFile, ComparisonPcsFile),
                    Gxportdocuments = {};

                for (let xls in xlsComparisonFile) {
                    Gxportdocuments[xls] = xlsComparisonFile[xls];
                }
                if(Object.keys(history['adds']).length !== 0)
                {
                    for (let news in newComparisonFile) {
                        history.adds.forEach(names => {
                            if(names === news) Gxportdocuments[news] = newComparisonFile[news];
                        });
                    }
                }
                Oxportdocuments = Gxportdocuments;
            }

            // 初始值打印
            fs.writeFile($xlsFile+$mainTps,JSON.stringify(Oxportdocuments,null,4),'utf8',function (err) {
                if (err) {
                    return console.error(err);
                }

                if(files.length !== 0 ) files.forEach(function (key) {
                    if(key !== $mainTps){

                        if(ComparisonAppReaddir.indexOf(key) !== -1 && ComparisonPcsReaddir.indexOf(key) !== -1) {
                            try {
                                let // 如果项目中存在该文件则执行
                                    projectComparisonApp = JSON.parse(fs.readFileSync($appFile+key).toString()),
                                    projectComparisonPcs = JSON.parse(fs.readFileSync($pcsFile+key).toString());

                                // {1} 其他语言表条数 必须 和 中文表 相同
                                if( Object.keys(projectComparisonApp).length === Object.keys(ComparisonAppFile).length &&
                                    Object.keys(projectComparisonPcs).length === Object.keys(ComparisonPcsFile).length)
                                {
                                    let appZhArray = [], appSeArray = [], pcsZhArray = [], pcsSeArray = [];
                                    for (let appZh in ComparisonAppFile) { appZhArray.push(appZh) }
                                    for (let pcsZh in ComparisonPcsFile) { pcsZhArray.push(pcsZh) }
                                    for (let appSe in projectComparisonApp) { appSeArray.push(appSe) }
                                    for (let pcsSe in projectComparisonPcs) { pcsSeArray.push(pcsSe) }

                                    // {2} 其他语言表属性名 必须 和 中文表 保持一致，否则直接报错
                                    if(appZhArray.toString() !== appSeArray.toString()) {
                                        throw new Error(`App data attribute name is inconsistent: \n\n [ ${diff(appZhArray, appSeArray)} ] \n\n`);
                                    }

                                    if(pcsZhArray.toString() !== pcsSeArray.toString()) {
                                        throw new Error(`Pcs data attribute name is inconsistent: \n\n [ ${diff(pcsZhArray, pcsSeArray)} ] \n\n`);
                                    }

                                    // {1,2} 符合，则进入正常业务处理
                                    let xlsComparisonElseFile = JSON.parse(fs.readFileSync($xlsFile + key).toString()),
                                        newComparisonElseFile = {};

                                    for (let xlsEl in xlsComparisonElseFile) {
                                        //替换旧属性名
                                        history['olds'].forEach((names,index) => {
                                            if(xlsEl === names) newComparisonElseFile[history.news[index]] = xlsComparisonElseFile[xlsEl];
                                        });
                                    }

                                    //如果未更新，则只支持新添加，不生成 修改|删除
                                    if(history.status === 'not')
                                    {
                                        let Gxportdocuments = {};
                                        for (let xls in xlsComparisonElseFile) {
                                            Gxportdocuments[xls] = xlsComparisonElseFile[xls];
                                        }
                                        newComparisonElseFile = Gxportdocuments;
                                    }

                                    //添加新数据
                                    history['adds'].forEach(names => {
                                        newComparisonElseFile[names] = '';
                                    });

                                    fs.writeFile($xlsFile+key,JSON.stringify(newComparisonElseFile,null,4),'utf8',function (err) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        Deduplication++;
                                    })

                                } else throw new Error('Inconsistent number of data.');


                            } catch (e) {
                                //不存在直接退出
                                return console.error(e)
                            }
                        }

                    }
                })

            })

        } catch (e) {
            return console.error(e)
        }

        // 通用表 对 项目表 更新
        try {

            let lication = setInterval(function () {

                let
                    AppLen = Object.keys(ComparisonAppReaddir).length,
                    PcsLen = Object.keys(ComparisonPcsReaddir).length;

                if(Deduplication === AppLen-1) {
                    //等待 (项目表 对 通用表 合成) 全部完成之后，停止定时器，执行业务
                    clearInterval(lication);

                    let //打开合成后的中文表
                        xlsComparisonFile = JSON.parse(fs.readFileSync($xlsFile+$mainTps).toString());

                    if(files.length !== 0) files.forEach(function (key) {
                        if (key !== $mainTps) { //规避中文表

                            let // 如果项目中存在该文件则执行
                                projectComparisonXls = JSON.parse(fs.readFileSync($xlsFile+key).toString());

                            // {1} 其他语言表条数 必须 和 中文表 相同
                            if(Object.keys(xlsComparisonFile).length === Object.keys(projectComparisonXls).length)
                            {
                                let xlsZhArray = [], xlsSeArray = []
                                for (let xlsZh in xlsComparisonFile) { xlsZhArray.push(xlsZh) }
                                for (let xlsSe in projectComparisonXls) { xlsSeArray.push(xlsSe) }

                                // 通用中文表与其他语言表 条数 | 属性名 必须保存一致，否则直接报错
                                if(xlsZhArray.toString() !== xlsSeArray.toString()) {
                                    throw new Error(`Common statement "${key}" error, please try again: \n\n [ ${diff(xlsZhArray,xlsSeArray)} ] \n\n`);
                                }

                                try {

                                    let // 打开 项目中的对应语言表，如果不存在，则直接创建
                                        historyFileElseApp = JSON.parse(fs.readFileSync($appFile+key).toString()),
                                        historyFileElsePcs = JSON.parse(fs.readFileSync($pcsFile+key).toString());

                                    DataNewView('app', historyFileElseApp, projectComparisonXls, $appFile+key);
                                    DataNewView('pcs', historyFileElsePcs, projectComparisonXls, $pcsFile+key);

                                } catch (e) {

                                    let // 打开 项目中的对应语言表，如果不存在，则直接创建
                                        historyFileElseApp = JSON.parse(fs.readFileSync($appFile+$mainTps).toString()),
                                        historyFileElsePcs = JSON.parse(fs.readFileSync($pcsFile+$mainTps).toString());

                                    DataNewView('app', historyFileElseApp, projectComparisonXls, $appFile+key);
                                    DataNewView('pcs', historyFileElsePcs, projectComparisonXls, $pcsFile+key);
                                }

                            } else throw new Error('Inconsistent number of data.');
                        }
                    });
                }
            },1000)

        } catch (e) {
            return console.error(e)
        }

    });


}
