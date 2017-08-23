/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：考勤首页页面渲染和基本交互的实现文件的入口文件
 */
require.config({
    baseUrl:"/report_web/js",
    paths:{
        "JQuery":"lib/jquery.min",
        "moment":"lib/moment.min",
        "fullCalendar":"lib/fullcalendar",
        "bootstrapDateTimePicker":"lib/bootstrap-datetimepicker",
        "bs-datetimepicker_zh-CN":"personalStatement/attendanceAnalysis/cl_bootstrap-datetimepicker.zh-CN",
        "layer":"lib/layer.min",
        "baseclass":"BaseClass",
        "config":"config",
        "attendanceAnalysis":"personalStatement/attendanceAnalysis/attendanceAnalysis"
    },
    shim:{
        "JQuery":{
            exports:"$"
        },
        "fullCalendar":{
            deps:["JQuery","moment"]
        },
        "layer":{
            deps:["JQuery"]
        },
        "bootstrapDateTimePicker":{
            deps:["JQuery"]
        },
        'bs-datetimepicker_zh-CN':{
            deps: ['bootstrapDateTimePicker']
        }
    }
});

require(["attendanceAnalysis"],function(a){
    $(document).ready(function(){
        a.init();
    });
    /*console.info(a);*/
});