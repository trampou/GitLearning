define(["JQuery", "bootstrap", "layer","klwUtil", "BaseClass", "config"], function($, bootstrap, layer,klwUtil, BaseClass, config) {
	var _this = inherit(BaseClass.prototype);

	var global = {
		dom: null, //拖拽dom临时变量
		token: _this.getParameter().token
	};
	homepageSort = {
		order :{},
		init:function(){
			order=this.order;
			let str = localStorage.homepageSort||"attendance:0,salary:1,recruit:2,meeting:3,task:4,project:5,aim:6,wipe:7,assets:8,personal:9,test:10,bole:11,magic:12";
			str.split(",").map(function(elem){
				order[elem.split(":")[0]]=elem.split(":")[1];
			});
			this.set();
		},
		save:function(){
			let str="";
			$("#container ul li").each(function(index){
				str+=$(this).attr("data-name")+":"+index+",";
			})
			str=str.substring(0,str.length-1);
			localStorage.homepageSort=str;
		},
		set:function(){
			for(let i=0;i<13;i++){
				for(let j in this.order){
					if(this.order[j]==i){
						$("[data-name="+j+"]","#container").appendTo("#container ul");
					}
				}
			}
			$("#container ul li").css("visibility","visible");
		}
	};
	homepageSort.init();
	
	hrefJump={
		url:"./",
		mapping:{
			payment:"payment.html",
			recruit:"recruit.html",
			attendance:"attendanceAnalysis.html",
			meeting:"meeting.html",
			task:"assignmentAnalysis.html",
			project:"projectManagement.html",
			wipe:"reimburseStatement.html",
			aim:"",
			assets:"assetStatement.html",
			test:"",
			bole:"",
			magic:"InterestingCube.html",
			personal:""
		},
		init:function(){
			$("#container li").click(function(){
				if(hrefJump.mapping[$(this).attr("data-name")].toString().length==0){
					layer.msg("即将上线,敬请期待");
				}else{
					url=hrefJump.mapping[$(this).attr("data-name")];
					window.location.href= hrefJump.url+url+"?token="
										 +_this.getParameter().token+"&companyId="
										 +_this.getParameter().companyId+"&userId="
										 +_this.getParameter().userId+"$&timestamp="
										 +_this.getParameter().timestamp;
				}
			});
		},
		
	}
	hrefJump.init();
	//初始化
	_this.init = function() {
		_this.navigation_top({
			id: "container",
			pageUrl: "./homepage.html?token=" + _this.getParameter().token+"&companyId="+_this.getParameter().companyId+"&userId="+_this.getParameter().userId,
			pageName: "个人报表",
			type: 0
		});

		_this._ajax({
			url: '/appcenter/employee/queryDetailInfo.json',
			data: { userId : _this.getParameter().userId },
			token: _this.getParameter().token,
			success:function(res){
				if(res.code == 1){
					var html = '<div class="reviewUser"><span class="viewSubList">查看下属报表</span><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+res.data.User.name+'</span></div>';
					$('#container .navigation_block').append(html);
					if(sessionStorage.getItem('isPCWeb') == 'false'){
						$('#container .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
					}
					var reportUserInfo = {"userId":res.data.User.id, "name":res.data.User.name};
					sessionStorage.setItem('reportUserInfo', JSON.stringify(reportUserInfo));
					_this.event();
				}else{
					layer.msg(res.message?res.message:'网络错误，请稍后重试', {time: 1000});
				}
			}
		});

	};

	_this.event = function(){
		//组织架构初始化
		var selectEmployee = new klwUtil.klwOrgModal({
			modalString:{
				// 弹出层的标题
				modalTitle : "选择成员",
				// 组织树的标题
				treeTitle : "组织架构",
				// 选中的节点单位
				unitString : "人"
			},
			dataType:"departmentEmployee",
			modalType : "both",
			isRadio : true,
			btnOkCallback : function(eventObj,pluginObj){
				/*新增待离职员工*/
				var userId = pluginObj.getValues()[0].id;
				var name = pluginObj.getValues()[0].name;
				$('#container .viewUserName').text(name);
				var reportUserInfo = {"userId":userId, "name":name};
				sessionStorage.setItem('reportUserInfo', JSON.stringify(reportUserInfo));
				pluginObj.hide();
			}
		});
		$('#container').off('click','.viewSubList').on('click','.viewSubList',function(){
			selectEmployee.show();
		});
	};


	/*
	 对所有的li绑定拖拉拽事件。
	 * */
	$("#container")[0].ondragover = function(ev) {
		ev.preventDefault();
	};
	$("#container")[0].ondrop = function(ev) {
		$("#container li").css("border-style","none");
		ev.preventDefault();

		var target = $(ev.target).parent().parent();
		if(target.parent()[0] == $("ul")[0]) {
			setTimeout(homepageSort.save,100);
			global.dom.insertBefore(target);
		} else {

		}

	};
	$("#container li").each(function() {
		$(this)[0].ondragstart = function(ev) {
			global.dom = $(ev.target).parent().parent();
			ev.dataTransfer.setData("Text", ev.target.id);
		};
	});
	$("#container li").mousedown(function(){
		$(this).css("border-style","dashed");
	});
	
	$("#container li").mouseup(function(){
		$("#container li").css("border-style","none");
	});

	return _this;
});