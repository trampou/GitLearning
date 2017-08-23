define(["JQuery","BaseClass","config"], function($,BaseClass,config) {

    /**
     * klwPager 是基于twbsPagination分页插件做的封装，满足公司的需求
     * @exports klwPager
     */
    var klwPager = inherit(BaseClass.prototype);

    /**
     *  默认配置信息
     */
    var globalDefaultSetting = {
        targetId: "",
	    // 默认是绿色皮肤
	    themeSkin: "green",
	    // 分页显示的位置 center，right,left
	    align:"center",
	    startPage: 1,
	    totalPages: 50,
	    // 可以看到的最大分页按钮数字，默认是显示5页的分页按钮
	    visiblePages: 5,
	    // 页面第一次初始化完成之后是否触发onPageClick点击事件，true，表示触发, false表示不触发
	    initiateStartPageClick: true,
	    // 如果只有一页，是否隐藏所有的分页控制按钮
	    hideOnlyOnePage: false,
	    //是否允许循环，即第一页的上一页就是最后一页，最后一页的下一页就是最后一页
	    loop: false,
	    //第一页
	    first: "&lt;&lt;",
	    //上一页
	    prev: "&lt;",
	    // 下一页
	    next: "&gt;",
	    // 最后一页
        last: "&gt;&gt;",
        "beforeInitCallback" : null,
        "initCallback" : null,
        /*
         * page 控件对象
         * pageNumber 点击的页面数
         * */
        onPageClick: function (page, pageNumber) {
            //设置当前页
            that.setCurrentPage(pageNumber);

            //如果 用户配置了 onCheck 的回调函数
            if (that.setting.clickCallback != undefined && that.setting.clickCallback != null) {
                //传递 树的ID ，选中的节点 ，插件对象
                that.setting.clickCallback(page, pageNumber, that);
            }
        }
    };

    /**
     *  @class
     *  klwPager 一个 klwPager 对象
     */
    klwPager.klwPager = function(userSetting) {

        var that = this;
        //默认第一次进来当前页是第一页
        var currentPage = 1;

        /**
         * 获取twbs对象
         * @returns {*|jQuery|HTMLElement}
         */
        this.getTwbsPaginationObj = function(){
            return $('#' + this.setting.targetId);
        };

        /**
         * 获取当前页
         * @returns {number}
         */
        this.getCurrentPage = function(){
            return currentPage
        };

        /**
         * 设置当前页
         * @param pageNumber
         * @returns {*}
         */
        this.setCurrentPage = function(pageNumber){
            return currentPage = pageNumber;
        };


        // 默认配置信息
        var defaultSetting = {
            targetId: "",
            // 默认是绿色皮肤
            themeSkin: "green",
            // 分页显示的位置 center，right,left
            align:"center",
            startPage: 1,
            totalPages: 50,
            // 可以看到的最大分页按钮数字，默认是显示5页的分页按钮
            visiblePages: 5,
            // 页面第一次初始化完成之后是否触发onPageClick点击事件，true，表示触发, false表示不触发
            initiateStartPageClick: true,
            // 如果只有一页，是否隐藏所有的分页控制按钮
            hideOnlyOnePage: true,
            //是否允许循环，即第一页的上一页就是最后一页，最后一页的下一页就是最后一页
            loop: false,
            //第一页
            first: "&lt;&lt;",
            //上一页
            prev: "&lt;",
            // 下一页
            next: "&gt;",
            // 最后一页
            last: "&gt;&gt;",
            "beforeInitCallback" : null,
            "initCallback" : null,
            /*
             * page 控件对象
             * pageNumber 点击的页面数
             * */
            onPageClick: function (page, pageNumber) {
                //设置当前页
                that.setCurrentPage(pageNumber);

                //如果 用户配置了 onCheck 的回调函数
                if (that.setting.clickCallback != undefined && that.setting.clickCallback != null) {
                    //传递 树的ID ，选中的节点 ，插件对象
                    that.setting.clickCallback(page, pageNumber, that);
                }
            }
        };

        /**
         * 当前对象的配置信息
         * @type {void|*}
         */
        this.setting = $.extend(defaultSetting, userSetting);

        /**
         * 动态的给dom添加 style标签，里面有css的样式代码
         * @param cssString
         */
        this.addCssByStyle = function(cssString){
            var doc=document;
            var style=doc.createElement("style");
            style.setAttribute("type", "text/css");

            if(style.styleSheet){// IE
                style.styleSheet.cssText = cssString;
            } else {// w3c
                var cssText = doc.createTextNode(cssString);
                style.appendChild(cssText);
            }

            var heads = doc.getElementsByTagName("head");
            if(heads.length)
                heads[0].appendChild(style);
            else
                doc.documentElement.appendChild(style);
        };

        /**
         * 重置配置文件内容
         * @param userSetting
         */
        this.resetPlugin = function(userSetting){
            userSetting = userSetting || {};
            $pagination = that.getTwbsPaginationObj();
            $pagination.twbsPagination('destroy');
            $pagination.twbsPagination($.extend(that.setting, userSetting));
        };

        /**
         * 销毁对象
         */
        this.destoryPlugin = function(){
            //var twbsPaginationObj = $('#' + this.setting.targetId).data("twbs-pagination");
            //if( twbsPaginationObj != null && twbsPaginationObj != undefined && twbsPaginationObj != ""){
            //    twbsPaginationObj.destroy();
            //}
            $pagination = that.getTwbsPaginationObj();
            $pagination.twbsPagination('destroy');
        };

        /**
         * 对象初始化执行的内容
         */
        this.init = function(){
            //添加style样式，默认覆盖原先的样式
            if(that.setting.themeSkin == "green"){
                var greenStyle ='.pagination>.active>a,.pagination>.active>span,.pagination>.active>a:hover,.pagination>.active>span:hover,.pagination>.active>a:focus,.pagination>.active>span:focus{background-color:#2ec16c;border-color:#2ec16c;margin-left:5px}.pagination>li>a,.pagination>li>span{color:#666;margin-left:5px}.pagination>li>a:hover,.pagination>li>span:hover,.pagination>li>a:focus,.pagination>li>span:focus{background-color:rgba(176,189,201,1);color:#fff}.pagination>li{display: inline-block;}';
                that.addCssByStyle(greenStyle);
            }
            $('#' + this.setting.targetId).css({
                "text-align":that.setting.align,
                "width":"100%"
            });

            //页面初始化完成之后执行的回调
            if (that.setting.beforeInitCallback != undefined && that.setting.beforeInitCallback != null) {
                //传递 树的ID ，选中的节点 ，插件对象
                that.setting.beforeInitCallback(that);
            }

            //初始化分页组件
            $('#' + this.setting.targetId).twbsPagination(that.setting);

            //页面初始化完成之后执行的回调
            if (that.setting.initCallback != undefined && that.setting.initCallback != null) {
                //传递 树的ID ，选中的节点 ，插件对象
                that.setting.initCallback(that);
            }
        };
        this.init();

    };

    /**
     * 销毁分页对象
     * @param selector 分页对象的选择器
     * @static
     */
    klwPager.destory = function(selector){
        $(selector).twbsPagination('destroy');
    };

    /**
     * 重置分页对象
     * @param selector  查找到分页对象的 选择器字符串
     * @param option  重置分页对象的配置文件
     * @static
     */
    klwPager.reset = function(selector,option){
        var setting = $.extend(globalDefaultSetting,option);
        $(selector).twbsPagination(setting);
    };

    return klwPager;
});


