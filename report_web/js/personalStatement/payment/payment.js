define(["JQuery", "echarts", "bootstrap", "layer", "BaseClass", "config", "public"],
	function($, echarts, bootstrap, layer, BaseClass, config, $P) {
		var index = layer.load(1, {
			shade: [0.1, '#fff'] //0.1透明度的白色背景
		});
		
		var timer;
		$('.border-toggle').click(function() {

			$("#timeSelect").slideToggle();
			
			timer = setTimeout(function(){
				$("#timeSelect").slideup();
			},200)
		});
		$("#timeSelect").mousemove(function() {
			clearTimeout(timer);
		})
		$("#timeSelect").mouseleave(function() {
			$(this).slideUp()
		})
		$("#timeSelect p").click(function(){
			$("#timeSelect").slideUp();
		})
		
		var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));
		var global = {
			userId:userInfo.userId,
			name:userInfo.userName,
//			userId:10080295,
			lastTime:null,
			beginTime:null
		};
		
		var _this = inherit(BaseClass.prototype);
		_this.init = function() {
			//构造顶部导航
			_this.navigation_top({
				id: "container",
				pageUrl: "./payment.html?token=" + _this.getParameter().token,
				pageName: "<span style='color:#B0BDC9;font-size:14px;'>薪资</span>",
				type: 1
			});

			var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
			$('#container .navigation_block').append(html);
			if(sessionStorage.getItem('isPCWeb') == 'false'){
				$('#reimburseStatement .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
			}

		};
		
		function numFormat(str) {
			y = str.split(".")[0].split("");
			var decimal = str.split(".")[1];
			var arr = [];
			let flag = 0;
			while(y.length != 0) {
				arr.unshift(y.pop());
				flag += 1;
				if(flag == 3) {
					flag = 0;
					if(y.length == 0)
						break;
					arr.unshift(",");
				};
			}
			return decimal == undefined ? arr.join("") : arr.join("") + "." + decimal;
		}
		let getSalaryStartDate = {
			async:false,
			rep:{
				rep: [{
						repName: "getSalaryStartDate",
						repCondition: {
							where: [
								{ name: "user_id", oper: "eq", value: global.userId }
							]
						}
					},
					{
						repName: "getSalaryEndDate",
						repCondition: {
							where: [
								{ name: "user_id", oper: "eq", value: global.userId }
							]
						}
					}
				]
			},
		};
		//获取开始和截止时间
		;(function(token,option){
			
			var rep='token='+token+'&rep='+JSON.stringify(option.rep).substring(7,JSON.stringify(option.rep).length-1);
			console.log(rep)
			$.ajax({
				type:"post",
				url: $P.url+"/worksheet/report.json",
				async:false,
				data:  rep,
				dataType:"json",
				error:function(){
					dataError();
				},
				success:function(result){
					var checkData = result.data.some(function(v){
						let flag = v.repResult==0||v.repResult == null;
						return flag;
					})
					if(!result|| checkData) {
						//没有数据是展示空页面
						dataError();
						return;
					}
					console.log(result);
					let data =result.data.filter(function(v){
						return v.repName == "getSalaryStartDate";
					})
					global.startTime = data[0].repResult.value;
				 	data = result.data.filter(function(v){
						return v.repName == "getSalaryEndDate";
					})
					global.lastTime = data[0].repResult.value;
				}
			});
		})(_this.getParameter().token,getSalaryStartDate);
		
		var getSalaryByMonth = {
			rep:{
				rep:[{
					repName: "getAvgSalaryByMonthRang",
					repCondition: {
						where: [
							{ "name": "user_id", "oper": "eq", "value": global.userId },
							{ "name": "dt_month", "oper": "lesseq", "value": global.lastTime },
							{ "name": "dt_month", "oper": "moreeq", 
							"value": function(time){
								if(Object.prototype.toString.call(time)!="[object String]"){
									return "";
								}
								var date=new Date(time);
								var str =(date.getFullYear()-1)+time.substring(4);
								return str;
							}(global.lastTime)
							}
						]
					}
				},
				{
					repName: "getSalaryByMonth",
					repCondition: {
						where: [
							{ "name": "user_id", "oper": "eq", "value": global.userId },
							{ "name": "dt_month", "oper": "eq", "value": global.lastTime }
						]
					}
				},
				{
					repName: "getAllSumAfterSalary",
					repCondition: {
						where: [
							{ "name": "user_id", "oper": "eq", "value": global.userId }
						]
					}
				},
				{
					repName: "getAllSumAfterSalaryInLastThreeYear",
					repCondition: {
						where: [
							{ "name": "user_id", "oper": "eq", "value": global.userId }
						]
					}
				},
				{
					repName: "getSalaryTableByMonth",
					repCondition: {
						where: [
							{ "name": "user_id", "oper": "eq", "value": global.userId },
							{ "name": "grant_month", "oper": "eq", "value": global.lastTime }
						]
					}
				}
				]
			}
		};
		//接口数据处理
		let paymentDataProcess = {
			getSalaryByMonth: function(data) {
				let aft = data[0].repResult.afterTax;
				let pre = data[0].repResult.preTax;
				let time = data[0].repResult.month;
				time = time.split("-")[0] + "年" + time.split("-")[1] + "月";
				let name = data[0].repResult.userName;
				$("table tr:odd td:eq(0)").text(name);
				$("#SalaryOverview .Income >p").first().text(time);
				$("#container .main:eq(1) .title p span span").first().text(time);
				$("#SalaryOverview .Income .blue").first().text(numFormat(pre.toString()).split(".")[0]);
				$("#SalaryOverview .Income .blue").last().text(numFormat(aft.toString()).split(".")[0]);

			},
			getAvgSalaryByMonthRang: function(data) {
				let avg = data[0].repResult.afterTax;
				$("#SalaryOverview .Income >p span").last().text(numFormat(avg.toString()).split(".")[0] + "元");
			},
			getAllSumAfterSalary: function(data) {
				let countIncome = data[0].repResult.afterTax;
				countIncome = (countIncome / 10000).toFixed(2) + "万元";
				$("#SalaryOverview .barIncome >p span").text(countIncome);

			},
			getAllSumAfterSalaryInLastThreeYear: function(data) {
				data = data[0].repResult;
				let LastThreeYearArr = []
				data.map(function(v, i, arr) {
					LastThreeYearArr.push(v.afterTax);
					$("#SalaryOverview .barIncome > div >p:eq(" + i + ") span")
						.first()
						.text(v.year + "年")
						.end()
						.last()
						.text((v.afterTax / 10000).toFixed(2) + "万元");
					if(i == arr.length - 1) {
						$("#SalaryOverview .barIncome > div >p:gt(" + (i) + ")").remove();
					}
				});

				LastThreeYearMax = LastThreeYearArr.reduce(function(a, b) { return a > b ? a : b });
				$("#SalaryOverview .barIncome> div >p span.bar").each(function(i) {
					let width = LastThreeYearArr[i] / LastThreeYearMax * 100 + "%";
					$(this).css("width", width);
				})
				if(LastThreeYearArr.length == 2) {
					$("#SalaryOverview .barIncome> div >p")
						.css("margin-top", "10px");
				} else if(LastThreeYearArr.length == 1) {
					$("#SalaryOverview .barIncome> div >p")
						.css("margin-top", "30px");
				}
			},
			getSalaryTableByMonth: function(data) {
				let n=1;
				let str;
				let len=22;
				$("table tr:gt(5)").remove();
				data[0].repResult.map(function(v, i, arr) {
					if(v.name==""||v.name=="税率"||v.name =="速算扣除数" ||v.name==""){
						n-=1;
					}else if((v.type==1||v.type==2)&&(v.name!="税后劳务费"&&v.name!="个人所得税"&&v.name!="税前劳务费"&&v.name!="应纳税所得额"&&v.name!="税前年终奖"&&v.name!="税后年终奖")){
						n-=1;
					}else{
						if(i+n>len){
							str="";
							for(let i=0;i<8;i++){
								str+="<td></td>"
							}
							$("table").append("<tr>"+str+"</tr><tr>"+str+"</tr>");
							len+=8;

						}
						v.name = v.name.length < 7 ? v.name : v.name.substring(0,3)+"<br/>"+v.name.substring(3);
						$("table tr:even td:eq(" + (i + n) + ")").html(v.name);
						$("table tr:odd td:eq(" + (i + n) + ")").text(numFormat(v.value.toString()));
						if(i == arr.length - 1) {
							$("table tr:even td:gt(" + (i + n) + ")").text("");
							$("table tr:odd td:gt(" + (i + n) + ")").text("");
						}
						$(".main table tr:even").css({ "background-color": "#F6F6F6", "color": "#aaa" });

						$(".main table tr").each(function() {
							$(this).children().first().css("border-left", "0px");
							$(this).children().last().css("border-right", "0px");
						});
						
					}
				})
			}
		}
		$P.ajax(_this.getParameter().token, getSalaryByMonth, function(result) {
			var checkData;
			if(!!result==false||!!result.data){
				checkData = false;
			}
			else{
				var checkData = result.data.some(function(v){
					let flag = v.repResult==0 && v.repResult == null;
					return flag;
				})
			}
			
			if(!result|| checkData) {
				//没有数据是展示空页面
				dataError();
				return;
			}

			//处理当前月的数据信息
			let data = result.data.filter(function(v) {
				return v.repName == "getSalaryByMonth";
			});
			paymentDataProcess.getSalaryByMonth(data);

			//月平均收入
			data = result.data.filter(function(v) {
				return v.repName == "getAvgSalaryByMonthRang";
			});
			paymentDataProcess.getAvgSalaryByMonthRang(data);

			//薪酬总计
			data = result.data.filter(function(v) {
				return v.repName == "getAllSumAfterSalary";
			});
			paymentDataProcess.getAllSumAfterSalary(data);

			//获取最近三年的薪酬收入
			data = result.data.filter(function(v) {
				return v.repName == "getAllSumAfterSalaryInLastThreeYear";
			});
			paymentDataProcess.getAllSumAfterSalaryInLastThreeYear(data);

			//工资条表格
			data = result.data.filter(function(v) {
				return v.repName == "getSalaryTableByMonth";
			});
			paymentDataProcess.getSalaryTableByMonth(data);
		})

		layer.close(index);
		$("body").css("visibility", "visible");
		
		;(function(){
			function monthFormat(num){
				return num >9 ? num.toString() : "0"+num;
			}
			var startdate = new Date(global.startTime);
			var enddate   = new Date(global.lastTime);
			while(startdate.getTime() <= enddate.getTime()){
					var time=startdate.getFullYear()+"年"+monthFormat(startdate.getMonth()+1)+"月"
					var dataTime=startdate.getFullYear()+"-"+monthFormat(startdate.getMonth()+1)+"-01";
					var str="<p data-time="+dataTime+">"+time+"</p>";
					$("#timeSelect").prepend(str);
					startdate.setMonth(startdate.getMonth()+1);
			}
			$("#timeSelect p").click(function(v){
				$("#container .main:eq(1) .title p span span").first().text($(this).text());
				let s=$(this).attr("data-time");
				let rep={rep:{
					rep:[]
				}}
				rep.rep.rep.push(getSalaryByMonth.rep.rep[4]);
				rep.rep.rep[0].repCondition.where[1].value=s;
				$P.ajax(_this.getParameter().token,rep , function(result) {
					var checkData = result.data.some(function(v){
						let flag = v.repResult==0||v.repResult == null;
						return flag;
					})
					if(!result|| checkData) {
						//没有数据是展示空页面
						dataError();
						return;
					}
					let	data = result.data.filter(function(v) {
						return v.repName == "getSalaryTableByMonth";
					});
					paymentDataProcess.getSalaryTableByMonth(data);
				})
			});
		})();
		function dataError(){
			$(".Income").html("<div class=insert  style='margin-left:15%; padding:50px; color:#C5C5C5;'>暂无薪酬记录</div>");
			$(".barIncome").html("<div class=insert  style='margin-left:15%; padding:50px; color:#C5C5C5;'>暂无薪酬记录</div>");
			$("table").hide().siblings().show();
		}
		

		return _this;
	});