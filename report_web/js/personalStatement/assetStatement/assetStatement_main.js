/**
 * Created by Sasha on 2017/2/8.
 */
require.config({
    baseUrl : "/report_web/js",
    paths : {
        "JQuery" : "lib/jquery.min",
        "bootstrap" : "lib/bootstrap.min",
        "assetStatement" : "personalStatement/assetStatement/assetStatement",
        'artTemplate':'lib/artTemplate/template',
        "layer" : "lib/layer.min",
        "BaseClass" : "BaseClass",
        "config" : "config"
    },
    shim:{
        "JQuery" :{
            exports : "$"
        },
        "bootstrap": {
            deps: ["JQuery"]
        },
        "layer": {
            deps: ["JQuery"],
            exports: "layer"
        }
    }
});

require(["JQuery","assetStatement"], function($, asset){
    $(function(){
        asset.init();
    });
});