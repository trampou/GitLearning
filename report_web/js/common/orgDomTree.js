define(["JQuery"],function($) {
    var orgDomTree = (function($){

        /**
         * 从下往上递归，判断是否有子节点，如果有子节点，则显示当前子节点
         */
        function recursionParentNode(node){
            var parentObj = $(node).closest("ul").closest("li");
            // 如果存在父节点
            if(parentObj.length > 0){
                parentObj.children("span").children(".nodeSwitch").removeClass("node-folded").addClass("node-unfolded");
                parentObj.children("ul").children("li").show("fast");
                recursionParentNode(parentObj);
            }
        }

        /**
         *  定义一个组织机构类
         *  userSetting 为用户的配置信息，包括回调函数等
         * */
        function orgMindChart(userSetting){
            userSetting = userSetting || {};
            // 创建时间戳树形一定要动态生成，不能放在prototype属性中，不然，pluginId永远是动态的
            this.pluginId = new Date().getTime()+ Math.floor(Math.random()*100);

            // 设置最高汇报人的信息为空对象
            if(userSetting.topLeader != null && userSetting.topLeader != undefined){
                this.topLeader = userSetting.topLeader;
            }else{
                this.topLeader ={
                    id:0
                };
            }
            //对象初始化方法
            this.init(userSetting);
        }

        orgMindChart.test = function(){
            alert("stest");
        };

        // 定义插件的原型链
        orgMindChart.prototype = {
            // 整个机构树的 HTML
            "treeHtml" : "",
            //添加节点的选择器
            "nodeAddSelector" : "",
            //修改节点的选择器
            "nodeEditSelector" : "",
            //删除节点的选择器
            "nodeDelSelector" : "",
            //  变更汇报关系的选择器
            "nodeChangeReporterSelector" : "",
            // 重置标记，如果为true，则获取HTML是需要重新生成的，如果为false,则获取HTML是从缓存中获取的
            "isReset" :false,
            // 选中节点的ID，即使用鼠标点击，就表明是选中的节点
            "selectedNodeId" : "",
            // 用户的配置信息
            "userSetting" : {
                // jquery选择器，即插件显示的位置，必填
                "selector":"",
                // reportRaltion(人员汇报关系)，orgLevel(机构层级)
                dataType:"orgLevel",
                // 用户需要显示的数据，必填
                "userData":"",
                /**
                 *  初始化之前执行的回调
                 * */
                "beforeInitCallback" : function(pluginObj){
                },
                /**
                 *  初始化之后执行的回调
                 * */
                "afterInitCallback" : function(pluginObj){
                },
                /**
                 *  点击节点执行的回调
                 * */
                "nodeClickCallback" : function(event, dom, pluginObj){
                },
                /**
                 *  点击节点执行的回调
                 * */
                "nodeAddCallback" : function(event, dom, pluginObj){
                },
                /**
                 *  点击节点执行的回调
                 * */
                "nodeEditCallback" : function(event, dom, pluginObj){
                },
                /**
                 *  更改汇报关系回调函数
                 * */
                "changeReporterCallback" : function(event,dom){
                    console.log("default changeReporterCallback");
                },
                /**
                 *  点击节点执行的回调
                 * */
                "nodeDelCallback" : function(event, dom, pluginObj){
                }
            },
            /**
             * 创建对象的初始化方法
             * */
            "init" : function(userSetting){
                // 整合用户的配置信息
                this.userSetting = $.extend(orgMindChart.prototype.userSetting,userSetting);

                //初始化之前执行的回调
                this.beforeInitCallback();

                // 判断用户是否输入了插件位置的选择器
                if(this.userSetting.selector != ""){
                    $(this.userSetting.selector).html(this.getTreeHtml());
                }else{
                    console.error("请输入插件显示位置的jquery选择字符串");
                }

                // 标记li 节点的层级  父节点的ID  子节点的数量
                this.markLevel();
                // 设置根节点标记
                this.setRootMark();
                //事件绑定，添加标记等动作
                this.eventBinding();
                // 初始化之后执行的回调
                this.afterInitCallback();
                // 删除没有子机构节点的展开节点开关
                this.delExpandIcon();
                // 显示直属节点数量
                this.showSubNodesNumber();
            },
            /**
             * 标记li 节点的层级  父节点的ID  子节点的数量
             * */
            "markLevel":function(levelNum,nodeDom){
                var that = this;
                // 如果是根节点
                if(levelNum == undefined || levelNum == null){
                    levelNum = 0;

                    var $sonLis = $("#"+ this.getPluginId() + " .org_tree > ul > li ");

                    // 标记node li的层级
                    $sonLis.each(function(){
                        var tempLevelNum = levelNum;
                        // 缓存当前对象
                        var currentObj = $(this);
                        // 设置当前节点包含子节点数
                        currentObj.attr("subNodesNum",currentObj.children("ul").children("li").length);
                        // 设置当前的父节点id
                        currentObj.attr("data_pid",0);
                        // 设置当前节点的层级
                        currentObj.attr("data_level",tempLevelNum);
                        // 判断是否有子节点,如果当前节点下面有ul标签，表示有子节点
                        if(currentObj.find("ul").length > 0){
                            tempLevelNum = tempLevelNum + 1;
                            that.markLevel(tempLevelNum,this);
                        }
                    });
                }
                // 如果不是根节点
                else{
                    var data_pid = $(nodeDom).attr("data_id");
                    $(nodeDom).children("ul").children("li").each(function(){
                        var tempLevelNum = levelNum;
                        // 缓存当前对象
                        var currentObj = $(this);
                        // 设置当前节点包含子节点数
                        currentObj.attr("subNodesNum",currentObj.children("ul").children("li").length);
                        // 设置当前的父节点id
                        currentObj.attr("data_pid",data_pid);
                        // 设置当前节点的层级
                        currentObj.attr("data_level",tempLevelNum);
                        // 判断是否有子节点,如果当前节点下面有ul标签，表示有子节点
                        if(currentObj.find("ul").length > 0){
                            tempLevelNum = tempLevelNum + 1;
                            that.markLevel(tempLevelNum,this);
                        }
                    });
                }
            },
            /**
             * 显示直属下级节点数
             * */
            "showSubNodesNumber":function(){
                if(this.userSetting.dataType == "reportRaltion"){
                    $("#"+this.getPluginId() + " .org_tree ul li ").each(function(){
                        var currentObj = $(this);
                        var subNodesNum = parseInt(currentObj.attr("subNodesNum"));
                        if(subNodesNum > 0){
                            currentObj.find(".name .employeeNum").html(subNodesNum);
                        }else{
                            currentObj.find(".name .employeeNum").remove();
                        }
                    });
                }
            },
            /**
             * 删除展开节点的icon(图标)，在初始化的时候，需要删除没有子节点的icon
             * */
            "delExpandIcon":function(){
                $("#"+this.getPluginId() + " .org_tree ul li").not(".parent_li").find("i.nodeSwitch").remove();
            },
            /**
             * 根据标准数据格式返回符合要求的 HTML,满足DOM树节点
             * parentJson 用于检测 领导汇报 是否出现在子汇报对象中，即循环汇报
             * */
            "getHtmlByStandardData" : function(dataArray,parentJson){
                // 机构层级
                if(this.userSetting.dataType == "orgLevel"){
                    var resultHtml = "";
                    //判断参数是否为数组，如果是数组，则需要添加<ul>标签，如果是json，则使用li标签
                    if($.isArray(dataArray)){
                        resultHtml = "<ul>";
                        // 循环遍历里面的每个节点
                        for(var i = 0; i < dataArray.length; i++){
                            resultHtml = resultHtml + this.getHtmlByStandardData(dataArray[i]);
                        }
                    }else{
                        var charger = "无";
                        if(dataArray["managerName"] != null && dataArray["managerName"] != ""){
                            charger = dataArray["managerName"].htmlEncode();
                        }
                        var resultHtml = resultHtml +  '<li ' + ' data_id="' + dataArray["id"] + '" data_pid="'+  dataArray["pid"] +'" ><span><div class="name">'+dataArray["name"].htmlEncode()+'</div><div class="managerName">负责人<i managerId='+dataArray["managerId"]+'>'+charger+'</i></div><div class="subEmployeeCount" usersNum="'+dataArray["subEmployeeCount"]+'"><i>'+dataArray["subEmployeeCount"]+'人</i></div><div class="tools"><i class="nodeAdd"></i><i class="nodeEdit"></i><i class="nodeDel"></i></div><i class="nodeSwitch node-folded"></i></span>';
                        // 判断是否有子节点，如果有子节点，则进行递归操作
                        if(dataArray["subOrgList"] != undefined && dataArray["subOrgList"] != "" && dataArray["subOrgList"] != null){
                            resultHtml = resultHtml + this.getHtmlByStandardData(dataArray["subOrgList"]);
                        }
                        resultHtml = resultHtml + '</li>';
                    }

                    //判断参数是否为数组，如果是数组，则需要添加<ul>标签，如果是json，则使用li标签
                    if($.isArray(dataArray)){
                        resultHtml = resultHtml + "</ul>";
                    }
                    return resultHtml;
                }
                // 员工层级汇报关系
                else if(this.userSetting.dataType == "reportRaltion"){
                    var resultHtml = "";
                    //判断参数是否为数组，如果是数组，则需要添加<ul>标签，如果是json，则使用li标签
                    if($.isArray(dataArray)){
                        resultHtml = "<ul>";
                        // 循环遍历里面的每个节点
                        for(var i = 0; i < dataArray.length; i++){
                            // 用于记录子节点
                            var subEmployeeJson = {};
                            // 如果用户没有传递这个参数，表示是第一次进来，传递的是数组,如果传递了参数，表示已经开始递归计算了
                            if(parentJson != undefined){
                                subEmployeeJson = parentJson;
                            }
                            resultHtml = resultHtml + this.getHtmlByStandardData(dataArray[i],subEmployeeJson);
                        }
                    }else{
                        // 如果
                        if(dataArray["postName"] == null || dataArray["postName"] == "" || dataArray["postName"] == undefined){
                            dataArray["postName"] = "无";
                        }
                        var resultHtml = resultHtml +  '<li' + ' data_id="' + dataArray["id"] + '" data_pid="'+  dataArray["pid"] +'" ><span><div class="name"><i class="portrait"><img src="' + dataArray["avatar"] + '"width="38"height="38"class="img-circle"> </i><i class="employeeName">' + dataArray["name"].htmlEncode() + '</i> <i class="employeeNum"></i></div><div class="orgName"><i class="orgNameWidget">' + dataArray["orgName"] + '</i> | <i class="postName">' + dataArray["postName"].htmlEncode() + '</i></div><div class="tools"><i class="setEmployeeLeader"></i><i class="tip">变更汇报对象</i></div><i class="nodeSwitch node-folded"></i></span>';
                        // 判断当前节点是否在其父节点中出现，如果是，则表示是循环汇报，则直接返回 resultHtml
                        if(parentJson[dataArray["id"]] != undefined){
                            return resultHtml + '</li>';;
                        }

                        // 缓存已经使用过的节点
                        parentJson[dataArray["id"]] = dataArray["id"];
                        // 判断是否有子节点，如果有子节点，则进行递归操作
                        if(dataArray["subEmployeeList"] != undefined && dataArray["subEmployeeList"] != "" && dataArray["subEmployeeList"] != null){
                            resultHtml = resultHtml + this.getHtmlByStandardData(dataArray["subEmployeeList"],parentJson);
                        }
                        resultHtml = resultHtml + '</li>';
                    }

                    //判断参数是否为数组，如果是数组，则需要添加<ul>标签，如果是json，则使用li标签
                    if($.isArray(dataArray)){
                        resultHtml = resultHtml + "</ul>";
                    }
                    return resultHtml;
                }


            },
            /**
             * 全部展开节点
             * */
            "expandAllNodes" : function(){
                $("#"+this.getPluginId() + " .org_tree ul li.parent_li ul li").show('fast');
                $("#"+this.getPluginId() + " .org_tree ul li.parent_li").find("i.nodeSwitch").removeClass("node-folded").addClass("node-unfolded");
            },
            /**
             * 全部收缩节点
             * */
            "foldAllNodes" : function(){
                $("#"+this.getPluginId() + " .org_tree ul li.parent_li ul li").hide('fast');
                $("#"+this.getPluginId() + " .org_tree ul li.parent_li").find("i.nodeSwitch").removeClass("node-unfolded").addClass("node-folded");
            },
            /**
             * 获取所有的节点
             * */
            "getAllNodes" : function(){
                return $("#"+this.getPluginId() + " .org_tree ul li");
            },
            /**
             * 根据ID查找节点
             * */
            "getNodeById" : function(id){
                return $("#"+this.getPluginId() + " .org_tree ul li[data_id='"+id+"']");
            },
            /**
             * 设置节点为当前选中
             * */
            "setNodeActive" : function(node){
                var currentNode = $(node);
                currentNode.addClass("selected");
                currentNode.parent().closest("li.parent_li").addClass("selected_parent");
                currentNode.children("ul").addClass("select-children");
            },
            /**
             * 设置所有的节点为不选中状态
             * */
            "setAllNodeUnactive" : function(node){
                $("#"+this.getPluginId() + " .org_tree ul li").removeClass("selected_parent").removeClass("selected");
                $("#"+this.getPluginId() + " .org_tree ul").removeClass("select-children");
                return;
            },
            /**
             * 获取插件对象的ID
             * */
            "getPluginId" : function(){
                return this.pluginId;
            },
            /**
             * 修改节点
             * */
            "updateNode" : function(node){
                alert("updateNode");
            },
            /**
             * 获取机构的HTML
             * */
            "getTreeHtml" : function(){
                // treeHtml 数据为空，需要重新生成代码
                if(this.treeHtml == ""){
                    // 判断用户是否设置了数据
                    if(this.userSetting.userData != "" && this.userSetting.userData != undefined && this.userSetting.userData != null){
                        // 如果图显示的员工的汇报关系
                        if(this.userSetting.dataType == "reportRaltion"){
                            this.treeHtml = '<div id="'+ this.getPluginId() +'"><div class="org_tree relationshopTree">'+this.getHtmlByStandardData(this.userSetting.userData)+'</div></div>';
                        }
                        // 如果图显示的是机构层级
                        else{
                            this.treeHtml = '<div id="'+ this.getPluginId() +'"><div class="org_tree">'+this.getHtmlByStandardData(this.userSetting.userData)+'</div></div>';
                        }
                    }else{
                        console.log("没有设置userSetting.userData属性");
                    }
                }else{
                    // 如果treeHtml 不为空，并且设置了重置，需要重新生成代码
                    if(this.isReset){
                        // 如果图显示的员工的汇报关系
                        if(this.userSetting.dataType == "reportRaltion"){
                            this.treeHtml = '<div id="'+ this.getPluginId() +'"><div class="org_tree relationshopTree">'+this.getHtmlByStandardData(this.userSetting.userData)+'</div></div>';
                        }
                        // 如果图显示的是机构层级
                        else{
                            this.treeHtml = '<div id="'+ this.getPluginId() +'"><div class="org_tree">'+this.getHtmlByStandardData(this.userSetting.userData)+'</div></div>';
                        }
                    }
                }
                return this.treeHtml;
            },
            /**
             * 判断节点是否有子节点，如果有，则为true，如果没有，则为false
             * @param node  Dom对象 或者是 jquery 对象
             * @returns {boolean}
             */
            "hasChildNodes" : function(node){
                if($(node).find('ul').length > 0){
                    return true;
                }else{
                    return false;
                }
            },
            /**
             * 获取重置标记
             * */
            "getResetFlag" : function(){
                return this.isReset;
            },
            /**
             * 重新设置 重置标记
             * @param flag 值为 true，表示重置，false表示不是重置
             */
            "setResetFlag" : function(flag){
                this.isReset = flag;
            },
            /**
             *  获取根节点
             * */
            "getRootNode" : function(){
                return $("#"+this.getPluginId() + " .org_tree ul li:first");
            },
            /**
             *  设置根节点标记
             * */
            "setRootMark" : function(){
                var that = this;
                var rootNodes = $("#"+this.getPluginId() + " .org_tree > ul > li");

                // 如果domTree 是汇报关系,第一个节点的提示为"变更最高级汇报人"
                if(this.userSetting.dataType == "reportRaltion"){
                    rootNodes.each(function(){
                        var currentObj = $(this);
                        // 判断当前节点是否与最高汇报人的ID一致，如果一致，则提示“变更最高级汇报人”，不一致，提示“变更汇报对象”
                        if(that.topLeader.id == currentObj.attr("data_id")){
                            currentObj.children("span").find(".tools .tip").html("变更最高级汇报人");
                            currentObj.attr("is_root","true");
                        }else{
                            currentObj.children("span").find(".tools .tip").html("变更汇报对象");
                        }
                    });
                }
            },
            /**
             *  是否是根节点
             * */
            "isRootNode" : function(node){
                if($(node).closest("li").attr("is_root") == "true"){
                    return true;
                }else{
                    return false;
                }
            },
            /**
             *  初始化之前执行的回调
             * */
            "beforeInitCallback" : function(){
                console.log("beforeInitCallback");
                if(this.userSetting.beforeInitCallback != undefined && this.userSetting.beforeInitCallback != null){
                    this.userSetting.beforeInitCallback(this);
                }
            },
            /**
             *  初始化之后执行的回调
             * */
            "afterInitCallback" : function(){
                console.log("afterIninCallback");
                if(this.userSetting.afterInitCallback != undefined && this.userSetting.afterInitCallback != null){
                    this.userSetting.afterInitCallback(this);
                }
            },
            /**
             *  获取节点的父节点
             * */
            "getParentNodeByNode" : function(node){
                var currentObj = $(node);
                var pid = currentObj.attr("data_pid");
                return this.getNodeById(pid);
            },
            /**
             *  获取节点的直属子节点
             * */
            "getSubNodeByNode" : function(node){
                var currentObj = $(node);
                return currentObj.children("ul").children("li");
            },
            /**
             *  点击节点执行的回调
             * */
            "nodeClickCallback" : function(event,dom){
                console.log("nodeClickCallback");
                this.selectedNodeId = $(dom).closest("li").attr("data_id");
                if(this.userSetting.nodeClickCallback != undefined && this.userSetting.nodeClickCallback != null){
                    this.userSetting.nodeClickCallback(event, dom, this);
                }
            },
            /**
             * 获取选中的节点ID
             */
            "getSelectedNodeId":function(){
                return this.selectedNodeId;
            },
            /**
             * 获取选中的节点
             */
            "getSelectedNode":function(){
                if(this.getSelectedNodeId() == ""){
                    return null;
                }
                return this.getNodeById(this.getSelectedNodeId());
            },
            /**
             * 设置选中节点为活跃状态
             */
            "setSelectedNodeActive":function(){
                this.setAllNodeUnactive();
                this.setNodeActive(this.getSelectedNode());
            },
            /**
             *  获取添加节点的选择器
             * */
            "getNodeAddSelector" : function(){
                if(this.nodeAddSelector == ""){
                    this.nodeAddSelector = "#" + this.getPluginId() + ' .org_tree li > span > .tools > .nodeAdd';
                }
                return this.nodeAddSelector;
            },
            /**
             *  获取修改节点的选择器
             * */
            "getNodeEditSelector" : function(){
                if(this.nodeEditSelector == ""){
                    this.nodeEditSelector = "#" + this.getPluginId() + ' .org_tree li > span > .tools > .nodeEdit';
                }
                return this.nodeEditSelector;
            },
            /**
             *  获取删除节点的选择器
             * */
            "getNodeDelSelector" : function(){
                if(this.nodeDelSelector == ""){
                    this.nodeDelSelector = "#" + this.getPluginId() + ' .org_tree li > span > .tools > .nodeDel';
                }
                return this.nodeDelSelector;
            },
            /**
             *  获取删除节点的选择器
             * */
            "getNodeChangeReporterSelector" : function(){
                if(this.nodeChangeReporterSelector == ""){
                    this.nodeChangeReporterSelector = "#" + this.getPluginId() + ' .org_tree ul li > span > .tools';
                }
                return this.nodeChangeReporterSelector;
            },
            /**
             *  添加节点的回调函数
             *  参数为dom 节点
             * */
            "nodeAddCallback" : function(event,dom){
                if(this.userSetting.nodeAddCallback != undefined && this.userSetting.nodeAddCallback != null){
                    this.userSetting.nodeAddCallback(event,dom,this);
                }
            },
            /**
             *  编辑节点的回调函数
             * */
            "nodeEditCallback" : function(event,dom){
                if(this.userSetting.nodeEditCallback != undefined && this.userSetting.nodeEditCallback != null){
                    this.userSetting.nodeEditCallback(event,dom,this);
                }
            },
            /**
             *  删除节点的回调函数
             * */
            "nodeDelCallback" : function(event,dom){
                if(this.userSetting.nodeDelCallback != undefined && this.userSetting.nodeDelCallback != null){
                    this.userSetting.nodeDelCallback(event,dom,this);
                }
            },
            /**
             *  更改汇报关系回调函数
             * */
            "changeReporterCallback" : function(event,dom){
                if(this.userSetting.changeReporterCallback != undefined && this.userSetting.changeReporterCallback != null){
                    this.userSetting.changeReporterCallback(event,dom,this);
                }
            },
            /**
             *  事件绑定
             * */
            "eventBinding" : function(){
                var that = this;
                // 如果是机构层级节点
                if(this.userSetting.dataType == "orgLevel"){
                    // 给节点的添加、修改、删除绑定事件
                    $(this.getNodeAddSelector()).on('click', function (event) {
                        //alert($(this).closest("li").attr("data_id"));
                        that.nodeAddCallback(event,this);
                        // 阻止事件冒泡
                        event.stopPropagation();
                    });

                    // 给节点的添加、修改、删除绑定事件
                    $(this.getNodeEditSelector()).on('click', function (event) {
                        //alert($(this).closest("li").attr("data_id"));
                        that.nodeEditCallback(event,this);
                        // 阻止事件冒泡
                        event.stopPropagation();
                    });

                    // 给节点的添加、修改、删除绑定事件
                    $(this.getNodeDelSelector()).on('click', function (event) {
                        //alert($(this).closest("li").attr("data_id"));
                        that.nodeDelCallback(event,this);
                        // 阻止事件冒泡
                        event.stopPropagation();
                    });
                }
                // 如果domTree 是汇报关系
                else if(this.userSetting.dataType == "reportRaltion"){
                    // 给节点的变更汇报关系节点绑定事件
                    $(this.getNodeChangeReporterSelector()).on('click', function (event) {
                        //alert($(this).closest("li").attr("data_id"));
                        that.changeReporterCallback(event,this);
                        // 阻止事件冒泡
                        event.stopPropagation();
                    });
                }

                // 给li节点的添加click事件
                $("#" + this.getPluginId() + ' .org_tree ul li>span').on('click', function (event) {
                    that.nodeClickCallback(event,this);
                    // 阻止事件冒泡 , 因为li 下面还有多个ul li 标签
                    event.stopPropagation();
                });

                // 判断所有的li标签是否有ul标签，如果有，则添加parent_li 类样式，然后添加了标题，给出了提示
                $("#" + this.getPluginId() + ' .org_tree li:has(ul)').addClass('parent_li').find(' > span');

                // 给li有parent_li 类样式下面的span标签添加 click事件，让其能够展开和收缩
                $("#" + this.getPluginId() + ' .org_tree li.parent_li > span .nodeSwitch').on('click', function (e) {
                    var currentObj = $(this);
                    // 查找li有parent_li 类样式下面 ul 下面的li 标签
                    var children = currentObj.closest('li.parent_li').find(' > ul > li');
                    // 如果节点是显示的，则让其隐藏
                    if (children.is(":visible")) {
                        currentObj.removeClass("node-unfolded").addClass("node-folded");
                        children.hide('fast');
                    }
                    // 如果节点是隐藏的，则让其显示
                    else {
                        currentObj.removeClass("node-folded").addClass("node-unfolded");
                        children.show('fast');
                    }
                    // 阻止事件冒泡
                    e.stopPropagation();
                });

                // 默认收缩所有的节点
                $("#"+this.getPluginId() + " .org_tree ul li.parent_li ul li").hide();
            },
            /**
             * 展开指定的层级,不展开为0级，即根节点
             * */
            "expandLevel" : function(levelNum){
                // 先收缩所有的节点
                this.foldAllNodes();
                // var rootNode = this.getRootNode();
                // console.dir(rootNode);
                var selector = "#"+this.getPluginId() + " .org_tree ";
                for(var i = 0; i < levelNum; i++){

                    var selector = selector + " > ul > li.parent_li";
                    // 查找当前所有含有子节点的li 标签
                    $(selector).each(function(){
                        var currentObj = $(this);
                        currentObj.children("span").children(".nodeSwitch").addClass("node-unfolded").removeClass("node-folded");
                        // 展开所有子节点的标签
                        currentObj.find(' > ul > li').each(function(){
                            $(this).show('fast');
                        });
                    });

                }
            },
            /**
             * 销毁插件，pluginObj代表插件对象本身
             * */
            "destory" : function(){
                $("#" + this.getPluginId()).remove();
                //this = null;
                //if(true){
                //    this == null;
                //}
            },
            /**
             * 定位节点
             * @param node 定位的Dom节点
             * @param isActive 这个是boolean值,true表示让定位的节点设置为active，false表示不设置
             */
            "locationNode" : function(node,isActive){
                var node = $(node);
                // 收缩所有节点
                this.foldAllNodes();
                /// 获取 节点的层级
                var nodeLevel = parseInt(node.attr("data_level"));
                recursionParentNode(node);
                if(isActive){
                    this.setNodeActive(node);
                }
            },
            /**
             * 展开节点（先定位到，然后再展开节点）
             * @param node 定位的Dom节点
             * @param isActive 这个是boolean值,true表示让展开的节点设置为active，false表示不设置
             */
            "expandNode" : function(node,isActive){
                // 先定位到节点
                this.locationNode(node,isActive);
                var node = $(node);
                node.children("ul").children("li").show('fast');
                node.children("span").children(".nodeSwitch").removeClass("node-folded").addClass("node-unfolded");
            },
            /**
             *  展开节点（先定位到，然后再展开节点）
             * */
            "foldNode" : function(node){
                var node = $(node);
                node.children("ul").children("li").each(function(){
                    $(this).hide('fast');
                });
            },
            /**
             * 重置对象
             * */
            "reset" : function(userSetting){
                $("#" + this.getPluginId()).remove();
                // 设置重置标记为true,则需要根据配置文件，从新生成HTML代码
                this.isReset = true;
                this.init(userSetting);
            }
        };

        return orgMindChart;

    })($);
    return orgDomTree;
});
