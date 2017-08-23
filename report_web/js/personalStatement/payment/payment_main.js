/**
 * Created by ludan on 2017/1/6.
 */

requirejs.config({

    baseUrl:'/report_web/js',

    paths:{
        "JQuery" : "lib/jquery.min",
        "bootstrap" : "lib/bootstrap.min",                  //这里设置的路径是相对与baseUrl的，不要包含.js
		"echarts" : "lib/echarts.common.min",
        'layer':'lib/layer.min',
        "BaseClass" : "BaseClass",
        "config" : "config",
        'payment':"personalStatement/payment/payment",
        "public" :"personalStatement/public"

    },
    shim:{//对外暴露的调用对象名,和模块依赖框架
        'JQuery':{
            exports:'$'
        },
        'bootstrap':{
            deps:['JQuery']
        },
        'echarts':{
        	exports:"echarts"
        },
        'layer':{
            deps:['JQuery'],
            exports:'layer'
        },
        'public':{
        	deps:["JQuery"],
        	exports:"$P"
        }
    }
});

// 开始逻辑
requirejs(['JQuery','payment'],function ($,payment) {
    $(function () {
        payment.init();
    });
});