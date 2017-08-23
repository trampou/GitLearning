define(["JQuery", "bootstrap", "layer", "BaseClass", "config", "echarts","public"],
	function($, bootstrap, layer, BaseClass, config, echarts,$P) {
		var meeting = inherit(BaseClass.prototype);
//		sessionStorage['reportUserInfo'] = '{"userId":"10080301","name":"liang"}';
		var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));
		meeting.init = function() {
			//构造顶部导航
			meeting.navigation_top({
				id: "container",
				pageUrl: "./payment.html?token=" + meeting.getParameter().token,
				pageName: "<span style='color:#B0BDC9;font-size:14px;'>会议统计</span>",
				type: 1
			});
			
			var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
			$('#container .navigation_block').append(html);
			if(sessionStorage.getItem('isPCWeb') == 'false'){
				$('#reimburseStatement .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
			}
		};
		global = {
			URL        : "http://172.25.50.125:9003/",
			userId     : userInfo.userId,
			userName   : userInfo.userName,
			firstMonth : null,
			timer      : null,
			startMonth : nowDate(12),
			endMonth   : nowDate(0),
		};
		//接口对应的请求参数
		var meetingRequestData = {
			rep : {
				rep: [
					{
						repName: "getMeetingTrend",
						repCondition: {
							where: [
								{ "name": "user_id", "oper": "eq", "value": global.userId },
								{ "name": "status","oper": "noteq","value": "-1"},
								{ "name": "dt_month","oper": "moreeq","value": global.startMonth},
								{ "name": "dt_month","oper": "lesseq","value": global.endMonth}
							]
						}
					},
					{
						repName: "getMeetingDetail",
						repCondition: {
							where: [
								{ "name": "user_id", "oper": "eq", "value": global.userId },
								{ "name": "status" ,"oper": "noteq","value":"-1"},
								{ "name": "dt_month","oper": "moreeq", "value": global.startMonth},
								{ "name": "dt_month", "oper": "lesseq", "value":global.endMonth }
							]
						}
					},
					{
						repName: "getAvgMeeting",
						repCondition: {
							where: [
								{ "name": "user_id", "oper": "eq", "value": global.userId },
								{ "name": "status", "oper":"noteq","value":"-1"},
								{ "name": "dt_month", "oper": "moreeq","value": global.startMonth},
								{ "name": "dt_month", "oper": "lesseq", "value":global.endMonth }
							]
						}
					},
//					{
//						repName: "getSumMeetingLongPerDay",
//						repCondition: {
//							where: [
//								{ "name": "user_id", "oper": "eq", "value": global.userId },
//								{ "name": "status", "oper":"noteq","value":"-1"},
//								{ "name": "dt_month", "oper": "moreeq","value": global.startMonth},
//								{ "name": "dt_month", "oper": "lesseq", "value": global.endMonth }
//							]
//						}
//					}
				]
			}
		};
			
		// 每个接口对应的处理函数
		var meetingDataProcess = {
				getMeetingTrend:function(data){
					var  series = [
									{
										name:"会议个数",
										data:[]
								    },
								    {
								     	name:"会议时长",
								     	data:[]
								    }
								   ];
					var  xAxis  = [];
					data.repResult.forEach(function(i,v,array){
						if(v==0){
							global.fistMonth = i.month;
							var arr = i.month.split("-");
							var str = arr[0] + '年' 
									+ arr[1] + '月';
							var dataTime = arr[0]+"-"+arr[1];
							$(".timeSelect span:eq(0)","#container").html(str).attr("data-time",dataTime);
						}
						if(v==array.length-1){
							arr = i.month.split("-");
							str = arr[0] + '年' 
									+ arr[1] + '月';
							dataTime = arr[0]+"-"+arr[1];
							$(".timeSelect span:eq(1)","#container").html(str).attr("data-time",dataTime);
						}
						arr = i.month.split("-");
						str = arr[0] + '年' + arr[1] + '月';
						xAxis.push(str);
						series[0].data.push(i.sumCount);
						series[1].data.push(i.sumLong);
					})
					var option = {
						series : series,
					 	xAxis  : {
					 		data:xAxis,
					 	},
					}
					meetingTrend.setOption(option);
				},
				getMeetingDetail:function(data){
					pienumOption = {
						color: ["#8BE287", "#B7F3B5"],
						legend: {
							data: [{name:'我创建的',icon:"image://../../images/personalStatement/icon_oval_green1.svg"}
							,{name: '被邀约的',icon:"image://../../images/personalStatement/icon_oval_green2.svg"}],
						},
						title: {
							text: '',
						},
						series: {
							data: [
								{ name: "我创建的", },
								{ name: "被邀约的", },
							]
						}
					};
					pieTimeOption = {
						color: ["#16A1E1", "#64C8F5"],
						legend: {
							data: ['我创建的', '被邀约的'],
						},
						title: {
							text: '',
						},
						series: {
							data: [
								{ name: "我创建的",},
								{ name: "被邀约的",},
							]
						}
					};
					let meetingNum  = 0;
					let meetingLong = 0;
					data.repResult.forEach(function(v ,i){
						meetingNum  += v.sumCount;
						meetingLong += v.sumLong;
						pienumOption.series.data[i].value = v.sumCount;
						pieTimeOption.series.data[i].value= v.sumLong;
					});
					$(".bigSize","#meetingCount").eq(0).text(meetingNum);
					$(".bigSize","#meetingCount").eq(1).text(meetingLong);
					pienumOption = pieOption(pienumOption);
					pieTimeOption = pieOption(pieTimeOption);
					
					
				},
				getAvgMeeting:function(data){
					if(!!data.repResult[0] && !!data.repResult[0].avgLong){
						var avgmeetinghour = data.repResult[0].avgLong.toFixed(2);
					}else{
						var avgmeetinghour = "0";
					}
					$("#meetingCount .bigSize:eq(2)").text(avgmeetinghour);
					global.firstMonth = data .repResult[0].minMonth;
//					console.log(global.firstMonth)
				},
				getSumMeetingLongPerDay:function(data){
					if(!!data.repResult && !!data.repResult.avgLong){
						var perDayTime = data.repResult.avgLong.toFixed(2) ;
					}else{
						var perDayTime = "0";
					}
					$(".mediumSize .bigerSize:eq(1)").text(perDayTime);
				}
		}
		//会议数据初始化 ,ajax加载数据.
		meetingDataInit();
		
		//初始化echart对象
		let meetingTrend = echarts.init(document.getElementById("meetingTrend"));
		//配置echart的图形参数,各字段参考
		let meetingOption = {
			textStyle: {
				fontFamily: "microsoft yahei",
				fontSize: 12,
				color: "#999999"
			},
			color: ['#39A3E2', '#20B897'],
			title: {
				textStyle: {
					color: "#666666",
					fontSize: 14,
					fontWeight: 400,
					fontFamily: "microsoft yahei",
				},
				text: '会议趋势分析',
				top: 0,
				left: "6.5%",
				fontSize: "14px"
			},
			tooltip: {},
			legend: {
				right: window.innerWidth == 820 ? 55 : window.innerWidth * 0.12,
				top: 0,
				data: ['会议个数', '会议时长']
			},
			grid: {
				show: true,
				borderColor: "#EEEEEE",
				borderWidth: 0.5,
				bottom: 40
			},
			dataZoom: [{
				start: 33,
				end: 66,
				type: 'inside',
				xAxisIndex: 0,
				filterMode: 'empty'
			}],
			xAxis: {
				type: 'category',
				data: [],
				axisTick: {
					show: false
				},
				axisLine: {
					lineStyle: {
						color: "#eeeeee"
					}
				},
				axisLabel: {
					margin: 15
				}
			},
			yAxis: [{
					type: 'value',
					scale: true,
					name: '会议个数',
					boundaryGap: [0.2, 0.2],
					nameTextStyle: {
						fontSize: 10,
						color: "#C5C5C5"
					},
					splitLine: {
						lineStyle: {
							color: "#FFFFFF"
						}
					},
					axisTick: {
						show: false
					},
					axisLine: {
						lineStyle: {
							color: "#eeeeee"
						}
					},
					min:0,
				},
				{
					type: 'value',
					scale: true,
					name: '会议时长(h)',
					boundaryGap: [0.2, 0.2],
					nameTextStyle: {
						fontSize: 10,
						color: "#C5C5C5"
					},
					splitLine: {
						lineStyle: {
							color: "#EEEEEE"
						}
					},
					axisTick: {
						show: false
					},
					axisLine: {
						lineStyle: {
							color: "#eeeeee"
						}
					},
					min:0,
				}
			],
			series: [{
					name: '会议时长',
					type: 'bar',
					barWidth: 20,
					yAxisIndex: 1,
					barCategoryGap: 40,
					data: [],
					lineStyle:{
						normal:{
							width:1,
							color:"#00FFFF"
						}
					}
				},
				{
					name: '会议个数',
					type: 'line',
					yAxisIndex: 0,
					symbolSize: 8,
					data: []
				}
			]
		};
		//渲染会议趋势条形图
		meetingTrend.setOption(meetingOption);
		
		
		$(".timeSelect > span:eq(0)","#container").click(function(){
			$("#selectBeginTime").slideToggle()
		})
		$("#selectBeginTime").mouseleave(function(){
			$(this).slideUp();
		})
		$(".timeSelect > span:eq(1)","#container").click(function(){
			$("#selectEndTime").slideToggle()
		})
		$("#selectEndTime").mouseleave(function(){
			$(this).slideUp()
		})
		//屏幕自适应.
		$(window).resize(function() {
			$("#meetingTrend").css({
				"width": "110%",
				"height": window.innerHeight * 0.558,
				"left": '-6%',
			})
			meetingTrend.resize({
				width: window.innerWidth * 1.08,
				height: window.innerHeight * 0.55,
				slient: false
			})
		})
		/* ;function layer 下面的函数有个漏洞,连续触发echarts 会无法渲染图形.
		 * 这个被渲染div不在dom结构内,必须dispose,再次init才会生效,为了防止连续触发,
		 * 触发间隔为timer 存在时间
		 * 
		 */
		;(function s() {
			$("#meetingCount >div:first span").last().one("mouseover", function() {
				let timer = 4000;
				layer.tips('<div id=pienum style=color:#666666;height:100%;width:100%;display:inline-block;>出错了\n ~~~~(>_<)~~~~</div>', "#meetingNum", {
						tips: [1, "#FFFFFF"],
						time: timer,
						offset: ["0px", "00px"],
						area: ["250px", "105px"],

					}

				);
				let pienum = echarts.init(document.getElementById('pienum'));
//				let str="<div style='float:right;color:#666666;font-size:12px;margin-top:22px;'><span style='width:30px'>123</span><span style='width:30px'>abc</span></div>"
//				$("#pienum").parent().append(str);
				pienum.setOption(pienumOption);
				setTimeout(function() {
					pienum.dispose();
					s();
				}, timer + 300);

			})
		})()

		;(function s() {
			$("#meetingCount >div:eq(1) span").last().one("mouseover", function() {
//			$("#meetingCount >div:eq(2)").last().one("mouseover", function() {
				let timer = 4000;
				layer.tips('<div id=pietimer style=color:#666666;height:100%;width:100%;display:inline-block;>出错了\n ~~~~(>_<)~~~~</div>', "#meetingTime", {
						tips: [1, "#FFFFFF"],
						time: timer,
						offset: [50, "0px"],
						area: ["250px", "105px"],

					}

				);
				let pieTimer = echarts.init(document.getElementById('pietimer'));
				pieTimer.setOption(pieTimeOption);
				setTimeout(function() {
					pieTimer.dispose();
					s();
				}, timer + 300)

			})
		})()
		
		;(function selectTime(){
			if(!global.firstMonth){
				global.timer = setTimeout(function(){
					selectTime()
				},50)
				return;
			}
			clearTimeout(global.timer);
//			console.log(global.firstMonth);
			var startdate = new Date(global.firstMonth);
			var enddate   = new Date(global.endMonth);
			while(startdate.getTime() <= enddate.getTime()){
					var time=startdate.getFullYear()+"年"+monthFormat(startdate.getMonth()+1)+"月"
					var dataTime=startdate.getFullYear()+"-"+monthFormat(startdate.getMonth()+1);
					var str="<p data-time="+dataTime+">"+time+"</p>";
					$("#selectBeginTime,#selectEndTime").prepend(str);
					startdate.setMonth(startdate.getMonth()+1);
			}
			$("#selectBeginTime p").click(function(v){
				var str = $(".timeSelect span:eq(1)","#container").attr("data-time");
				if($(this).attr("data-time")>str){
					layer.msg("起始日期需要大于结束日期");
					return;
				}
				$(".timeSelect > span:eq(0)","#container").attr("data-time",$(this).attr("data-time"))
														.text($(this).text());
				global.startMonth = $(this).attr("data-time");
				meetingDataInit()
																					
			});
			$("#selectEndTime p").click(function(v){
				var str = $(".timeSelect span:eq(0)","#container").attr("data-time");
				if($(this).attr("data-time")<str){
					layer.msg("结束日期需要大于结起始日期");
					return;
				}
				$(".timeSelect > span:eq(1)","#container").attr("data-time",$(this).attr("data-time"))
														.text($(this).text());
				global.endMonth = $(this).attr("data-time");
				meetingDataInit()
																					
			});
		})();

		//饼图配置项函数
		function pieOption(obj) {

			let Option = {
				color: obj.color || ['#39A3E2', '#20B897'],
				title: {
					text: obj.title.text || "",
					textStyle: {
						color: "#666666",
						fontSize: 16,
						fontFamily: "microsoft yahei",
						fontWeight: 400,
					},
					align: 'center',
					top: obj.title.top || 35,
					left: obj.title.left || 95,
				},
				tooltip:{
					formatter:function(i){
						return i.data.value;
					}
				},
//				legend: {
//					orient: 'vertical',
//					top: 23,
//					right: 10,
//					data:obj.legend.data,
//				},
				series: {
					name: '',
					type: 'pie',
					radius: ['60%', '90%'],
					hoverAnimation: false,
					startAngle:90,
					minAngle:30,
					label: {
						normal: {
							textStyle:{
								color:"#666666"
							},
							show: true,
							position: "outside",
							formatter: function(a) {
								str = a.name+"  \n"+"       "+a.value+"       "
								return str;
							}
						},
					},
					labelLine: {
						normal: {
							length:5,
							length2:5,
							show: true,
							lineStyle:{
								color:'rgb(128, 128, 128)'
							}
						}
					},
					center: ["50%", "50%"],
					data: obj.series.data || ""
				}
			};
			return Option;
		}
		
		function nowDate(n){
			n=n||0;
			var now = new Date();
			now.setMonth( now.getMonth()-n);
			var str = now.getFullYear()+"-"+( monthFormat(now.getMonth()+1) );
			return str;
		}
		
		function monthFormat(num){
			return  num>9?num.toString() :"0"+num;
		}
		function meetingAjax(token,option){
			var rep='token='+token+'&rep='+JSON.stringify(option.rep).substring(7,JSON.stringify(option.rep).length-1);
			var fn=arguments[arguments.length-1];
			$.ajax({
				type:	"post",
				url:	global.URL+"worksheet/report.json",
				async:  true,
				data:   rep,
				dataType:"json",
				error:function(status){
					console.log(status);
					fn();
				},
				success:option.success||function(result){
					console.log(result);
					if(result.code==1&&result.message=="成功"){
						fn(result);
					}else{
						fn();
					}
				}
			});
		}
		function meetingDataInit(){
			meetingAjax(meeting.getParameter().token,meetingRequestData,function(result){
				var checkData;
				if(!!result==false||!!result.data){
					checkData = false;
				}
				else{
					var checkData = result.data.some(function(v){
						let flag = v.repResult==0&&v.repResult == null;
						return flag;
					})
				}
				
				if(!result|| checkData) {
					//没有数据是展示空页面
					layer.msg("网络错误,请稍后重试");
					return;
				}
				
				let data = result.data.filter(function(v){
						return v.repName == "getMeetingTrend";
					})
				meetingDataProcess.getMeetingTrend(data[0]);
				
				data = result.data.filter(function(v){
						return v.repName == "getMeetingDetail";
					})
				meetingDataProcess.getMeetingDetail(data[0]);
				
				data = result.data.filter(function(v){
						return v.repName == "getAvgMeeting";
					})
				meetingDataProcess.getAvgMeeting(data[0]);
				
//				data = result.data.filter(function(v){
//						return v.repName == "getSumMeetingLongPerDay";
//					})
//				meetingDataProcess.getSumMeetingLongPerDay(data[0]);
			});
		};
 		return meeting;
	});