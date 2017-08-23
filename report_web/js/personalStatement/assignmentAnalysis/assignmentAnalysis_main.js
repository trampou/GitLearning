/**
 * Created by csl on 2017/3/7.
 */
requirejs.config({

    baseUrl:'/report_web/js',

    paths:{
        "JQuery" : "lib/jquery.min",
        "bootstrap" : "lib/bootstrap.min",
        "bs-datetimepicker":"lib/bs-datetimepicker/bootstrap-datetimepicker",
        "bs-datetimepicker-zh-CN":"lib/bs-datetimepicker/bootstrap-datetimepicker.zh-CN",
        "layer":"lib/layer.min",
        "echarts" :"lib/echarts.common.min",
        "BaseClass" : "BaseClass",
        "config" : "config",
        "artTemplate":"lib/artTemplate/template",
        "klwTools" : "common/klwTools",
        "assignmentAnalysis":"personalStatement/assignmentAnalysis/assignmentAnalysis",
        "public" :"personalStatement/public"
    },
    shim:{
        'JQuery':{
            exports:'$'
        },
        'echarts':{
            exports:"echarts"
        },
        'bootstrap':{
            deps:['JQuery']
        },
        'bs-datetimepicker':{
            deps: ['JQuery']
        },
        'bs-datetimepicker-zh-CN':{
            deps: ['bs-datetimepicker']
        },
        'layer':{
            deps:['JQuery'],
            ecports:'layer'
        }
    },
    waitSeconds:0
});
requirejs(['JQuery','assignmentAnalysis'],function($,assign) {
    $(function () {
        console.log($);
        assign.init();
    });
});