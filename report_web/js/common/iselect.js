/**
 * Created by zhangys on 2016/11/18.
 * 公共弹窗组件
 */
define(["JQuery", "BaseClass", "layer", "config", "bootstrap"], function($, BaseClass, layer) {

    function ISelect(opt) {
        if (this === window)return;

        for (var i in opt) {
            if (this[i] !== undefined) {
                this[i] = opt[i];
            }
        }
        this.init();

        //测试代码
        //$("#ccc").modal();
    }

    ISelect.prototype = inherit(BaseClass.prototype);

    $.extend(ISelect.prototype, {
        constructor: ISelect,

        type:null,      //下拉列表类型，1.部门："department"，2.职位："job"，3.汇报对象："Presentation"，4.审批人："Approver"，5.抄送人："cc",6.联系人："contacts"，7."handover": "经办人",8."operator": "交接人"，9."employee": "成员"

        url_param:null,

        select_id:null,

        result_num_type:"single",       //选择数量类型，单选："single"，多选："complex"

        single_html: '<div class="cont-div full-height zys-bg-write"></div>',

        complex_html: '<div class="col-md-5 col-md-offset-1 full-height zys-bg-write" data-type="left"></div><div class="col-md-4 col-md-offset-1 full-height zys-bg-write" data-type="right"><ul class="i-select-ul"></ul></div>',

        select_html:'<div class="i-select"><div class="select-val">点击选择</div></div>',
        
        modal_html: '<div class="modal fade " id="" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">    <div class="modal-dialog">        <div class="modal-content zys-bg-normal">        <div class="modal-header">        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>    <h4 class="modal-title" id="myModalLabel">{title}</h4></div>    <div class="modal-body modal-body-height">        <div class="row full-height" data-name="tree_container">        </div>        </div>        <div class="modal-footer">        <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>        <button type="button" class="btn iselect-btn-ok btn-success">确定</button>        </div>        </div>        </div>        </div>',

        text:{
            "department": "部门",
            "job": "职位",
            "Presentation": "汇报对象",
            "Approver": "审批人",
            "cc": "抄送人",
            "contacts": "联系人",
	        "handover": "交接人",
	        "operator": "经办人",
            "employee": "成员"
        },

        init: function(){
        	if(this.type==='Approver' || this.type==='cc'|| this.type==='operator'){
        		this.select_html='<div class="i-select"><div class="select-val_i">选择需要'+this.text[this.type]+'员</div></div>'
        	}
            this.init_value();
            this.init_event();
        },

        //初始化页面显示
        init_value: function(){
            var _this = this;
            var sel_dom = $("#"+_this.select_id);
            sel_dom.html(_this.select_html);

            var div = $(document.createElement("div"));
            _this.modal_html = _this.modal_html.replace("{title}", "选择"+_this.text[_this.type]);
            div.html(_this.modal_html);
            var modal_div = div.find(".modal.fade");
            modal_div.attr("id", _this.select_id+"_modal");
            if(_this.result_num_type === "single"){
                modal_div.find("*[data-name='tree_container']").html(_this.single_html);
            }else{
                modal_div.find("*[data-name='tree_container']").html(_this.complex_html);
            }
            $("body").append(modal_div);

            _this.url_param = _this.getParameter();

            if(_this.type == "job"){
                _this.query_job();
            }else if(_this.type == "department"){
                _this.query_department();
            }else{
                _this.query_employee_department();
            }
        },

        //初始化事件
        init_event: function(){
            var _this = this;
    		 if(_this.type==='Approver' || _this.type==='cc'|| _this.type==='operator'){
    		 	$("#"+_this.select_id).prev().on("click", function(){
               		$("#"+_this.select_id+"_modal").modal();
           		 });
    		 }else{
    		 	 $("#"+_this.select_id).on("click", function(){
               		$("#"+_this.select_id+"_modal").modal();
           		 });
    		 }
           
            //确定按钮-事件
            $("#"+_this.select_id+"_modal"+ " .iselect-btn-ok").on("click", function(){
                var active_li = null;
                if(_this.type == "job"){
                    active_li = $(".zys-bg-normal .zys-bg-write .i-select-li .checkbox-border.active", "#"+_this.select_id + "_modal").parent();
                }else if(_this.type == "department"){
                    active_li = $(".zys-bg-normal .zys-bg-write .i-select-li .checkbox-border.active", "#"+_this.select_id + "_modal").parent();
                }else{
                    active_li = $(".zys-bg-normal .zys-bg-write .i-select-li .checkbox-border.active", "#"+_this.select_id + "_modal").parent();
                }
                var id_values = "";
                var text_values = "";
	            var dept_name = "";
                active_li.each(function(index){
                    id_values += $(this).data("id") + (index < active_li.length - 1 ? "," : "");
                    text_values += $(this).find(".active").siblings('.checkbox-text').text() + (index < active_li.length - 1 ? "," : "");
	                dept_name += $(this).parent().parent().children('.checkbox-text').text() + (index < active_li.length - 1 ? "," : "");
                });
                
                $("#"+_this.select_id).attr("data-id", id_values)
                $("#"+_this.select_id).attr("data-value",text_values);
                if(_this.type==='Approver' || _this.type==='cc'|| _this.type==='operator'){
                	
                	var _list = text_values.split(',')
                	var _html=''
                	for(var i=0;i<_list.length;i++){
            			_html  += _this.get_head_html(_list[i],1);
                	}
                	if(!id_values==''){
                		$("#"+_this.select_id).find(".select-val_i").parent().html(_html);
                	}else{
                		$("#"+_this.select_id).find(".i-select").html("");
                		$("#"+_this.select_id).find(".i-select").html('<div class="select-val_i">选择需要'+_this.text[_this.type]+'员</div>');
                	}
                }else{
                	if(text_values!='' && text_values!=null){
                		$("#"+_this.select_id).find(".select-val").text(text_values);
                	}else{
                		$("#"+_this.select_id).find(".select-val").text('点击选择');
                		$("#"+_this.select_id).attr("data-id", '')
                		$("#"+_this.select_id).attr("data-value",'');
                	}
                }
                
	            
	            if($("#"+_this.select_id).attr("data-dept")!==undefined){
		            $("#"+_this.select_id).attr("data-dept",dept_name);
	            }

                $("#"+_this.select_id+"_modal").modal("hide");
            });

        },

        //查询职位
        query_job: function(){
            var _this = this;
            _this._ajax({
                url:"/appcenter/company/position.json",
                token: _this.url_param.token,
                data: {type: 2},
                success: function(data){
                    if(data.code === "1"){
                        var container = $("*[data-name='tree_container'] .zys-bg-write","#"+ _this.select_id+"_modal");
                        var ul = $(document.createElement("ul"));
                        ul.addClass("i-select-li");

                        var length = data.data.length;
                        for(var i = 0 ; i < length ; i++){
                            var temp = data.data[i];
                            var li = $(document.createElement("li"));
                            li.addClass("i-select-li");
                            li.data("id", temp.id);
                            li.on("click", function(){
                                var checkbox_dom = $(this).find(".checkbox-border");
                                if(checkbox_dom.hasClass("active")){
                                    checkbox_dom.removeClass("active");
                                }else{
                                    container.find(".i-select-li .checkbox-border").removeClass("active");
                                    $(this).find(".checkbox-border").addClass("active").siblings().removeClass("active");
                                }

                            });
                            var span_border = $(document.createElement("span"));
                            span_border.addClass("checkbox-border");
                            li.append(span_border);
                            var span_text = $(document.createElement("span"));
                            span_text.addClass("checkbox-text");
                            span_text.text(temp.name);
                            li.append(span_text);
                            ul.append(li);
                        }
                        container.append(ul);
                    }else{
                        layer.msg("系统错误，请联系客服！");
                    }

                }
            })
        },

        //查询部门
        query_department: function(){
            var _this = this;
            _this._ajax({
                url:"/appcenter/company/tree.json",
                token: _this.url_param.token,
                data: null,
                success: function(data){
                    if(data.code === "1"){
                        var container = null;
                        if(_this.result_num_type == "complex") {
                            container = $("*[data-name='tree_container'] .zys-bg-write[data-type='left']","#"+ _this.select_id+"_modal");
                        }else{
                            container = $("*[data-name='tree_container'] .zys-bg-write","#"+ _this.select_id+"_modal");
                        }
                        var data_arr = [];
                        data_arr.push(data.data);

                        function forever(data, _container){
                            var ul = $(document.createElement("ul"));
                            ul.addClass("i-select-ul");

                            var length = data.length;
                            for(var i = 0 ; i < length ; i++){
                                var temp = data[i];
                                var li = $(document.createElement("li"));
                                li.addClass("i-select-li");
                                li.data("id", temp.id);
                                li.data("child_data", temp.children);
                                
                               

                                var span_icon = $(document.createElement("span"));
                                span_icon.addClass("icon-uniE993");
                                li.append(span_icon);
                                
                               
                                
                             	var span_border = $(document.createElement("span"));
                            	span_border.addClass("checkbox-border");
                            	li.append(span_border);
                        		span_border.on("click", function(){
	                                if($(this).hasClass("active")){
	                                    $(this).removeClass("active");
	                                }else{
	                                    container.find(".i-select-li .checkbox-border").removeClass("active");
	                                    $(this).addClass("active").siblings().removeClass("active");
	                                }
	                            });
                                var span_text = $(document.createElement("span"));
                                span_text.addClass("checkbox-text");
                                span_text.text(temp.name);
                             	span_text.on("click", function(){
                         	        var parent = $(this).parent();
                                    if(parent.find("ul").length > 0){
                                        if(parent.find("ul").hasClass("hide")){
                                            parent.find("ul").removeClass("hide");
                                            parent.find(".icon-uniE993").first().addClass("icon-uniE991").removeClass("icon-uniE993");
                                        }else{
                                            parent.find("ul").addClass("hide");
                                            parent.find(".icon-uniE991").first().addClass("icon-uniE993").removeClass("icon-uniE991");
                                        }

                                    }else{
                                        if($(this).parent().find(".icon-uniE991").length > 0){
                                            parent.find(".icon-uniE991").first().addClass("icon-uniE993").removeClass("icon-uniE991");
                                            return false;
                                        }

                                        $(this).parent().find(".icon-uniE993").first().addClass("icon-uniE991").removeClass("icon-uniE993");

                                        if(parent.data("child_data")){
                                            forever(parent.data("child_data"), parent);
                                        }
                                    }
                                    return false;
                                });
                                li.append(span_text);
                                ul.append(li);
                            }

                            _container.append(ul);
                        }

                        forever(data_arr, container);
                    }else{
                        layer.msg("系统错误，请联系客服！");
                    }

                }
            })
        },

        //查询员工之前先查部门
        query_employee_department: function(){
            var _this = this;

            _this._ajax({
                url:"/appcenter/company/tree.json",
                token: _this.url_param.token,
                data: null,
                success: function(data){
                    if(data.code === "1"){
                        var container = null;
                        if(_this.result_num_type == "complex") {
                            container = $("*[data-name='tree_container'] .zys-bg-write[data-type='left']","#"+ _this.select_id+"_modal");
                        }else{
                            container = $("*[data-name='tree_container'] .zys-bg-write","#"+ _this.select_id+"_modal");
                        }
                        var data_arr = [];
                        data_arr.push(data.data);

                        function forever(data, _container){
                            var ul = $(document.createElement("ul"));
                            ul.addClass("i-select-ul");

                            var length = data.length;
                            for(var i = 0 ; i < length ; i++){
                                var temp = data[i];
                                var li = $(document.createElement("li"));
                                li.addClass("i-select-li");
                                li.data("id", temp.id);
                                li.data("child_data", temp.children);
                                li.on("click", function(){
                                    var parent = $(this);
                                    if(parent.find("ul").length > 0){
                                        if(parent.find("ul").hasClass("hide")){
                                            parent.find("ul").removeClass("hide");
                                            parent.find(".icon-uniE993").first().addClass("icon-uniE991").removeClass("icon-uniE993");
                                        }else{
                                            parent.find("ul").addClass("hide");
                                            parent.find(".icon-uniE991").first().addClass("icon-uniE993").removeClass("icon-uniE991");
                                        }

                                    }else{
                                        if($(this).find(".icon-uniE991").length > 0){
                                            parent.find(".icon-uniE991").first().addClass("icon-uniE993").removeClass("icon-uniE991");
                                            return false;
                                        }

                                        $(this).find(".icon-uniE993").first().addClass("icon-uniE991").removeClass("icon-uniE993");

                                        if(parent.data("child_data")){
                                            forever(parent.data("child_data"), parent);
                                        }

                                        _this.query_employee(parent.data("id"), parent);
                                    }
                                    return false;
                                });

                                var span_icon = $(document.createElement("span"));
                                span_icon.addClass("icon-uniE993");
                                li.append(span_icon);

                                var span_text = $(document.createElement("span"));
                                span_text.addClass("checkbox-text");
                                span_text.text(temp.name);
                                li.append(span_text);
                                ul.append(li);
                            }

                            _container.append(ul);
                        }

                        forever(data_arr, container);
                    }else{
                        layer.msg("系统错误，请联系客服！");
                    }

                }
            })
        },

        //查询员工
        query_employee: function(orgId, parent_dom){
            var _this = this;

            _this._ajax({
                url:"/appcenter/employee/list.json",
                token: _this.url_param.token,
                data: {orgId: orgId, pageSize: 9999},
                success: function(data){
                    if(data.code === "1"){
                        var json_data = data.data.list;

                        if(!json_data)return;

                        var length = json_data.length;

                        var ul = $(document.createElement("ul"));
                        ul.addClass("i-select-ul");

                        for(var i = 0 ; i < length ; i++){
                            var temp = json_data[i];

                            var li = $(document.createElement("li"));
                            li.addClass("i-select-li");
                            li.data("id", temp.id);
                            li.data("emp_data", temp);
                            li.on("click", function(){
                                var child_span = $(this).find(".checkbox-border").first();
                                if(child_span.hasClass("active")){
                                    child_span.removeClass("active");
                                    if(_this.result_num_type == "complex"){
                                        $("*[data-name='tree_container'] .zys-bg-write[data-type='right'] *[data-id='"+$(this).data("id")+"']","#"+ _this.select_id+"_modal").remove();
                                    }
                                }else{
                                    if(_this.result_num_type == "complex"){
                                        var clone_node = $(this)[0].cloneNode(true);
                                        $(clone_node).find(".checkbox-border").remove();
                                        $(clone_node).attr("data-id",  $(this).data("id")).addClass("no-child-li");
                                        $("*[data-name='tree_container'] .zys-bg-write[data-type='right']","#"+ _this.select_id+"_modal").append(clone_node);

                                    }else{
                                        $(".checkbox-border.active", "#"+_this.select_id+"_modal").removeClass("active");
                                    }
                                    child_span.addClass("active");
                                }
                                return false;
                            });

                            var span_border = $(document.createElement("span"));
                            span_border.addClass("checkbox-border");
                            li.append(span_border);

                            if(temp.avatar.indexOf("default.jpg") > 0){
                                var head_span_html = _this.get_head_html(temp.name ,0);
                                li.append(head_span_html);
                            }else{
                                var head_span = $(document.createElement("span"));
                                head_span.addClass("head-img-normal");
                                head_span.attr("title", temp.name);

                                var img = $(document.createElement("img"));
                                img.attr("src", temp.avatar);
                                head_span.append(img);

                                li.append(head_span);
                            }

                            var span_text = $(document.createElement("span"));
                            span_text.addClass("checkbox-text");
                            span_text.text(temp.name);
                            li.append(span_text);

                            ul.append(li);
                        }

                        parent_dom.append(ul);

                    }else{
                        layer.msg("系统错误，请联系客服！");
                    }

                }
            })
        }

    });

    return ISelect;
});