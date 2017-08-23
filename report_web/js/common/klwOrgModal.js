define(["JQuery","BaseClass","config","klwUtil"], function($,BaseClass,config,klwUtil) {

    var klwOrgModal = inherit(BaseClass.prototype);

    /**
     *  机构弹出层
     */
    klwOrgModal.klwOrgModal = function(userSetting){

        var that = this;

        // 缓存初始化的模板HTML代码
        var modalHtml= "";
        // 获取创建改对象的时间戳，作为该对象的唯一标识
        var pulginId = new Date().getTime();
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

        //检查参数
        userSetting = userSetting || {};

        // 缓存获取的数据
        var cacheFactory = {};

        //默认配置信息
        var defaultSetting = {
            // 1.部门："department"，2.职位："job"，3.汇报对象："Presentation"，4.审批人："Approver"，5.抄送人："cc",6.联系人："contacts"，7."handover": "经办人",8."operator": "交接人"
            dataType:"department",
            // 对话框类型，both —— 显示左右两边两个窗口，single —— 只显示一个窗口
            modalType : "both",
            // org 表示是选择机构，employee 表示是员工，如果是员工就需要异步加载数据，如果是机构，可以一次性获取,默认是选择org机构
            targetResult : "org",
            // 确定按钮是否关闭窗口，true 表示关闭，false 表示不关闭，默认是true
            btnOkCloseModal : true,
            //是否是单选，false表示是多选，true表示是单选
            isRadio:false
        };

        this.setting = $.extend(defaultSetting,userSetting);

        // 获取组件的id,为时间戳，作为唯一标识
        this.getPluginid = function(){
            return pulginId;
        };

        // 获取klwZtree对象，这个不是ztree对象
        this.getKlwZtreeObj = function(){
            //if(getKlwZtree == null || getKlwZtree == undefined || getKlwZtree == ""){
            //    return null;
            //}
            return klwZtree;
        };

        // 获取ztree对象
        this.getZtreeObj = function(){
            var tempObj = that.getKlwZtreeObj();
            if(tempObj == null || tempObj == undefined || tempObj == ""){
                return null;
            }else{
                return tempObj.getTreeObj();
            }
        };

        // 根据id获取ztree对象
        this.getZtreeObjById = function(treeid){
            return $.fn.zTree.getZTreeObj(treeid);
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
            // 点击checkbox 的回调函数
            onCheck: function(event,treeId, treeNode, pluginObj){
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
                            $(treeSelectedSelector + " ul").append("<li id='"+treeNode.tId+"_right_li' data_value='"+treeNode.id+"' parent_data_value='"+treeNode.pId+"'>"+treeNode.name+"</li>")
                            // 给右侧选中的节点 绑定事件
                            $("#"+treeNode.tId+'_right_li').on("click",function(){
                                var currentObj = $(this);
                                var treeid = currentObj.attr("id").split("_")[0];
                                currentObj.remove();
                                // 不勾选树形的节点
                                that.getZtreeObjById(treeid).checkNode(treeNode, false, false);
                            });
                        }else{
                            // 不选中 checkbox
                            // 将选中的机构或者 个人，添加到右边
                            $("#"+treeNode.tId+'_right_li').remove();
                        }
                    }
                }

                if(that.setting.checkFun != undefined){
                    that.setting.checkFun(treeId, treeNode, pluginObj);
                }

                //function abc(treeId){
                //    var treeObj = that.getZtreeObjById(treeId)
                //    // 获取所有选中的节点，包含状态check_Child_State为1（部分 子节点被勾选），这个需要排除
                //    var selectedNodes = treeObj.getCheckedNodes(true);
                //    var length = selectedNodes.length;
                //    var result = [];
                //    for(var i=0;i<length;i++){
                //        if(selectedNodes[i].check_Child_State != 1){
                //            result.push(selectedNodes[i]);
                //        }
                //    }
                //    return result;
                //}
                //
                //console.dir(abc(treeId));
            },
            beforeMouseDown: function(treeId, treeNode, pluginObj){
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
                }

                if(that.setting.fontClickFun != undefined){
                    that.setting.fontClickFun(treeId, treeNode, pluginObj);
                }

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
                if(that.setting.targetResult != "org" ){
                    that.setAllNocheck();
                }

                if(that.setting.initFun != undefined){
                    that.setting.initFun(pluginObj);
                }
            }
        };

        // 让所有的节点全部不能选择
        this.setAllNocheck = function(){
            var zTreeObj = that.getZtreeObj();
            // transformToArray需要被转换的 zTree 节点数据对象集合 或 某个单独节点的数据对象
            var nodes = zTreeObj.transformToArray(zTreeObj.getNodes());
            var length = nodes.length;
            for(var i = 0; i<length; i++){
                nodes[i].nocheck = true;
                zTreeObj.updateNode( nodes[i]);
            }
        };

        // 根据当前的配置信息，获取klwZtree的配置信息
        this.getKlwZtreeSetting = function(){
            var userSetting = {};
            // 获取ztree对象的选择器
            userSetting["targetSelector"] = that.getTreeSelector();
            // 数据类型
            userSetting["dataType"] = that.setting.dataType;

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

            return $.extend(klwZtreeDefaultSetting,userSetting);
        };

        // 获取模板的HTML代码
        this.getModalHtml = function(){
            if(modalHtml == ""){
                if(that.setting.modalType == "both"){
                    modalHtml = $("#orgModalBoth").html();
                }else{
                    modalHtml = $("#orgModalSingle").html();
                }
                var pulginId = that.getPluginid();
                modalHtml = '<div id="'+pulginId+'">'+modalHtml+'</div>';
            }
            return modalHtml;
        };

        // 隐藏弹出层
        this.hide = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).css("display","none");
        };

        // 显示弹出层
        this.show = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).css("display","block");
        };

        // 销毁对象
        this.destory = function(){
            var pulginId = that.getPluginid();
            $("#" + pulginId).remove();
            // 将对象的句柄指null,让垃圾回收
            that = null;
        };

        // 根据dataType来获取URL
        this.getDataUrl = function(){
            if(url == ""){
                if(that.setting.dataType == "department"){
                    url = '/appcenter/company/tree.json';
                }
            }
            return url;
        };

        // 本地模拟发送ajax请求
        this.ajax = function(param){
            var defaultSetting = {
                type: 'POST',
                url: "http://172.25.50.74:9000" + param.url,
                dataType: "json",
                data: param.data,
                headers:{
                    token: 'bdk20VAk5eg1aS/bX781waLEycb//gOrxgLhcE9tRnmK7mT332ujuChvrOQD0IBJ853h+TU3pcM=',
                    from:'pc'
                },
                beforeSend: function(){
                    //console.log("beforeSend");
                },
                complete: function(){
                    //console.log("complete");
                },
                success: param.success,
                error: function(err) {
                    layer.msg(err.message?err.message:"系统错误，请联系客服！");
                }
            };
            $.ajax(defaultSetting);
        };

        // 获取树所在的选择器
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

        // 获取树所在的选择器
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

        // 获取机构缓存数据
        this.getCacheOrgArray = function(){
            return that.getKlwZtreeObj().getCacheOrg()
        };

        // 获取员工缓存数据
        this.getCacheEmployeeArray = function(){
            return that.getKlwZtreeObj().getCacheEmployees()
        };

        // 获取 取消 按钮
        this.getBtnCancelSelector = function(){
            if(btnCancelSelector == ""){
                btnCancelSelector = "#" + that.getPluginid() + " .btn_cancel"
            }
            return btnCancelSelector;
        };

        // 获取 确定 按钮
        this.getBtnOkSelector = function(){
            if(btnOkSelector == ""){
                btnOkSelector = "#" + that.getPluginid() + " .btn_ok"
            }
            return btnOkSelector;
        };

        // 获取 关闭 按钮
        this.getBtnCloseSelector = function(){
            if(btnCloseSelector == ""){
                btnCloseSelector = "#" + that.getPluginid() + " .btn_close"
            }
            return btnCloseSelector;
        };

        // 获取 查询输入 的选择器
        this.getBtnSearchSelector = function(){
            if(btnSearchSelector == ""){
                btnSearchSelector = "#" + that.getPluginid() + " .serchBox"
            }
            return btnSearchSelector;
        };

        var orgModalFilterSelector = "";
        // 获取 查询结果显示 的选择器
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

        // 给模态对话框的 ok,cancel，close 按钮绑定事件
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
                        "treeData" : filterArray
                    });
                    //生产一个
                    var filterKlwZtree = new klwUtil.klwZtree(klwZtreeDefaultSetting);

                }
            });
        };

        // 筛选缓存数据中的key, scope 是指查询范围，用 that.setting.dataType 来指明
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

        // 获取所有选中的结果
        this.getValues = function(){
            var result = [];
            // 如果是 左右两边的选择框
            if(that.setting.modalType == "both"){
                $(that.getTreeSelectedSelector()+" ul li").each(function(){
                    var currentObj = $(this);
                    var data_value = currentObj.attr("data_value");
                    var parent_data_value = currentObj.attr("parent_data_value");
                    var tempNodeName = currentObj.html();
                    var tempObj = {
                        id:data_value,
                        pId:parent_data_value,
                        name:tempNodeName
                    };
                    result.push(tempObj);
                });
            }else{
                var selectedNodes = that.getKlwZtreeObj().getSelectedNodes();
                var length = selectedNodes.length;

                for(var i=0; i< length; i++){
                    var tempObj = {
                        id:selectedNodes[i].id,
                        pId:selectedNodes[i].pId,
                        name:selectedNodes[i].name
                    };
                    result.push(tempObj);
                }
            }
            return result;
        };

        // 定义初始化方法
        this.init = function(){
            // 将模板追加到最后面
            $("body").append(that.getModalHtml());

            //生产一个
            klwZtree = new klwUtil.klwZtree(that.getKlwZtreeSetting());
            // 给模态对话框的 ok,cancel，close 按钮绑定事件
            that.modalBtnBindingEvent();
        };
        // 执行初始化方法
        this.init();
    }


    return klwOrgModal;
});


