
define(["JQuery","BaseClass","ztree","config"], function($,BaseClass,ztree,config) {

    /**
     * @description 是对ztree的封装，包含直接显示树 和 模态框 树
     * @exports klwUtil
     */
    var klwUtil = inherit(BaseClass.prototype);

    // 这是一个全局变量，根据不同的数据类型，判断是否继续发送ajax请求，如果为false 表示不发送，为true 表示发送
    var IS_LOCK = {
        // 部门
        "department":true,
        // 岗位
        "job":true,
        // 职位
        "position":true,
        // 显示人员 和 部门
        "departmentEmployee":true
    };

    // 这个全局变量用于存储生成ztree的数据
    var TARGET_DATA = {
        // 部门
        "department":null,
        // 岗位
        "job":null,
        // 职位
        "position":null,
        // 显示人员 和 部门
        "departmentEmployee":null
    };

    // 发送ajax 请求还
    var PROMISE = {
        // 部门
        "department":null,
        // 岗位
        "job":null,
        // 职位
        "position":null,
        // 显示人员 和 部门
        "departmentEmployee":null
    };

    var currentToken = klwUtil.getParameter().token;

    obj2str = function(o){
        var r = [];
        if(typeof o =="string") return "\""+o.replace(/([\'\"\\])/g,"\\$1").replace(/(\n)/g,"\\n").replace(/(\r)/g,"\\r").replace(/(\t)/g,"\\t")+"\"";
        if(typeof o =="undefined") return "undefined";
        if(typeof o == "object"){
            if(o===null) return "null";
            else if(!o.sort){
                for(var i in o)
                    r.push(i+":"+obj2str(o[i]))
                r="{"+r.join()+"}"
            }else{
                for(var i =0;i<o.length;i++)
                    r.push(obj2str(o[i]))
                r="["+r.join()+"]"
            }
            return r;
        }
        return o.toString();
    };

    /**
     *  @class
     *  klwZtree 一个ztree 对象
     */
    klwUtil.klwZtree = function (userSetting){
        var that = this;
        //获取时间戳 作为 tree 的id，由于klwOrgModal对象也是用时间戳作为唯一标识的，如果两个对象的时间戳一致，则导致页面显示不正常
        var treeId = new Date().getTime()+1;

        //console.log("klwZtree treeId : " + treeId);
        // 该变量用来缓存 tree 对象
        var treeObj = null;
        // 获取数据的URL
        var URL = null;

        // 缓存对象,包含缓存的机构，缓存的员工
        var cacheFactory = {
            // 缓存所有的机构信息
            org:[],
            // 缓存所有的员工信息
            employees:[]
        };

        // 定义的一个内部工具类
        var util = {
            // 根据关键字 从指定的数组中 筛选出子数组
            arrayFilter:function(targetArray,key){
                var length = targetArray.length;
                var tempStr = "";
                var result = [];
                for(var i = 0; i < length; i++){
                    var nodeInfo = targetArray[i];
                    // 如果结果是显示人员
                    if(nodeInfo.username != undefined){
                        tempStr = nodeInfo.username;
                    }else{
                        tempStr =  nodeInfo.name;
                    }
                    //tempStr = targetArray[i].name;
                    // 判断是否有头像，如果有，就获取文本信息
                    if(tempStr.indexOf("img") > -1){
                        var tempStr = $(tempStr).filter("span")[0].innerHTML;
                    }
                    // 检查 数组中是否包含指定的关键字key
                    if(tempStr.indexOf(key) > -1){
                        result.push(targetArray[i]);
                    }
                }
                return result;
            },
            /**
             * [{
                    id: 681,
                    pId: 0,
                    name: "搜才集团"
                }]
             转为
             {
                681:{
                    id: 681,
                    pId: 0,
                    name: "搜才集团"
                }
             }
             * 将机构的数组形式转为json格式，方便做数据查询
             */
            orgArrayToJson : function(orgArray){
                // 获取数组的长度
                var orgArrayLength = orgArray.length;
                var result = {};
                for(var i = 0; i < orgArrayLength ; i++){
                    var currentObj = orgArray[i];
                    result[currentObj.id] = currentObj;
                }
                return result;
            },
            /**
             * 重置节点的内容，满足符合 ztree 显示的内容（员工显示头像，pid 指向的是机构ID）
             * @param employeeArray  接受所有员工信息，数组
             * @param rootOrgId  公司顶级部门的ID 好，如果查询出来的员工不在查询的机构中  或者  机构ID 没有任何指向，则放在一个“未知部门”想虚拟部门中
             */
            resetEmployeeNodeInfo : function(employeesArray,orgJson){
                // 缓存数组的长度
                var length = employeesArray.length;
                // 正确数据
                var correctData = [];
                // 不正确数据
                var incorrecttData = [];
                for(var i = 0; i < length; i++ ){
                    // 缓存遍历的当前对象
                    var currentObj = employeesArray[i];
                    // 机构ID 设置为Pid 的值
                    currentObj["pId"] = currentObj["orgId"]+"_org";
                    // 用户姓名存放到 username 这个属性中
                    currentObj["username"] = currentObj["name"];
                    // 节点显示的内容
                    //currentObj["name"] ='<img src="'+currentObj["avatar"]+'" style="display: inline-block;height: auto;width: 25px;border-radius: 12px;"><span style="padding-left: 7px;">'+currentObj["name"]+'</span>';
                    currentObj["name"] = klwUtil.get_head_html(currentObj["name"])+currentObj["name"];

                    // 判断员工的机构ID 是否在选中的机构中，如果在，则放入result数组中
                    if(orgJson[currentObj["pId"]] != null && orgJson[currentObj["pId"]] != undefined && orgJson[currentObj["pId"]] != ""){
                        correctData.push(currentObj);
                    }else{
                        currentObj["pId"] = currentObj["orgId"] = that.setting.virtualOrgInfo.orgId + "_org";
                        incorrecttData.push(currentObj);
                    }

                }
                return {
                    "correctData" : correctData,
                    "incorrecttData" : incorrecttData
                };
            },

            /**
             * 让节点没有 checkbox 样式
             * @param zNodes
             */
            "setNodesNocheckIsparent" : function(zNodes){
                var zNodesLength = zNodes.length;
                for(var i = 0; i < zNodesLength; i++){
                    zNodes[i]["nocheck"] = true;
                    zNodes[i]["isParent"] = true;
                }
                return zNodes;
            },
            /**
             * 设置节点是否选中
             * 设置节点是否有checkbox
             */
            // ztree 初始化完成之后执行的方法
            afterInitCallback : function(){
                var selectedNodeFilter = that.setting.selectedNodeFilter;
                // 检查用户是否配置了 允许设置选中的checkbox
                if(selectedNodeFilter != null &&selectedNodeFilter != undefined && selectedNodeFilter != ""){
                    var selectedNodeFilterLength = selectedNodeFilter.length;
                    // 遍历 用户传递过来的过滤器
                    for(var i = 0; i < selectedNodeFilterLength; i++){
                        var tempFilter = selectedNodeFilter[i];
                        var selectedNodes;
                        // 根据过滤条件查找到节点
                        for(var key in tempFilter){
                            selectedNodes = that.selectNodesByAttribute(key, tempFilter[key]);
                            var selectedNodesLength = selectedNodes.length;
                            // 对选择出来的节点设置为选中的状态
                            for(var k = 0; k < selectedNodesLength; k++){
                                var tempNode = selectedNodes[k];
                                that.setNodeChecked(tempNode);
                            }
                        }
                    }
                }
                //检查是否配置了 klwOrgModal 对象初始化回调函数 —— 设置节点是否有checkbox ,节点是否选中
                if(that.setting.initCallback != undefined && that.setting.initCallback != null && that.setting.initCallback != ""){
                    that.setting.initCallback(that);
                }
            }
        };

        //获取 treeID,即树的控件
        this.getTreeId = function(){
            return treeId;
        };

        /**
         * 获取 缓存的机构信息
         * @returns {Array}
         */
        this.getCacheOrg = function(){
            return cacheFactory.org;
        };

        /**
         * 根据数据类型返回结果集合
         * @param dataType
         * @returns {*}
         */
        this.getCacheByDataType = function(dataType){
            if(dataType == "department"){
                return cacheFactory["org"];
            }
            return cacheFactory[dataType];
        };

        /**
         *  获取已经选择的节点的路径,
         * @returns 返回一个json对象，key是选择节点的ID，value是数组，选择节点的父亲节点，回溯到顶级节点，第一个节点是顶级节点
         */
        this.getSelectedNodePath = function(){
            // 获取所有选中的节点
            var selectedNodes = that.getSelectedNodes();
            // 缓存数组的长度
            var selectedNodesLength = selectedNodes.length;
            var result = {};
            for(var i = 0; i < selectedNodesLength; i++){
                var currentNode = selectedNodes[i];
                result[currentNode.id] = currentNode.getPath();
            }
            return result;
        };
        /**
         *  获取已经选择的节点的路径,
         * @returns 返回一个json对象，key是选择节点的ID，value当前节点的字符串
         */
        this.getSelectedNodePathString = function(){
            var nodesPath = that.getSelectedNodePath();
            var result = {};
            for(key in nodesPath){
                var tempArray = [];
                var currentNodeTopNodes = nodesPath[key];
                var currentNodeTopNodesLength = nodesPath[key].length;
                for(var i = 0; i < currentNodeTopNodesLength; i++){
                    tempArray.push(currentNodeTopNodes[i]["name"]);
                }
                result[key] = tempArray;
            }
            return result;
        };

        /**
         *  获取 缓存的机构信息
         * @returns 返回的员工对象
         */
        this.getCacheEmployees = function(){
            return cacheFactory.employees;
        };

        /**
         * 根据关键字筛选缓存机构功能
         * @param key
         * @returns {*}
         */
        this.cacheOrgFilter = function(key){
            var allOrgArray = that.getCacheOrg();
            return util.arrayFilter(allOrgArray,key);
        };

        /**
         * 根据关键字筛选缓存人员功能
         * @param key
         * @returns {*}
         */
        this.cacheEmployeesFilter = function(key){
            var allEmployeesArray = that.getCacheEmployees();
            return util.arrayFilter(allEmployeesArray,key);
        };

        /**
         * 根据指定cache范围查询key
         * @param key
         * @param scope
         * @returns {*}
         */
        this.cacheFilterByScope = function(key,scope){
            var cache = cacheFactory[scope];
            return util.arrayFilter(cache,key);
        };

        /**
         * 获取tree 对象
         * @returns {*}
         */
        this.getTreeObj = function(){
            if(treeObj == null){
                treeObj = $.fn.zTree.getZTreeObj(that.getTreeId());
                return treeObj;
            }
            return treeObj;
        };

        /**
         * 返回获取数据的URL
         * @returns {string}
         */
        this.getUrl = function(){
            // 判断是否已经获取了URL,如果没有，根据参数判断，获取数据的URL
            if(URL == null){
                // 获取部门
                if(userSetting.dataType == "department"){
                    URL = "/appcenter/company/tree.json";
                }
                // 获取职位 和  岗位
                else if(userSetting.dataType == "job" || userSetting.dataType == "position"){
                    URL = "/appcenter/company/position.json";
                }
                // 获取所有人员 和 部门
                else if(userSetting.dataType == "departmentEmployee"){
                    URL = "/appcenter/company/tree.json"
                }
            }
            return URL;
        };

        /**
         * 检查是否有获取数据的URL,如果有返回true，如果没有，返回false
         * @returns {boolean}
         */
        this.hasUrl = function(){
            var url = that.getUrl();
            if(url == null){
                return false;
            }
            return true;
        };

        /**
         * 是否允许获取员工列表,true表示允许，false表示不允许
         * @returns {*}
         */
        this.isShowEmployeeList = function(){
            return that.setting.employee.isShowEmployee;
        };

        /**
         * 个性化的配置信息全部在这里做重置
         * 重置配置信息，符合ztree代码，该方法要在初始化ztree之前
         */
        this.resetSetting = function(){
            // 判断是否是单选，
            if(that.setting.isRadio){
                that.setting.check.chkStyle = "radio";
            }

            // 设置单选按钮的选择范围
            if(that.setting.radioType == "level"){
                that.setting.check.radioType  = "level";
            }else{
                that.setting.check.radioType  = "all";
            }

        };

        //默认配置信息
        var defaultSetting = {
            iconClass : ".ztree .head-img-normal,.ztree_modal .head-img-normal{border-radius:50%;color:#fff;font-size:12px;display:inline-block;text-align:center;height:30px;width:30px;line-height:30px;margin-right:8px;position:relative;cursor:pointer}.ztree li{padding:0;margin:0;list-style:none;line-height:32px;text-align:left;white-space:nowrap;outline:0}.ztree li span.button.chk.radio_false_full{background-position:-31px -11px}.ztree li span.button.chk.radio_false_full_focus{background-position:-31px -11px}.ztree li span.button.chk.radio_true_full{background-position:-9px -11px}.ztree li span.button.chk.radio_true_full_focus{background-position:-9px -11px}.ztree li span.button.chk.radio_false_part{background-position:-52px -11px}.ztree li span.button.chk.radio_false_part_focus{background-position:-52px -11px}.ztree li a:hover{text-decoration:none}.img_responsive{display:block;max-width:100%;height:auto}.ztree li span.button.chk{width:13px;height:13px;margin:0 8px 0 0;cursor:auto}.ztree li span.button.chk{width:16px;height:16px;margin:0 3px 0 0;cursor:auto}.ztree li span.button.chk.checkbox_false_full{background-position:-31px -11px}.ztree li span.button.chk.checkbox_false_full_focus{background-position:-31px -11px}.ztree li span.button.chk.checkbox_true_full{background-position:-9px -11px}.ztree li span.button.chk.checkbox_true_full_focus{background-position:-9px -11px}.ztree li span.button.noline_open{background-position:-95px -11px}.ztree li span.button.noline_close{background-position:-74px -11px}.ztree li span.button.chk.checkbox_true_part{background-position:-52px -11px}.ztree li span.button.chk.checkbox_true_part_focus{background-position:-52px -11px}.ztree li span.button.chk.checkbox_false_part{background-position:-52px -11px}.ztree li span.button.chk.checkbox_false_part_focus{background-position:-52px -11px}.ztree li a.curSelectedNode{background-color:transparent;border:none}",
            view: {
                //不显示连线
                showLine: false,
                //不显示ICON图标
                showIcon: false,
                //执行一个方法，设置字体的央视，例如粗体
                fontCss: that.getFont,
                // 取消双击展开的功能
                dblClickExpand:false,
                // 不显示title的内容
                showTitle: false,
                //允许支持HTML格式
                nameIsHTML: true
            },
            // 是否是单选，false 表示是多选，true 表示是多选
            isRadio:false,
            // 设置最多允许选择的数量
            maxValues : 999999999,
            // 设置单选按钮的范围，默认是all,表示全部节点，level表示当前树节点
            radioType:"all",
            // 用户自定义树的节点数据，如果有了，则不会发送ajax 向服务器获取数据,数组类型是数组
            treeData:"",
            check: {
                // 是否显示checkbox 作为多选框
                enable: true,
                chkStyle : "checkbox"
            },
            // 同时查询人员和机构的时候，如果人员和 机构的关系不匹配，则添加一个虚拟部门，下面是虚拟部门的配置信息
            virtualOrgInfo : {
                orgId : 99999999998,
                orgName : "未知部门"
            },
            dataFilter:{
                //1为只查询下级部门，2为查询自身以及下级部门，不传或其他值为查询全部
                //searchType : 2,
                // 部门ID，当searchType=1或2时为必填项
                //orgId : 2
            },
            //是否显示员工信息，true表示需要显示，false表示不需要显示,默认是不显示
            //获取员工相关的信息
            employee:{
                //是否显示员工信息，true表示需要显示，false表示不需要显示,默认是不显示
                isShowEmployee:false,
                pageSize:9999999
            },

            // 数据接收的方式是以简单的数据方式 —— 数组
            data: {
                simpleData: {
                    // 以简单格式的数据展示
                    enable: true
                }
            },
            callback: {
                beforeCheck: function(treeId, treeNode){
                    //如果 用户配置了 beforeCheck的回调函数
                    if(that.setting.beforeCheck != undefined && that.setting.beforeCheck != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.beforeCheck(treeId, treeNode, that);
                    }
                },
                beforeMouseDown: function(treeId, treeNode){
                    //如果点击的是文字  或者  checkbox
                    if(treeNode != null){
                        // 如果当前是选中状态
                        if(treeNode.checked){
                            // 不选中 checkbox
                            that.getTreeObj().checkNode(treeNode, false, true);
                        }else{
                            // 选中 checkbox
                            that.getTreeObj().checkNode(treeNode, true, true);
                        }
                    }

                    //如果 用户配置了 beforeCheck的回调函数
                    if(that.setting.beforeMouseDown != undefined && that.setting.beforeMouseDown != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.beforeMouseDown(treeId, treeNode, that);
                    }
                },
                beforeMouseUp: function(treeId, treeNode){
                    //如果 用户配置了 beforeCheck的回调函数
                    if(that.setting.beforeMouseUp != undefined && that.setting.beforeMouseUp != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.beforeMouseUp(treeId, treeNode, that);
                    }
                },
                beforeRightClick: function(treeId, treeNode){
                    //如果 用户配置了 beforeCheck的回调函数
                    if(that.setting.beforeRightClick != undefined && that.setting.beforeRightClick != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.beforeRightClick(treeId, treeNode, that);
                    }
                },
                onMouseDown: function(event, treeId, treeNode){
                    //如果 用户配置了 onCheck 的回调函数
                    if(that.setting.onMouseDown != undefined && that.setting.onMouseDown != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onMouseDown(event,treeId, treeNode, that);
                    }
                },
                onMouseUp: function(event, treeId, treeNode){
                    //如果 用户配置了 onCheck 的回调函数
                    if(that.setting.onMouseUp != undefined && that.setting.onMouseUp != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onMouseUp(event,treeId, treeNode, that);
                    }
                },
                onCheck: function(event, treeId, treeNode){
                    // 获取所有选中节点的数量，如果大于设置的数量，则让其点击的，变为不点击
                    var selectedNodes = that.getSelectedNodes();
                    if(that.setting.maxValues < selectedNodes.length){
                        alert("你已经超过了最大设置限制 ： " + that.setting.maxValues);
                        that.setNodeUnchecked(treeNode);
                    }

                    //如果 用户配置了 onCheck 的回调函数
                    if(that.setting.onCheck != undefined && that.setting.onCheck != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onCheck(event,treeId, treeNode, that);
                    }
                },
                onClick: function(event, treeId, treeNode){
                    //获取所有选中节点的数量，如果大于设置的数量，则让其点击的，变为不点击
                    var selectedNodes = that.getSelectedNodes();
                    if(that.setting.maxValues < selectedNodes.length){
                        alert("你已经超过了最大设置限制 ： " + that.setting.maxValues);
                        that.setNodeUnchecked(treeNode);
                    }

                    //如果 用户配置了 onClick 的回调函数
                    if(that.setting.onClick != undefined && that.setting.onClick != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onClick(event,treeId, treeNode, that);
                    }
                },
                onRightClick: function(event, treeId, treeNode){
                    //如果 用户配置了 onRightClick 的回调函数
                    if(that.setting.onRightClick != undefined && that.setting.onRightClick != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onRightClick(event,treeId, treeNode, that);
                    }
                },
                // 收缩节点触发的事件
                onCollapse: function(event, treeId, treeNode){
                    //如果 用户配置了 onRightClick 的回调函数
                    if(that.setting.onCollapse != undefined && that.setting.onCollapse != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onCollapse(event,treeId, treeNode, that);
                    }
                },
                // 展开节点触发的事件
                onExpand: function(event, treeId, treeNode){
                    //如果 用户配置了 onRightClick 的回调函数
                    if(that.setting.onExpand != undefined && that.setting.onExpand != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onExpand(event,treeId, treeNode, that);
                    }
                },
                onAsyncSuccess:function(event, treeId, treeNode, res){
                    //如果 用户配置了 onCheck 的回调函数
                    if(that.setting.onAsyncSuccess != undefined && that.setting.onAsyncSuccess != null){
                        //传递 树的ID ，选中的节点 ，插件对象
                        that.setting.onAsyncSuccess(event,treeId, treeNode, res,that);
                    }
                }
            }
        };

        /**
         * 将用户的配置信息覆盖默认配置信息
         * @type {void|*}
         */
        this.setting = $.extend(defaultSetting,userSetting);

        //this.setting.employee.isShowEmployee 是否显示员工信息，true 表示需要显示，false 表示不需要显示,默认是不显示
        if(this.setting.dataType == "department" && this.setting.employee.isShowEmployee == true){
            this.setting.async = {
                //允许使用异步方式加载数据
                enable: true,
                    url: klwUtil.getLocalhostPort() + "/appcenter/employee/list.json",
                    autoParam:["id=orgId"],
                    dataType:"json",
                    headers:{
                    token:currentToken,
                        from:'pc'
                },
                otherParam:{
                    "pageSize": 9999999
                },
                //将用户的数据转为 ztree识别的对象
                dataFilter: function(treeId, parentNode, res){
                    //是否允许获取员工信息
                    if(that.isShowEmployeeList()) {
                        if (res.code == "1") {
                            // 获取人员信息数组
                            var employeeList = res.data.list;
                            var treeObj = that.getTreeObj();
                            //treeObj.reAsyncChildNodes(nodes[0], "no_refresh");
                            if(employeeList == null || employeeList == undefined){
                                employeeList = [];
                            }
                            var length = employeeList.length;
                            var employeeNodes = [];
                            for (var i = 0; i < length; i++) {
                                var tempNode = {};
                                var subChildren = employeeList[i];
                                tempNode["id"] = subChildren.id;
                                tempNode["mobile"] = subChildren.mobile;
                                tempNode["nickname"] = subChildren.nickname;
                                tempNode["username"] = subChildren.name;
                                tempNode["avatar"] =  subChildren.avatar;
                                //tempNode["pId"] = subChildren.parentId;
                                //tempNode["name"] = "<img src='" + subChildren.avatar + "' style='display: inline-block;height: auto;width: 25px;border-radius: 12px;'/><span style='padding-left: 7px;'>" + subChildren.name + "</span>";
                                tempNode["name"] = klwUtil.get_head_html(subChildren.name)+subChildren.name;
                                // 没有子节点了
                                tempNode["isParent"] = false;
                                //判断父节点是否是选中的状态，如果是选中的状态，则，子节点应该也是选中的
                                if(parentNode.checked == true){
                                    //判断是否是单选设置，如果是不是,则全部选中，如果是，则是默认，不选中
                                    if(!that.setting.isRadio){
                                        tempNode["checked"] = true;
                                    }
                                }
                                employeeNodes.push(tempNode);
                            }
                            // 缓存员工的节点信息
                            cacheFactory.employees = cacheFactory.employees.concat(employeeNodes);
                            return employeeNodes;
                        }
                    }
                }
            };
        }

        /**
         * 数据转为 zTree 识别的格式   递归计算，返回的结果为数组
         * @param targetData ， 数据类型可能是JSON 对象，也有可能是array数组
         * @returns {Array}
         */
        this.dataFormat = function(targetData){
            //最终返回符合zTree的json数组
            var result = [];
            // 检查参数是否合理，如果不合理，就返回空对象
            if(targetData == "" || targetData == null || targetData == undefined || $.isEmptyObject(targetData)){
                return result;
            }

            //如果没有子节点,则循环遍历children数组
            if(targetData.children == undefined || targetData.children == null){
                //数组的长度
                var arrayLength = targetData.length;
                // 参数传递进来的是JSON 对象，并且没有子节点
                if(arrayLength == undefined || arrayLength == null){
                    // 缓存 父节点的信息
                    var tempObj = {};
                    tempObj["id"] = targetData.id;
                    tempObj["pId"] = targetData.parentId;
                    tempObj["name"] = targetData.name;
                    result.push(tempObj);
                }
                // 参数传递进来的是数组，然后做递归操作
                else{
                    for(var i = 0; i < arrayLength; i++){
                        //缓存子节点
                        var subChildren = targetData[i];
                        //判断子节点是否有children，如果有，则递归调用dataFormat()方法
                        if(subChildren.children != undefined){
                            result = result.concat(that.dataFormat(subChildren));
                        }else{
                            //定义一个临时对象，用来缓存节点信息
                            var tempObj = {};
                            var tempArr = [];
                            tempObj["id"] = subChildren.id;
                            tempObj["pId"] = subChildren.parentId;
                            tempObj["name"] = subChildren.name;
                            //全部都是父节点，包含子节点
                            //是否允许获取员工信息
                            if(that.isShowEmployeeList()){
                                tempObj["isParent"] = true;
                            }
                            tempArr.push(tempObj);
                            result = result.concat(tempArr);
                        }
                    }
                }
                return result;
            }
            //如果有子节点
            else{
                // 缓存 父节点的信息
                var parentObj = {};
                parentObj["id"] = targetData.id;
                parentObj["pId"] = targetData.parentId;
                parentObj["name"] = targetData.name;
                result.push(parentObj);
                result = result.concat(that.dataFormat(targetData.children));
            }
            return result;
        };

        /**
         * 将获取的机构 数据转为 zTree 识别的格式;因为 机构ID 可能与 员工ID 重复，导致机构可能挂载到员工下面，逻辑不正确   递归计算，返回的结果为数组
         * @param targetData ， 数据类型可能是JSON 对象，也有可能是array数组
         * @returns {Array}
         */
        this.dataFormatOrg = function(targetData,flag){
            //最终返回符合zTree的json数组
            var result = [];
            // 检查参数是否合理，如果不合理，就返回空对象
            if(targetData == "" || targetData == null || targetData == undefined || $.isEmptyObject(targetData)){
                return result;
            }

            //如果没有子节点,则循环遍历children数组
            if(targetData.children == undefined || targetData.children == null){
                //数组的长度
                var arrayLength = targetData.length;
                // 参数传递进来的是JSON 对象，并且没有子节点
                if(arrayLength == undefined || arrayLength == null){
                    // 缓存 父节点的信息
                    var tempObj = {};
                    tempObj["id"] = targetData.id + "_org";
                    tempObj["pId"] = targetData.parentId + "_org";
                    tempObj["name"] = targetData.name;
                    result.push(tempObj);
                }
                // 参数传递进来的是数组，然后做递归操作
                else{
                    for(var i = 0; i < arrayLength; i++){
                        //缓存子节点
                        var subChildren = targetData[i];
                        //判断子节点是否有children，如果有，则递归调用dataFormat()方法
                        if(subChildren.children != undefined){
                            // 如果是机构节点，则需要对机构节点的ID 做标识，防止用户ID 与 机构ID 重复
                            result = result.concat(that.dataFormatOrg(subChildren));
                        }else{
                            //定义一个临时对象，用来缓存节点信息
                            var tempObj = {};
                            var tempArr = [];
                            // 如果是机构节点，则需要对机构节点的ID 做标识，防止用户ID 与 机构ID 重复
                            tempObj["id"] = subChildren.id+ "_org";
                            tempObj["pId"] = subChildren.parentId+ "_org";
                            tempObj["name"] = subChildren.name;
                            //全部都是父节点，包含子节点
                            //是否允许获取员工信息
                            if(that.isShowEmployeeList()){
                                tempObj["isParent"] = true;
                            }
                            tempArr.push(tempObj);
                            result = result.concat(tempArr);
                        }
                    }
                }
                return result;
            }
            //如果有子节点
            else{
                // 缓存 父节点的信息
                var parentObj = {};
                parentObj["id"] = targetData.id + "_org";
                parentObj["pId"] = targetData.parentId + "_org";
                parentObj["name"] = targetData.name;
                result.push(parentObj);
                // 如果是机构节点，则需要对机构节点的ID 做标识，防止用户ID 与 机构ID 重复
                result = result.concat(that.dataFormatOrg(targetData.children));
            }
            return result;
        };

        /**
         * 获取用户的字体
         * @param treeId
         * @param node
         * @returns {*}
         */
        this.getFont = function (treeId, node) {
            return node.font ? node.font : {};
        };

        /**
         * 设置节点是否显示多选框，nocheck为true表示不显示，nocheck为false表示显示，
         * @param node
         * @param nocheck
         */
        this.nocheckNode = function(node,nocheck){
            node.nocheck = nocheck;
            that.getTreeObj().updateNode(node);
        };

        /**
         * 获取所有选中的节点
         * @returns {Array}
         */
        this.getSelectedNodes = function(){
            var treeObj = that.getTreeObj();
            // 获取所有选中的节点，包含状态check_Child_State为1（部分 子节点被勾选），这个需要排除
            var selectedNodes = treeObj.getCheckedNodes(true);
            var length = selectedNodes.length;
            var result = [];
            for(var i=0;i<length;i++){
                if(selectedNodes[i].check_Child_State != 1){
                    result.push(selectedNodes[i]);
                }
            }
            return result;
        };

        /**
         * 获取所有选中的结点，排除机构节点（有子节点的节点）
         * @returns {Array}
         */
        this.getSelectedNodesExceptOrgNode = function(){
            var selectedNodes =  that.getSelectedNodes();
            var length = selectedNodes.length;
            var result = [];
            for(var i=0;i<length;i++){
                if(selectedNodes[i].check_Child_State != 2){
                    result.push(selectedNodes[i]);
                }
            }
            return result;
        };

        /**
         * 获取所有没有选中的节点
         */
        this.getUnselectedNodes = function(){
            var treeObj = that.getTreeObj();
            return treeObj.getCheckedNodes(false);
        };

        /**
         * 检查用户数据是否设置了tree的数据,如果设置了，返回true,不满足，返回false
         * @returns {boolean}
         */
        this.hasUserData = function(){
            //检查用户是否输入了树形数据
            if($.isArray(that.setting.treeData)){
                return true;
            }
            return false;
        };

        /**
         * 如果查找数据的信息 ，根据参数查询节点
         * @param key
         * @param value
         * @param parentNode
         * @returns {*}
         */
        this.getNodesByParam = function(key,value,parentNode){
            if(parentNode == "" || parentNode == undefined || parentNode == null){
                parentNode = null;
            }
            return that.getTreeObj().getNodesByParam(key,value,parentNode);
        };

        /**
         * 如果查找 node 的信息，例如level
         * @param key
         * @param value
         * @returns {Array}
         */
        this.selectNodesByAttribute=function(key,value){
            var zTree = that.getTreeObj();
            // transformToArray需要被转换的 zTree 节点数据对象集合 或 某个单独节点的数据对象
            var nodes = zTree.transformToArray(zTree.getNodes());
            var result = [];
            for(var i=0;i<nodes.length;i++){
                if(nodes[i][key] == value){
                    result.push(nodes[i]);
                }
            }
            return result;
        };

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
         * 设置节点选中
         * @param node 需要操作的节点
         */
        this.setNodeChecked = function(node){
            that.getTreeObj().checkNode(node, true, true);
        };

        /**
         * 设置节点不选中
         * @param node 需要操作的节点
         */
        this.setNodeUnchecked = function(node){
            that.getTreeObj().checkNode(node, false, true);
        };

        /**
         * 设置外部容器的style样式
         * @param styleStr
         */
        this.setContainerStyle = function(styleStr){
            $("#"+that.setting.targetId).prop("style",styleStr);
        };

        /**
         * 设置外部容器的 class 样式
         * @param classStr
         */
        this.setContainerClass = function(classStr){
            $("#"+that.setting.targetId).removeClass().addClass(classStr);
        };

        /**
         *  销毁控件对象
         */
        this.destory = function(){
            var treeID = that.getTreeId();
            $.fn.zTree.destroy(treeID);
        };

        /**
         * 全部节点选中
         */
        this.selectAll = function(){
            that.getTreeObj().checkAllNodes(true);
        };

        /**
         * 全部节点不选中
         */
        this.unselectAll = function(){
            that.getTreeObj().checkAllNodes(false);
        };

        /**
         * 设置展开的层级
         * @param levelNum 层级的数字
         */
        this.expandLevel = function(levelNum){
            // 获取所有的 level 层级为 levelNum 的节点
            var nodeList = that.selectNodesByAttribute("level",levelNum);
            var length = nodeList.length;
            var treeObj = that.getTreeObj();
            for(var i = 0; i < length; i++){
                treeObj.expandNode(nodeList[i]);
            }
        };

        /**
         * 全部展开
         */
        this.expandAll = function(){
            that.getTreeObj().expandAll(true);
        };

        /**
         * 全部收缩
         */
        this.unexpandAll = function(){
            that.getTreeObj().expandAll(false);
        };

        /**
         * 获取ajax 顾虑参数
         * @returns {defaultSetting.dataFilter|{}|async.dataFilter|Function|klwZtreeDefaultSetting.dataFilter|treeObj.dataFilter|*}
         */
        this.getAjaxParam = function(){

            // 如果是 选择职位，则一定要求选择 type树形：1职位，2岗位
            if(that.setting.dataType == "job"){
                that.setting.dataFilter.type = 2;
            }
            // 如果是 选择职位，则一定要求选择 type树形：1职位，2岗位
            else if(that.setting.dataType == "position"){
                that.setting.dataFilter.type = 2;
            }

            return that.setting.dataFilter;
        };

        /**
         * 获取根节点
         * @returns {*}  返回根节点对象
         */
        this.getRootNode = function(){
            var rootId = $($("#"+that.getTreeId()+".ztree").children("li")[0]).attr("id");
            return that.getTreeObj().getNodeByTId(rootId);
        };

        /**
         * 页面初始化完成的事情
         * @returns {boolean}
         */
        function init(){
            //检查用户是否输入了数据
            if(!that.hasUrl()){
                alert("请传递数据类型参数");
                return false;
            }
            //添加style样式，默认覆盖原先的样式
            if(document.getElementById("klwZtreeStyle") == undefined){
                $("body").append('<style id="klwZtreeStyle">'+that.setting.iconClass+'</style>');
            }

            //重置配置信息
            that.resetSetting();

            //获取树的控件ID
            var treeID = that.getTreeId();

            // 如果没有设置targetId，则可以 使用 targetSelector 作为选择器
            if(that.setting.targetId == "" ||that.setting.targetId == undefined ||that.setting.targetId == null){
                if(that.setting.targetSelector != "" && that.setting.targetSelector != undefined && that.setting.targetSelector != null){
                    $(that.setting.targetSelector).html('<div id="'+treeID+'" class="ztree"></div>');
                }
            }else{
                $("#"+that.setting.targetId).html('<div id="'+treeID+'" class="ztree"></div>');
            }

            // 如果设置了容器的样式
            if(that.setting.container != null && that.setting.container != undefined){
                if(that.setting.container.style != "" && that.setting.container.style != null && that.setting.container.style != undefined){
                    that.setContainerStyle(that.setting.container.style);
                }
                if(that.setting.container.class != "" && that.setting.container.class != null && that.setting.container.class != undefined){
                    that.setContainerClass(that.setting.container.class);
                }
            }

            // 如果 treeData 存在数据，则不用发送ajax 获取数据,直接使用用户传递过来的数据，该数据的格式应该是简单的ztree格式
            if(that.hasUserData()){
                // 如果没有设置targetId，则可以 使用 targetSelector 作为选择器
                $.fn.zTree.init($("#" + treeID), that.setting, that.setting.treeData);
                //检查是否配置了初始化回调函数
                if(that.setting.initCallback != undefined && that.setting.initCallback != null && that.setting.initCallback != ""){
                    that.setting.initCallback(that);
                }
            }else{
                // 检查是否已经发送了ajax请求
                // 如果没有发送请求，则 允许发送ajax请求，并且修改IS_LOCK[that.setting.dataType]为false
                if(IS_LOCK[that.setting.dataType]){
                    // 标记 以后不能再次发送请求了
                    IS_LOCK[that.setting.dataType] = false;

                    //在函数内部，新建一个Deferred对象
                    var dtd = $.Deferred();

                    klwUtil._ajax({
                        url: that.getUrl(),
                        token: currentToken,
                        data: that.getAjaxParam(),
                        success: function(res){
                            //后面的res.data是万鹏加的，因为资产中报错过一次找不到id，因为data为null了，所以这里还是需要健壮一点
                            if(res.code == "1" && res.data){
                                // 最高部门的ID号
                                var rootOrgId = res.data.id;
                                //将接口的数据做转换，符合ztree的要求
                                // 如果获取的是机构信息，防止机构ID 与 用户ID 一致，导致树形结构混乱，则对机构ID从新设置
                                if(this.url = "/appcenter/company/tree.json" && that.setting.dataType =="departmentEmployee"){
                                    var zNodes = that.dataFormatOrg(res.data);
                                }else{
                                    var zNodes = that.dataFormat(res.data);
                                }
                                //console.log(obj2str(zNodes));
                                // 将机构的数组全部转为json对象，用于后面判断 员工的机构号是否存在于查询的机构列表中
                                var orgJson = util.orgArrayToJson(zNodes);
                                // 如果 dataType : 'departmentEmployee',  获取部门 和 人
                                if(that.setting.dataType =="departmentEmployee"){
                                    //　发送请求获取公司的所有员工信息
                                    klwUtil._ajax({
                                        url: "/appcenter/org/getPendingEmployeeList.json",
                                        token: currentToken,
                                        // 参数不能少，否则查询的是默认分页的数据
                                        data:{
                                            orgId:"",//部门 ID
                                            names:"",
                                            pageSize:999999
                                        },
                                        success: function(res){
                                            if(res.code == "1"){
                                                // 缓存机构的数据
                                                cacheFactory[that.setting.dataType+"Org"] = zNodes;

                                                // 让机构节点没有checkbox
                                                zNodes = util.setNodesNocheckIsparent(zNodes);
                                                //重置节点的内容，满足符合 ztree 显示的内容（员工显示头像，pid 指向的是机构ID）
                                                var usersJson = util.resetEmployeeNodeInfo(res.data.list,orgJson);
                                                // 用户存在该机构的数据
                                                var userLists = usersJson.correctData;
                                                // 用户的机构ID号在查询的机构中不存在的员工，数据结构是数组
                                                var incorrecttData = usersJson.incorrecttData;
                                                //console.log(obj2str(userLists));
                                                //console.log(obj2str(usersJson.incorrecttData));
                                                // 如果数组大于0，表示 存在员工的部门ID 在查询部门的列表中没有找到，即这些员工是没有部门归属的
                                                if(incorrecttData.length > 0){
                                                    var tempOrgData = {
                                                        // 这个表示未知部门的ID
                                                        id: that.setting.virtualOrgInfo.orgId + "_org",
                                                        // 虚拟部门挂载到 最高部门下面
                                                        pId: rootOrgId + "_org",
                                                        // 让机构节点没有checkbox 标签
                                                        "isParent": true,
                                                        "nocheck": true,
                                                        // 虚拟部门的名称
                                                        name: that.setting.virtualOrgInfo.orgName
                                                    };
                                                    zNodes = zNodes.concat(tempOrgData);
                                                    zNodes = zNodes.concat(incorrecttData);
                                                }
                                                zNodes = zNodes.concat(userLists);
                                                // 缓存所有的用户
                                                cacheFactory[that.setting.dataType] = userLists;

                                                //console.dir(zNodes);
                                                $.fn.zTree.init($("#" + treeID), that.setting, zNodes);
                                                // 初始化完成之后的回调函数
                                                util.afterInitCallback();
                                                // 记录生成zTree的数据
                                                TARGET_DATA[that.setting.dataType] = zNodes;

                                                // 改变Deferred对象的执行状态
                                                dtd.resolve(zNodes);
                                            }
                                        }
                                    });
                                }else{
                                    // 如果没有设置targetId，则可以 使用 targetSelector 作为选择器
                                    $.fn.zTree.init($("#" + treeID), that.setting, zNodes);
                                    // 将机构的节点数据缓存起来
                                    if(that.setting.dataType == "department"){
                                        cacheFactory.org = zNodes;
                                    }
                                    // 将非机构的信息缓存起来
                                    else{
                                        cacheFactory[that.setting.dataType] = zNodes;
                                    }
                                    // 初始化完成之后的回调函数
                                    util.afterInitCallback();
                                    // 记录生成zTree的数据
                                    TARGET_DATA[that.setting.dataType] = zNodes;
                                    // 改变Deferred对象的执行状态
                                    dtd.resolve(zNodes);
                                }
                            }
                        }
                    });

                    PROMISE[that.setting.dataType] = dtd.promise();
                }else{
                    // 检查是否已经从服务器中获取了数据，如果没有，则注册到第一个的回调函数中
                    if(TARGET_DATA[that.setting.dataType] == null ){
                        // 如果给promise 设置了值，则处理逻辑
                        if( PROMISE[that.setting.dataType] != null){
                            PROMISE[that.setting.dataType].then(function(zNodes){
                                $.fn.zTree.init($("#" + treeID), that.setting, zNodes);
                                // 初始化完成之后的回调函数
                                util.afterInitCallback();
                            });
                        }
                    }else{
                        // 记录生成zTree的数据
                        var zNodes = TARGET_DATA[that.setting.dataType];
                        $.fn.zTree.init($("#" + treeID), that.setting, zNodes);
                        // 初始化完成之后的回调函数
                        util.afterInitCallback();
                    }
                }
            }
        }
        init();
    };

    /**
     *  @class
     *  klwOrgModal ztree 模态框
     */
    klwUtil.klwOrgModal = function(userSetting){

        var that = this;

        // 缓存初始化的模板HTML代码
        var modalHtml= "";
        // 获取创建改对象的时间戳，作为该对象的唯一标识
        var pulginId = new Date().getTime();

        //console.log("klwOrgModal pulginId : " + pulginId);

        // 缓存用户获取数据的url
        var url = "";
        // 获取树容器的选择器String
        var treeSelector = "";
        // 如果modalType是both,则是选中tree节点的 容器选择器
        var treeSelectedSelector = "";
        // 缓存树的机构对象
        var klwZtree;
        // 取消按钮的选择器
        var btnCancelSelector = "";
        // 关闭按钮的选择器
        var btnCloseSelector = "";
        // 确定按钮的选择器
        var btnOkSelector = "";
        // 搜索的选择器
        var btnSearchSelector = "";
        // 选中的节点数组
        var selectedNodes=[];

        //检查参数
        userSetting = userSetting || {};

        // 缓存获取的数据
        var cacheFactory = {};
        // 模态框机构树需要的CSS
        var modalCssStr = '.ztree_modal .guanbi_icon{display:none;}.ztree_modal .right_selected_node:hover .guanbi_icon{display:block;} .ztree_modal .modal-body{background-color:#f2f4f5}.ztree .head-img-normal,.ztree_modal .head-img-normal{border-radius:50%;color:#fff;font-size:12px;display:inline-block;text-align:center;height:30px;width:30px;line-height:30px;margin-right:8px;position:relative;cursor:pointer}.ztree_modal .contact__chat__list .message,.ztree_modal .contact__chat__list .title{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.ztree_modal .contact_ceter_container{height:100%;overflow:auto;position:absolute;left:0;width:100%;top:0;padding-top:70px}.ztree_modal .contact__list{position:relative;float:left;border-top:1px solid #ddd;border-right:1px solid #ddd;width:220px;height:100%;background-color:#fff}.ztree_modal .contact__search{position:absolute;width:100%;z-index:2;border-bottom:1px solid #ddd;height:54px;background-color:#FFF}.ztree_modal .contact__search__key{margin-top:13px;margin-left:13px;padding-left:28px;border-radius:4px;width:170px;background-color:#F5F5F5;border:1px solid #EEE;color:#B5B8BA;letter-spacing:1px;height:24px}.ztree_modal .contact__search__icon{position:absolute;left:14px;top:14px;font-size:20px;width:25px;height:25px;color:#AAB4BA}.ztree_modal .contact__creat__btn,.ztree_modal .forward__create__btn{color:#8E9BA4;font-size:20px;cursor:pointer}.ztree_modal .contact__creat__btn{position:absolute;right:6px;top:14px}.ztree_modal .contact__content{position:relative}.ztree_modal .forward__create__btn{float:left;margin-left:10px}.im_left_searchIcon,.ztree_modal .contact__search .contact__search__icon.hroa-close{left:165px;cursor:pointer;display:none}.ztree_modal .contact__search .contact__search__icon.hroa-close:hover{color:#8D969C}.ztree_modal .im_left_searchIcon{top:16px}.ztree_modal .searchboxIcon{top:15px;left:500px;display:none;cursor:pointer}.ztree_modal .contact__creat__btn:hover{color:#24BD48}.ztree_modal .contact__chats{width:auto;overflow-y:auto;padding:0}.ztree_modal .contact__chat__list{padding:0;list-style-type:none}.ztree_modal .contact__chat__list li{margin-bottom:1px;padding:8px 13px}.ztree_modal .contact__chat__list li:hover{cursor:pointer}.ztree_modal .contact__chat__list li.active{background-color:#f5f5f5}.ztree_modal .contact__chat__list .avatar{float:left;margin-right:8px;padding-top:3px}.ztree_modal .contact__chat__list .avatar img{border-radius:20px;width:38px;height:38px}.ztree_modal .contact__chat__list .righ{float:right;max-width:50px;text-align:right;overflow:hidden}.ztree_modal .contact__chat__list .time{font-size:10px;color:#c0bebf}.ztree_modal .contact__chat__list .unread{display:inline-block;padding:0 6px;border-radius:10px;font-size:11px;line-height:18px;color:#fff;background-color:#f25a5a}.ztree_modal .contact__chat__list .title{font-size:14px;line-height:24px}.ztree_modal .contact__chat__list .message{font-size:12px;line-height:18px;color:#767674}.ztree_modal .contact__content{border-top:1px solid #ddd;border-right:1px solid #ddd;background-color:#F2F4F5;-webkit-overflow-scrolling:auto}.ztree_modal .contact__loading{height:20px;margin-left:25px;display:block}.ztree_modal .contact__content{height:100%;overflow-y:auto;background:#F2F4F5;text-align:center}.ztree_modal .contact__content__bglogo{top:50%;left:50%;position:absolute;margin-left:-106px;margin-top:-41px}.ztree_modal .contact_im_left,.ztree_modal .contact_im_right{height:300px;overflow:auto;background:#fff;border:1px solid #E1E1E1}.ztree_modal .contact_im_container{margin-left:0;margin-right:0}.ztree_modal .contact_im_left_title,.ztree_modal .contact_im_right_title{line-height:30px}.ztree_modal .contact_im_center,.ztree_modal .contact_im_center_title{width:2.333333333%!important;padding:0}.contact_im_right,.contact_im_right_title{width:38.33333333%!important;color:#acacad}.ztree_modal .contact_im_left .org-root{margin-left:0}.ztree_modal .modal-header{padding:10px 15px}.ztree_modal .modal-body{padding:0 15px 15px 0}.ztree_modal .modal-footer{padding:10px;border-top:1px solid #e5e5e5}.ztree_modal .modal-footer .btn+.btn{margin-left:5px;margin-bottom:0}.ztree_modal .modal-footer .btn-group .btn+.btn{margin-left:-1px}.ztree_modal .modal-footer .btn-block+.btn-block{margin-left:0}.ztree_modal .btn_ok{color:#fff;background-color:#24BD48}.ztree_modal .btn_ok:hover{color:#fff;background-color:#24BD48;border-color:#24BD48}.ztree_modal .btn_ok{display:inline-block;margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;touch-action:manipulation;cursor:pointer;border:1px solid transparent;white-space:nowrap;padding:6px 32px;font-size:14px;line-height:1.42857143;border-radius:4px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.ztree_modal .btn-default{color:#333;background-color:#fff;border-color:#E1E1E1}.ztree_modal .modal-footer{text-align:center}.ztree_modal .btn:nth-of-type(1){margin-right:20px}.ztree_modal .modal-serchBox{background:#f2f4f5;border-bottom:1px solid #E1E1E1}.ztree_modal .modal-serchBox input{width:80%;margin:10px 0 10px 10%;border-radius:6px;text-align:center;height:30px;background:#fafafc}.ztree_modal .serchBox{border:none;outline:0}.ztree_modal .ztree li span{line-height:32px}.ztree_modal .ztree li a{vertical-align:baseline}.ztree_modal .ztree li span.button{vertical-align:middle}.ztree_modal .orgModalBothSelectedWidget ul{list-style:none;padding-left:0}.ztree_modal .orgModalBothSelectedWidget ul li{line-height:35px}.ztree_modal .btn_cancel{padding:6px 32px}';
        // 只显示机构界面的 HTML
        var orgModalSingleHtml = '<div class="modal fade in" tabindex=-1 role=dialog aria-labelledby=myModalLabel style="display: block;"><div class=modal-dialog role=document><div class=modal-content><div class=modal-header><button type=button class="close btn_close" data-dismiss=modal aria-label=Close><span aria-hidden=true>×</span></button><h4 class="modal-title modalTitle">创建对话</h4></div><div class=modal-body><div class=modal-serchBox><input type=text placeholder="搜索" class="serchBox this_serchBox"><span class="contact__search__icon hroa hroa-close searchboxIcon" style="display: none;"></span></div><div style="padding:0px 6px 0px 13px;background:#f2f4f5" data-contactindex=12><div class="contact_im_container contact_im_container_more row"><div class="contact_im_left_title col-sm-7 treeTitle">组织架构</div><div class="contact_im_center_title col-sm-1">&nbsp;</div><div class="contact_im_left col-sm-12 orgModalSingleWidget"></div><div class="contact_im_left col-sm-12 orgModalSingleWidgetFilter ztree" style="display: none"><ul style="list-style: none;padding-left: 0;margin-left: 0;"></ul></div></div></div></div><div class=modal-footer><button type=button class="btn btn-primary im_sure_create btn_ok">确定</button><button type=button class="btn btn-default btn_cancel" data-dismiss=modal>取消</button></div></div></div></div>';
        // 显示机构界面 和 选中机构的 HTML
        var orgModalBothHtml = '<div class="modal fade in" tabindex=-1 role=dialog aria-labelledby=myModalLabel style="display: block;"><div class=modal-dialog role=document><div class=modal-content><div class=modal-header><button type=button class="close btn_close" data-dismiss=modal aria-label=Close><span aria-hidden=true>×</span></button><h4 class="modal-title modalTitle">创建对话</h4></div><div class=modal-body><div class=modal-serchBox><input type=text placeholder="搜索" class="serchBox this_serchBox"><span class="contact__search__icon hroa hroa-close searchboxIcon" style="display: none;"></span></div><div style="padding:0px 6px 0px 13px;background:#f2f4f5" data-contactindex=12><div class="contact_im_container contact_im_container_more row"><div class="contact_im_left_title col-sm-7 treeTitle">组织架构</div><div class="contact_im_center_title col-sm-1">&nbsp;</div><div class="contact_im_right_title col-sm-4">已选<span class=selectedNumber>0</span><span class=unitString>人</span></div><div class="contact_im_left col-sm-7 orgModalBothWidget"></div><div class="contact_im_left col-sm-7 orgModalBothWidgetFilter ztree" style="display: none"><ul style="list-style: none;padding-left: 0;margin-left: 0;"></ul></div><div class="contact_im_center col-sm-1">&nbsp;</div><div class="contact_im_right col-sm-4"><div class="contact_im_right_contont orgModalBothSelectedWidget "><ul></ul></div></div></div></div></div><div class=modal-footer><button type=button class="btn btn-primary im_sure_create btn_ok">确定</button><button type=button class="btn btn-default btn_cancel" data-dismiss=modal>取消</button></div></div></div></div>';

        //添加样式
        if(document.getElementById("orgModalTreeStyle") == undefined){
            $("body").append('<style id="orgModalTreeStyle">'+modalCssStr+'</style>');
        }

        //默认配置信息
        var defaultSetting = {
            // 弹出层的字符串设定
            modalString:{
                //// 弹出层的标题
                //modalTitle : "创建对话框",
                //// 组织树的标题
                //treeTitle : "组织架构",
                //// 选中的节点单位
                //unitString : "人"
            },
            // 1.部门/异步加载员工："department"，2.岗位："job" 3、职位："position" 4、departmentEmployee(部门 + 人)
            dataType:"department",
            // 对话框类型，both —— 显示左右两边两个窗口，single —— 只显示一个窗口
            modalType : "both",
            // org 表示是选择机构，employee 表示是员工，如果是员工就需要异步加载数据，如果是机构，可以一次性获取,默认是选择org机构
            targetResult : "org",
            // 选中节点的数据
            selectedNodeQueryArray:[],
            // 设置最多允许选择的 999999999 数量
            maxValues : 999999999,
            // 确定按钮是否关闭窗口，true 表示关闭，false 表示不关闭，默认是true
            btnOkCloseModal : true,
            //是否是单选，false表示是多选，true表示是单选
            isRadio:false
        };

        /**
         * klwOrgModal 对象的配置信息
         * @type {void|*}
         */
        this.setting = $.extend(defaultSetting,userSetting);

        /**
         * 获取组件的id,为时间戳，作为唯一标识
         * @returns {number}
         */
        this.getPluginid = function(){
            return pulginId;
        };

        /**
         * 获取klwZtree对象，这个不是ztree对象
         * @returns {*}  返回klwZtree 对象
         */
        this.getKlwZtreeObj = function(){
            return klwZtree;
        };

        /**
         * 获取ztree对象， 这个不是klwZtree 对象，需要区分
         * @returns {null} 如果有返回ztree对象，如果没有，则返回null
         */
        this.getZtreeObj = function(){
            var tempObj = that.getKlwZtreeObj();
            if(tempObj == null || tempObj == undefined || tempObj == ""){
                return null;
            }else{
                return tempObj.getTreeObj();
            }
        };

        /**
         * 根据id获取ztree对象
         * @param treeid
         * @returns {*} 返回ztree 对象
         */
        this.getZtreeObjById = function(treeid){
            return $.fn.zTree.getZTreeObj(treeid);
        };

        /**
         * 获取选中节点的数量
         * @returns {number}  返回选中节点的数量
         */
        this.getSelectedNodesNumber = function(){
            var klwZtreeObj = that.getKlwZtreeObj();
            return klwZtreeObj.getSelectedNodes().length;
        };

        /**
         * 获取 klwOrgModal 上下文对象
         */
        var pluginContext = null;
        this.getPluginDomContext = function(){
            if(pluginContext == null){
                pluginContext = $("#" + that.getPluginid());
            }
            return pluginContext
        };

        /**
         * 显示选中的节点数字
         */
        this.showSelectedNumber = function(){
            var context = that.getPluginDomContext();
            var selectedNumber = 0;
            // 如果是左右两个面板
            if(that.setting.modalType == "both"){
                selectedNumber =$(that.getSelectedWidget()).find("ul li").length;
            }else{
                selectedNumber = that.getSelectedNodesNumber();
            }
            context.find("span.selectedNumber").html(selectedNumber);
        };

        /**
         * 获取当前对象的缓存数据
         */
        this.getCacheData = function(){
            //return that.getKlwZtreeObj().getCacheByDataType(that.setting.dataType);
            return TARGET_DATA[that.setting.dataType];
        };

        var klwZtreeDefaultSetting = {
            // 树存放的位置
            targetSelector: "",
            // 数据类型 department（部门） departmentEmployee(部门 + 人)
            dataType : 'department',
            // 是否是单选，false表示是多选，true表示是多选
            isRadio: that.setting.isRadio,
            // 机构的筛选条件
            dataFilter:{
                //searchType : 2,
                //orgId: 803
            },
            //获取员工相关的信息
            employee:{
                //是否显示员工信息，true表示需要显示，false表示不需要显示,默认是不显示
                isShowEmployee:true
            },
            // 收缩节点触发的事件
            onCollapse: function(event, treeId, treeNode, klwZtree){
                //如果 用户配置了 onRightClick 的回调函数
                if(that.setting.collapseFun != undefined && that.setting.collapseFun != null){
                    //传递 树的ID ，选中的节点 ，插件对象
                    that.setting.collapseFun(event,treeId, treeNode, klwZtree,that);
                }
            },
            // 展开节点触发的事件
            onExpand: function(event, treeId, treeNode, klwZtree){
                // 如果窗口是both类型，则展开列表，需要对展开的列表进行判断是否选中的操作
                if(that.setting.modalType == "both"){
                    // 获取右侧选中的节点
                    var selectedJson = {};
                    $(that.getTreeSelectedSelector()).find("li").each(function(){
                        var currentObj = $(this);
                        selectedJson[currentObj.attr("data_value")] = {
                            "id":currentObj.attr("data_value"),
                            "pId":currentObj.attr("parent_data_value"),
                            "name":currentObj.html()
                        };
                    });
                    // 判断是否有选中的结果，如果有，则进行比对
                    if(!$.isEmptyObject(selectedJson)){
                        // 让展开节点的直属子节点选中
                        var $childrenUl = $("#" + treeNode.tId).children("ul");
                        // 如果有Ul标签，则遍历下面的Li标签
                        if($childrenUl.length > 0){
                            // 获取该机构节点下面的所有子节点
                            var subNodes = that.selectNodesByAttribute("pId",treeNode.id);
                            for(var i = 0;i<subNodes.length;i++){
                                if(selectedJson[subNodes[i].id] != undefined && selectedJson[subNodes[i].id] != null){
                                    that.setNodeChecked(subNodes[i]);
                                }
                            }
                        }
                    }
                }
                //如果 用户配置了 onRightClick 的回调函数
                if(that.setting.expandFun != undefined && that.setting.expandFun != null){
                    //传递 树的ID ，选中的节点 ，插件对象
                    that.setting.expandFun(event,treeId, treeNode, klwZtree,that);
                }
            },
            // 点击checkbox 的回调函数
            onCheck: function(event,treeId, treeNode, pluginObj){
                // 如果弹出层modalType : "both",则需要执行下面的方法，让右边的内容随着左边的选中展现 或者消失
                if(that.setting.modalType == "both"){
                    //如果点击的是文字  或者  checkbox
                    if(treeNode != null){
                        var treeSelectedSelector = that.getTreeSelectedSelector();
                        // 如果当前是选中状态
                        if(treeNode.checked){

                            // 表示是filterTree 触发的事件，
                            // this 代表的是当前的setting 对象
                            if(this.filterTree == true){
                                var nodes = that.selectNodesByAttribute("id",treeNode.id);
                                for(var i = 0; i < nodes.length;i++){
                                    that.setNodeChecked(nodes[i]);
                                }
                            }

                            // 如果是单选框,清除 之前选中的内容
                            if(that.setting.isRadio){
                                $(treeSelectedSelector + " ul").html("");
                            }

                            // 检查 选中的节点是否之前已经选中（即选中的内容在选择框中已经存在）
                            if($(that.getSelectedWidget()).find("li[data_value="+treeNode.id+"]").length < 1){
                                // 将选中的机构或者 个人，从右边移除
                                $(treeSelectedSelector + " ul").append("<li class='right_selected_node' style='position: relative;cursor:pointer;' id='"+treeNode.tId+"_right_li' data_value='"+treeNode.id+"' parent_data_value='"+treeNode.pId+"'>"+treeNode.name+"<span class='guanbi_icon' style=\"position:absolute;right: 0;top:10px\"><img src=\"../../images/common/icon－guanbi.svg\"></span></li>")

                                var nodeObj = $("#"+treeNode.tId+'_right_li');
                                nodeObj.data("node",treeNode);
                                // 给右侧选中的节点 绑定事件
                                nodeObj.on("click",function(){
                                    var currentObj = $(this);
                                    var treeid = currentObj.attr("id").split("_")[0];
                                    currentObj.remove();
                                    // 不勾选树形的节点
                                    that.getZtreeObjById(treeid).checkNode(treeNode, false, false);
                                    that.showSelectedNumber();
                                });


                            }

                        }else{
                            // 不选中 checkbox
                            // 将选中的机构或者 个人，添加到右边
                            $(that.getSelectedWidget()).find("li[data_value="+treeNode.id+"]").remove();

                            // 表示是filterTree 触发的事件，会让原来的树的节点不选中
                            if(this.filterTree == true){
                                var nodes = that.selectNodesByAttribute("id",treeNode.id);
                                for(var i = 0; i < nodes.length;i++){
                                    that.setNodeUnchecked(nodes[i]);
                                }
                            }

                        }

                    }
                    that.showSelectedNumber();
                }

                if(that.setting.checkFun != undefined){
                    that.setting.checkFun(treeId, treeNode, pluginObj);
                }
            },
            onClick: function(event,treeId, treeNode, pluginObj){
                this.onCheck(event,treeId, treeNode, pluginObj);
                /*
                // 如果弹出层modalType : "both",则需要执行下面的方法，让右边的内容随着左边的选中展现 或者消失
                if(that.setting.modalType == "both"){
                    //如果点击的是文字  或者  checkbox
                    if(treeNode != null){
                        var treeSelectedSelector = that.getTreeSelectedSelector();
                        // 如果当前是选中状态
                        if(treeNode.checked){
                            // 如果是单选框,清除 之前选中的内容
                            if(that.setting.isRadio){
                                $(treeSelectedSelector + " ul").html("");
                            }
                            // 将选中的机构或者 个人，从右边移除
                            $(treeSelectedSelector + " ul").append("<li id='"+treeNode.tId+"_right_li'  data_value='"+treeNode.id+"' parent_data_value='"+treeNode.pId+"'>"+treeNode.name+"</li>");
                            // 给右侧选中的节点 绑定事件
                            $("#"+treeNode.tId+'_right_li').on("click",function(){
                                var currentObj = $(this);
                                var treeid = currentObj.attr("id").split("_")[0];
                                currentObj.remove();
                                // 不勾选树形的节点
                                //that.getZtreeObj().checkNode(treeNode, false, false);
                                that.getZtreeObjById(treeid).checkNode(treeNode, false, false);
                            });

                        }else{
                            // 不选中 checkbox
                            // 将选中的机构或者 个人，添加到右边
                            $("#"+treeNode.tId+'_right_li').remove();
                        }
                    }
                    that.showSelectedNumber();
                }

                if(that.setting.fontClickFun != undefined){
                    that.setting.fontClickFun(treeId, treeNode, pluginObj);
                }
                */

            },
            //// 选中前的回调函数
            //beforeCheck: function(treeId, treeNode,pluginObj){
            //    console.log("beforeCheck");
            //    //pluginObj.destory();
            //},
            // 生产插件之后执行的回调函数
            initCallback:function(pluginObj){
                //console.log("initCallback111");
                // 如果是选择人员，则机构的多选框则不显示
                if(that.setting.targetResult != "org" && that.setting.dataType != "departmentEmployee"){
                    that.setAllNodeNocheck();
                }

                if(that.setting.initFun != undefined){
                    that.setting.initFun(that,pluginObj);
                }
            }
        };

        /**
         * 让所有的节点全部不能选择
         */
        this.setAllNodeNocheck = function(){
            var zTreeObj = that.getZtreeObj();
            // transformToArray需要被转换的 zTree 节点数据对象集合 或 某个单独节点的数据对象
            var nodes = zTreeObj.transformToArray(zTreeObj.getNodes());
            var length = nodes.length;
            for(var i = 0; i<length; i++){
                nodes[i].nocheck = true;
                zTreeObj.updateNode( nodes[i]);
            }
        };

        /**
         * 根据当前的配置信息，获取klwZtree的配置信息
         * @returns {void|*} 返回配置信息 json 对象
         */
        this.getKlwZtreeSetting = function(){
            var userSetting = {};
            // 获取ztree对象的选择器
            userSetting["targetSelector"] = that.getTreeSelector();
            // 数据类型
            userSetting["dataType"] = that.setting.dataType;
            // 设置最多允许选择的 数量
            userSetting["maxValues"] = that.setting.maxValues;

            // 用户自定义数据
            if(that.setting.treeData != null && that.setting.treeData != undefined && that.setting.treeData != ""){
                userSetting["treeData"] = that.setting.treeData;
            }

            // 获取数据的筛选条件
            if(that.setting.dataFilter != null && that.setting.dataFilter != undefined && that.setting.dataFilter != ""){
                userSetting["dataFilter"] = that.setting.dataFilter;
            }

            // 如果是选择机构
            if(that.setting.targetResult == "org"){
                userSetting["employee"] ={
                    //是否显示员工信息，true表示需要显示，false表示不需要显示,默认是不显示
                    isShowEmployee:false,
                    pageSize:9999999
                };
            }
            //如果选择的是employee 员工
            else if(that.setting.targetResult == "employee"){
                userSetting["employee"] ={
                    //是否显示员工信息，true表示需要显示，false表示不需要显示,默认是不显示
                    isShowEmployee:true,
                    pageSize:9999999
                };
            }

            // 定义拦截器对象
            var interceptorSetting = {};
            var defaultInitCallback = klwZtreeDefaultSetting.initCallback;
            // 初始化完成之后执行的方法
            interceptorSetting["initCallback"] = function(pluginObj){
                // 设置节点被选中
                that.showInitSelectedNodes();
                defaultInitCallback();
            };
            var resultSetting = $.extend(klwZtreeDefaultSetting,userSetting,interceptorSetting);
            //console.log(obj2str(resultSetting));

            return resultSetting;
        };

        /**
         * 根据配置参数 获取ztree 模态框的HTML代码
         * @returns {string} 返回html代码字符串
         */
        this.getModalHtml = function(){
            if(modalHtml == ""){
                if(that.setting.modalType == "both"){
                    modalHtml = orgModalBothHtml;
                }else{
                    modalHtml = orgModalSingleHtml;
                }
                var pulginId = that.getPluginid();
                modalHtml = '<div id="'+pulginId+'" class="ztree_modal" style="display:none">'+modalHtml+'</div>';
            }
            return modalHtml;
        };

        /**
         *  隐藏当前对象的ztree模态框
         */
        this.hide = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).css("display","none");
        };

        /**
         * 显示当前对象的ztree模态框
         */
        this.show = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).css("display","block");
        };

        /**
         * 销毁对象
         */
        this.destory = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).remove();
            // 将对象的句柄指null,让垃圾回收
            that = null;
        };

        /**
         * 根据dataType来获取URL
         * @returns {string} 返回一个URL
         */
        this.getDataUrl = function(){
            if(url == ""){
                if(that.setting.dataType == "department"){
                    url = '/appcenter/company/tree.json';
                }
            }
            return url;
        };

        /**
         * 获取树所在的选择器 jquery 选择器字符串
         * @returns {string}
         */
        this.getTreeSelector = function(){
            if(treeSelector == ""){
                treeSelector = "#" + that.getPluginid();
                // 如果是左右两边 选择 效果
                if(that.setting.modalType == "both"){
                    treeSelector = treeSelector + " .orgModalBothWidget"
                    //selector = selector + " .orgModalBothSelectedWidget"
                }
                // 是一个弹出效果
                else{
                    treeSelector = treeSelector + " .orgModalSingleWidget"
                }
            }
            return treeSelector;
        };

        /**
         * 获取 选中节点的控件 jquery 选择器字符串
         * @returns {string}
         */
        this.getTreeSelectedSelector = function(){
            if(treeSelectedSelector == ""){
                treeSelectedSelector = "#" + that.getPluginid();
                // 如果是左右两边 选择 效果
                if(that.setting.modalType == "both"){
                    treeSelectedSelector = treeSelectedSelector + " .orgModalBothSelectedWidget"
                }
            }
            return treeSelectedSelector;
        };

        /**
         * 获取机构缓存数据
         * @returns {Array}
         */
        this.getCacheOrgArray = function(){
            return that.getKlwZtreeObj().getCacheOrg()
        };

        /**
         * 获取员工缓存数据
         * @returns {*} 返回的员工对象
         */
        this.getCacheEmployeeArray = function(){
            return that.getKlwZtreeObj().getCacheEmployees()
        };

        /**
         * 根据查询条件查找节点
         * @param key 节点属性的名字
         * @param value  节点属性的值
         * @returns {Array} ，返回节点数组
         */
        this.selectNodesByAttribute = function(key,value){
            return that.getKlwZtreeObj().selectNodesByAttribute(key,value);
        };

        /**
         * 设置节点被选中
         * @param node
         */
        this.setNodeChecked = function(node){
            that.getKlwZtreeObj().setNodeChecked(node);
        };

        /**
         * 设置节点被选中
         * @param node
         */
        this.setNodeUnchecked = function(node){
            that.getKlwZtreeObj().setNodeUnchecked(node);
        };

        /**
         * 获取 取消 按钮  jquery的选择器 的字符串
         * @returns {string}
         */
        this.getBtnCancelSelector = function(){
            if(btnCancelSelector == ""){
                btnCancelSelector = "#" + that.getPluginid() + " .btn_cancel"
            }
            return btnCancelSelector;
        };

        /**
         * 获取 确定 按钮  jquery的选择器 的字符串
         * @returns {string}
         */
        this.getBtnOkSelector = function(){
            if(btnOkSelector == ""){
                btnOkSelector = "#" + that.getPluginid() + " .btn_ok"
            }
            return btnOkSelector;
        };

        /**
         * 获取 关闭 按钮 jquery的选择器 的字符串
         * @returns {string}
         */
        this.getBtnCloseSelector = function(){
            if(btnCloseSelector == ""){
                btnCloseSelector = "#" + that.getPluginid() + " .btn_close"
            }
            return btnCloseSelector;
        };

        /**
         * 获取 查询输入 的选择器 jquery的选择器 的字符串
         * @returns {string}
         */
        this.getBtnSearchSelector = function(){
            if(btnSearchSelector == ""){
                btnSearchSelector = "#" + that.getPluginid() + " .serchBox"
            }
            return btnSearchSelector;
        };

        var orgModalFilterSelector = "";
        /**
         * 获取筛选结果控件 的选择器 jquery的选择器 的字符串
         * @returns {string}
         */
        this.getOrgModalFilterSelector = function(){
            if(orgModalFilterSelector == ""){
                if(that.setting.modalType == "both"){
                    orgModalFilterSelector = "#" + that.getPluginid() + " .orgModalBothWidgetFilter"
                }else{
                    orgModalFilterSelector = "#" + that.getPluginid() + " .orgModalSingleWidgetFilter"
                }
            }
            return orgModalFilterSelector;
        };

        var selectedWidget = "";
        /**
         * 获取已经选择内容控件 的选择器 jquery的选择器 的字符串
         * @returns {string}
         */
        this.getSelectedWidget = function(){
            if(selectedWidget == ""){
                if(that.setting.modalType == "both"){
                    selectedWidget = "#" + that.getPluginid() + " .orgModalBothSelectedWidget ";
                }else{
                    selectedWidget = "#" + that.getPluginid() + " .orgModalBothSelectedWidget ";
                }
            }
            return selectedWidget;
        };

        /**
         * 给模态对话框的 ok,cancel，close 按钮绑定事件
         */
        this.modalBtnBindingEvent = function(){

            // 绑定 取消按钮事件
            $(that.getBtnCancelSelector()).on("click",function(currentEvent){
                that.hide();
                if(that.setting.btnCancelCallback != undefined && that.setting.btnCancelCallback != null && that.setting.btnCancelCallback != ""){
                    that.setting.btnCancelCallback(currentEvent,that);
                }
            });

            // 绑定 确定按钮事件
            $(that.getBtnOkSelector()).on("click",function(currentEvent){
                if(that.setting.btnOkCloseModal == true){
                    that.hide();
                }
                if(that.setting.btnOkCallback != undefined && that.setting.btnOkCallback != null && that.setting.btnOkCallback != ""){
                    that.setting.btnOkCallback(currentEvent,that);
                }
            });

            // 绑定 关闭按钮事件
            $(that.getBtnCloseSelector()).on("click",function(currentEvent){
                that.hide();
                if(that.setting.btnColseCallback != undefined && that.setting.btnColseCallback != null && that.setting.btnColseCallback != ""){
                    that.setting.btnColseCallback(currentEvent,that);
                }
            });

            // 绑定 查询输入框 事件
            $(that.getBtnCloseSelector()).on("click",function(currentEvent){
                that.hide();
                if(that.setting.btnColseCallback != undefined && that.setting.btnColseCallback != null && that.setting.btnColseCallback != ""){
                    that.setting.btnColseCallback(currentEvent,that);
                }
            });

            // 绑定 查询输入框 事件
            $(that.getBtnSearchSelector()).on("keyup",function(currentEvent){
                var key =  $(that.getBtnSearchSelector()).val();
                // 如果内容为空，则显示组织机构树
                if(key == ""){
                    // 查找选中的结果集合，然后在左侧树中选中
                    $(that.getTreeSelectedSelector()).find("li").each(function(){
                        var $currentObj = $(this);
                        var targetId = $currentObj.attr("data_value");
                        var nodes = that.selectNodesByAttribute("id",targetId);
                        for(var i = 0; i < nodes.length;i++){
                            that.setNodeChecked(nodes[i]);
                        }
                    });

                    $(that.getTreeSelector()).show();
                    $(that.getOrgModalFilterSelector()).hide();
                }
                // 如果有过滤条件，则显示筛选出来的结果,隐藏组织树
                else{
                    $(that.getTreeSelector()).hide();
                    $(that.getOrgModalFilterSelector()).show();
                    var filterArray = that.cacheFilter(key,that.setting.dataType);

                    // 重新生成一棵树，是过滤数据的
                    var filterZtreeSetting = $.extend(klwZtreeDefaultSetting,{
                        "targetSelector" : that.getOrgModalFilterSelector(),
                        "initCallback" : function(){
                            //alert("my initCallback");
                        },
                        // 表示是过滤器产生的新树
                        "filterTree":true,
                        "treeData" : filterArray
                    });
                    //生产一个
                    var filterKlwZtree = new klwUtil.klwZtree(klwZtreeDefaultSetting);

                }
            });
        };

        /**
         * 筛选缓存数据中的key, scope 是指查询范围，用 that.setting.dataType 来指明
         * @param key
         * @param scope
         */
        this.cacheFilter = function(key,scope){
            // 如果查询条件是查询部门
            if(that.setting.dataType == "department"){
                // org 表示是选择机构
                if(that.setting.targetResult == "org"){
                    return that.getKlwZtreeObj().cacheOrgFilter(key);
                }
                // employee 表示筛选员工
                if(that.setting.targetResult == "employee"){
                    return that.getKlwZtreeObj().cacheEmployeesFilter(key);
                }
            }
            // 查询scope范围内的key
            else {
                return that.getKlwZtreeObj().cacheFilterByScope(key,scope);
            }
        };

        /**
         * 获取树形结构选中的值，
         * @returns {Array}
         */
        this.getValues = function(){
            var result = [];
            // 获取所有选中的节点
            $("#" + that.getPluginid() + " .orgModalBothSelectedWidget ul li").each(function(){
               var currentObj = $(this);
                var nodeInfo = currentObj.data("node");
                // 如果结果是显示人员
                if(nodeInfo.username != undefined){
                    nodeInfo["name"] = nodeInfo.username;
                }
                result.push(nodeInfo);
            });
            return result;
        };

        /**
         * 获取 ztree 选中节点，如果没有展开，实际上是没有选中的
         * @returns {Array}
         */
        this.getTreeSelectedValues = function(){
            var result = [];
            // 获取所有选中的节点
            var selectedNodes = that.getKlwZtreeObj().getSelectedNodes();
            // 获取选中节点的个数
            var length = selectedNodes.length;
            //循环选中的节点
            for(var i=0; i< length; i++){
                var tempObj = {}
                // 如果需要选择员工
                if((that.setting.dataType == "department" && that.setting.targetResult == "employee") || that.setting.dataType == "departmentEmployee"){
                    tempObj = {
                        // 员工ID
                        id:selectedNodes[i].id,
                        // 机构ID
                        pId:selectedNodes[i].pId,
                        // 手机号
                        mobile:selectedNodes[i].mobile,
                        // 昵称
                        nickname:selectedNodes[i].nickname,
                        // 用户姓名
                        name:selectedNodes[i].username,
                        // 用户头像
                        avatar:selectedNodes[i].avatar,
                        // 员工姓名
                        text:selectedNodes[i].name,
                        // 部门ID
                        orgId:selectedNodes[i].orgId,
                        // 部门名称
                        orgName:selectedNodes[i].orgName
                    };
                }
                // 若果不是员工，例如职位、部门
                else{
                    tempObj = {
                        id:selectedNodes[i].id,
                        pId:selectedNodes[i].pId,
                        name:selectedNodes[i].name
                    };
                }

                result.push(tempObj);
            }
            return result;
        };

        /**
         * 重置页面的字符串
         */
        this.resetModalString = function(){
            var pluginContext = $("#" + that.getPluginid());
            // 1.部门/异步加载员工："department"，2.岗位："job" 3、职位："position" 4、departmentEmployee(部门 + 人)

            var defaultModalString={};
            //  departmentEmployee(部门 + 人)
            if(that.setting.dataType == "departmentEmployee"){
                defaultModalString = {
                    // 弹出层的标题
                    modalTitle : "选择员工",
                    // 组织树的标题
                    treeTitle : "员工",
                    // 选中的节点单位
                    unitString : "个人"
                };
            }
            //  3、职位："position"
            else if(that.setting.dataType == "job"){
                defaultModalString = {
                    // 弹出层的标题
                    modalTitle : "选择岗位",
                    // 组织树的标题
                    treeTitle : "岗位",
                    // 选中的节点单位
                    unitString : "个岗位"
                };
            }
            // 2.岗位："job"
            else if(that.setting.dataType == "position"){
                defaultModalString = {
                    // 弹出层的标题
                    modalTitle : "选择职位",
                    // 组织树的标题
                    treeTitle : "职位",
                    // 选中的节点单位
                    unitString : "个职位"
                };
            }
            // 1.部门/异步加载员工："department"，
            else if(that.setting.dataType == "department"){

                if(that.setting.employee == undefined || that.setting.employee == null){
                    defaultModalString = {
                        // 弹出层的标题
                        modalTitle : "选择部门",
                        // 组织树的标题
                        treeTitle : "部门",
                        // 选中的节点单位
                        unitString : "个部门"
                    };
                }else{
                    // 如果是要选择员工
                    if(that.setting.employee.isShowEmployee == true){
                        defaultModalString = {
                            // 弹出层的标题
                            modalTitle : "选择员工",
                            // 组织树的标题
                            treeTitle : "员工",
                            // 选中的节点单位
                            unitString : "个人"
                        };
                    }
                    // 如果不是，则是选择部门
                    else{
                        defaultModalString = {
                            // 弹出层的标题
                            modalTitle : "选择部门",
                            // 组织树的标题
                            treeTitle : "部门",
                            // 选中的节点单位
                            unitString : "个部门"
                        };
                    }
                }
            }

            // 如果用户配置的显示，则显示用户的配置信息，否则是默认显示的字符串
            that.setting.modalString = $.extend(defaultModalString,that.setting.modalString);

            // 弹出层的标题
            pluginContext.find(".modalTitle").html(that.setting.modalString.modalTitle);
            // 组织树的标题
            pluginContext.find(".treeTitle").html(that.setting.modalString.treeTitle);
            // 选中的节点单位
            pluginContext.find(".unitString").html(that.setting.modalString.unitString);
        };

        /**
         * 展开所有的节点
         */
        this.expandAllNodes = function(){
            that.getKlwZtreeObj().expandAll();
        };

        /**
         * 不展开所有的节点
         */
        this.unexpandAllNodes = function(){
            that.getKlwZtreeObj().unexpandAll();
        };

        /**
         * 因为 ztree是异步加载所有的ｈｔｍｌ代码，当展开节点的时候，才会加载子节点的ＨＴＭＬ代码
         * 加载插件所有的HTML代码
         */
        this.loadAllPluginHtml = function(){
            if(that.setting.dataType == "departmentEmployee"){
                that.expandAllNodes();
                that.unexpandAllNodes();
            }
        };

        /**
         * 初始化设置选中的节点
         */
        this.showInitSelectedNodes = function(){
            // 获取所有节点的数据
            var cacheData = that.getCacheData();
            if(cacheData == null || cacheData == undefined){
                cacheData = [];
            }
            var cacheDataLength = cacheData.length;
            //console.dir(cacheData);
            //  对话框类型，both —— 显示左右两边两个窗口，single —— 只显示一个窗口
            if(that.setting.modalType == "both"){
                var filterArray = that.setting.selectedNodeQueryArray;
                var filterArrayLength = filterArray.length;
                // 查询的节点集合
                var result = [];
                for(var i = 0; i < filterArrayLength; i++){
                    var tempObj = filterArray[i];
                    for(var key in tempObj){
                        for(var k = 0; k < cacheDataLength; k++){
                            var cacheObj = cacheData[k];
                            if(cacheObj[key] == tempObj[key]){
                                result.push(cacheObj);
                            }
                        }
                    }
                }

                var resultLength = result.length;
                var resultHtml = "";
                // 将 查询出来的节点集合 转为JSON对象，方便后面做查询
                var resultJson = {};
                // 将选中的节点 拼装成HTML代码
                for(var i = 0; i < resultLength; i++){
                    var tempNode = result[i];
                    resultJson[tempNode["id"]] = tempNode;
                    resultHtml = resultHtml + '<li class="right_selected_node" style=\'position: relative;cursor:pointer;\' data_value="'+tempNode["id"]+'" parent_data_value="'+tempNode["pId"]+'">'+tempNode["name"]+'<span class="guanbi_icon" style="position:absolute;right: 0;top:10px"><img src="../../images/common/icon－guanbi.svg"></span></li>';
                }
                // 将HTML代码放到指定的位置中
                $(that.getTreeSelectedSelector()).find("ul").append(resultHtml);
                //
                $(that.getTreeSelectedSelector()).find("ul li").each(function(){
                    var currentObj = $(this);
                    // 给当前对象添加点击事件
                    currentObj.on("click",function(){
                        currentObj.remove();
                        var nodes = that.selectNodesByAttribute("id",  currentObj.attr("data_value"));
                        that.setNodeUnchecked(nodes[0]);
                        that.showSelectedNumber();
                    });
                    // 将节点数据缓存起来
                    currentObj.data("node",resultJson[currentObj.attr("data_value")]);
                });
                //console.dir(result);
                that.showSelectedNumber();
            }
        };


        /**
         *  根据匹配参数的要求，设置选中的节点在右侧面板中显示
         *  @param filterArray
         */
        this.setSelectedNodeOnRightPanel = function(filterArray){
            //  对话框类型，both —— 显示左右两边两个窗口，single —— 只显示一个窗口
            if(that.setting.modalType == "both"){
                // 获取所有节点的数据
                var cacheData = that.getCacheData();
                if(cacheData == null || cacheData == undefined){
                    cacheData = [];
                }
                var cacheDataLength = cacheData.length;
                var filterArrayLength = filterArray.length;
                // 查询的节点集合
                var result = [];
                for(var i = 0; i < filterArrayLength; i++){
                    var tempObj = filterArray[i];
                    for(var key in tempObj){
                        for(var k = 0; k < cacheDataLength; k++){
                            var cacheObj = cacheData[k];
                            if(cacheObj[key] == tempObj[key]){
                                result.push(cacheObj);
                            }
                        }
                    }
                }

                var resultLength = result.length;
                var resultHtml = "";
                // 将 查询出来的节点集合 转为JSON对象，方便后面做查询
                var resultJson = {};
                for(var i = 0; i < resultLength; i++){
                    var tempNode = result[i];
                    resultJson[tempNode["id"]] = tempNode;
                    resultHtml = resultHtml + '<li class="right_selected_node" style=\'position: relative;cursor:pointer;\' data_value="'+tempNode["id"]+'" parent_data_value="'+tempNode["pId"]+'">'+tempNode["name"]+'<span class="guanbi_icon" style="position:absolute;right: 0;top:10px"><img src="../../images/common/icon－guanbi.svg"></span></li>';
                }

                $(that.getTreeSelectedSelector()).find("ul").append(resultHtml);
                // 给添加的节点绑定事件，缓存数据
                $(that.getTreeSelectedSelector()).find("ul li").each(function(){
                    var currentObj = $(this);
                    // 给当前对象添加点击事件
                    currentObj.on("click",function(){
                        currentObj.remove();
                        var nodes = that.selectNodesByAttribute("id",  currentObj.attr("data_value"));
                        that.setNodeUnchecked(nodes[0]);
                        that.showSelectedNumber();
                    });
                    // 将节点数据缓存起来
                    currentObj.data("node",resultJson[currentObj.attr("data_value")]);
                });
                //console.dir(result);
                that.showSelectedNumber();
            }
        };

        /**
         * 清除右侧选中的数据
         */
        this.clearRightPanelValues = function(){
            //  对话框类型，both —— 显示左右两边两个窗口，single —— 只显示一个窗口
            if(that.setting.modalType == "both"){
                $(that.getSelectedWidget()).find("ul").html("");
                that.showSelectedNumber();
            }
        };

        /**
         * 定义初始化方法
         */
        this.init = function(){
            // 将模板追加到最后面
            $("body").append(that.getModalHtml());
            //生产一个
            klwZtree = new klwUtil.klwZtree(that.getKlwZtreeSetting());
            // 给模态对话框的 ok,cancel，close 按钮绑定事件
            that.modalBtnBindingEvent();
            // 重置modal中的字符串
            that.resetModalString();
            // 如果是获取 机构和员工 类型，需要先全部展开，然后全部关闭，一次性加载完所有数据
           setTimeout(function(){
               //that.loadAllPluginHtml();
           },800);
        };

        // 执行初始化方法
        this.init();
    };

    return klwUtil;
});


