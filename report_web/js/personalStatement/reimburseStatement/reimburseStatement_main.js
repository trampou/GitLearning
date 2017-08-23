/**
 * Created by Sasha on 2017/2/13.
 */
require.config({
    baseUrl : "/report_web/js",
    paths : {
        "JQuery" : "lib/jquery.min",
        "bootstrap" : "lib/bootstrap.min",
        'bs-datetimepicker':'lib/bs-datetimepicker/bootstrap-datetimepicker',
        'bs-datetimepicker-zh-CN':'lib/bs-datetimepicker/bootstrap-datetimepicker.zh-CN',
        "reimburseStatement" : "personalStatement/reimburseStatement/reimburseStatement",
        'artTemplate':'lib/artTemplate/template',
        "echarts" : "lib/echarts.common.min",
        "layer" : "lib/layer.min",
        "BaseClass" : "BaseClass",
        "klwTools" : "common/klwTools",
        "config" : "config"
    },
    shim:{
        "JQuery" :{
            exports : "$"
        },
        "bootstrap": {
            deps: ["JQuery"]
        },
        'bs-datetimepicker':{
            deps: ['JQuery']
        },
        'bs-datetimepicker-zh-CN':{
            deps: ['bs-datetimepicker']
        },
        "echarts":{
            exports : "echarts"
        },
        "layer": {
            deps: ["JQuery"],
            exports: "layer"
        }
    }
});

require(["JQuery","reimburseStatement"], function($, reimburse){
    $(function(){
        reimburse.init();
    });
});
