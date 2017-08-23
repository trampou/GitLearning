/**
 * Created by ludan on 2017/1/6.
 */

requirejs.config({

    baseUrl:'/report_web/js',

    paths:{
        "JQuery" : "lib/jquery.min",
        "bootstrap" : "lib/bootstrap.min",                  //这里设置的路径是相对与baseUrl的，不要包含.js
        'layer':'lib/layer.min',
        "ztree" : "lib/ztree/jquery.ztree.all",
        "klwUtil": "common/klwUtil",
        "BaseClass" : "BaseClass",
        "config" : "config",
        'homepage':"personalStatement/homepage/homepage"

    },
    shim:{//对外暴露的调用对象名,和模块依赖框架
        'JQuery':{
            exports:'$'
        },
        'bootstrap':{
            deps:['JQuery']
        },
        'layer':{
            deps:['JQuery'],
            ecports:'layer'
        },
        "ztree" :{
            deps : ["JQuery"]
        },
        "klwUtil" :{
            deps : ["ztree"]
        }
    }
});

// 开始逻辑
requirejs(['JQuery','homepage'],function($,homepage) {
    $(function () {
		homepage.init();

    });
});