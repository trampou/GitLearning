/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：考勤里面带薪假期页面渲染和基本交互的实现文件的入口文件
 */
require.config({
    baseUrl:"/report_web/js",
    paths:{
        "JQuery":"lib/jquery.min",
        "layer":"lib/layer.min",
        "baseclass":"BaseClass",
        "config":"config",
        "vacationStatus":"personalStatement/attendanceAnalysis/vacationStatus"
    },
    shim:{
        "JQuery":{
            exports:"$"
        },
        "layer":{
            deps:["JQuery"]
        }
    }
});

require(["vacationStatus"],function(v){
    v.init();
});