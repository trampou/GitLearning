/**
 * 作者：陈丽
 * 最新更新：2017/03/12
 * 功能：目标页面渲染和基本交互的实现
 */
define(['Jquery','baseclass','config'],function($,baseclass){
    var targetAnalysis = inherit(baseclass.prototype);

    /*全局变量*/
    targetAnalysis.global = {
        'userToken':targetAnalysis.getParameter().token,
        'userId':targetAnalysis.getParameter().userId
    }

    /*初始化页面*/
    targetAnalysis.init = function(){

    }

    /*页面交互事件*/
    targetAnalysis.events = function(){

    }
});