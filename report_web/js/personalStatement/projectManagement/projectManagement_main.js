/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：项目页面渲染和基本交互的实现文件的入口文件
 */
require({
    baseUrl:"/report_web/js/",
    paths:{
        "JQuery":"lib/jquery-3.1.1",
        "layer":"lib/layer.min",
        "echarts":"lib/echarts.common.min",
        "artTemplate":"lib/artTemplate/template",
        "baseclass":"baseClass",
        "config":"config",
        "projectManagement":"personalStatement/projectManagement/projectManagement"
    },
    shim: {
        "JQuery":{
            exports:"$"
        },
        "layer":{
            deps:['JQuery']
        }
    }
});

require(['projectManagement'],function(p){
    /*console.info(typeof p.init);*/
    p.init();
});
