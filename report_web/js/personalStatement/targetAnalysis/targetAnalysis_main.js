/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：目标页面渲染和基本交互的实现文件的入口文件
 */
require.config({
    baseUrl:"/report_web/js",
    paths:{
        "JQuery":"lib/jquery-3.1.1",
        "baseclass":"BaseClass",
        "config":"config",
        "targetAnalysis":"personalStatement/targetAnalysis"
    },
    shim:{
        "JQuery":{
            exports:'$'
        }
    }
});

require(['targetAnalysis'],function(t){
    t.init();
});