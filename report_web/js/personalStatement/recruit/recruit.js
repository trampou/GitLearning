define(["JQuery", "echarts", "bootstrap", "layer", "BaseClass", "config"],
	function($, echarts, bootstrap, layer, BaseClass, config) {

		let monthCount = echarts.init(document.getElementById("monthCount"));
		let Cumulative = echarts.init(document.getElementById("Cumulative"));
		let jobTurnover = echarts.init(document.getElementById("jobTurnover"));

		function barCountOption(obj) {
			let option = {
				color: ["#76B6F1"],
				textStyle:{
					fontFamily:"microsoft yahei",
					fontSize:"11px",
				},
				yAxis: {
					gridIndex: 0,
					type: "category",
					splitLine: {
						show: false,
						color: "#FCFCFC"
					},
					axisTick: {
						show: false
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: "#eeeeee"
						}
					},
					axisLabel: {
						textStyle: {
							color: "#999999",
							fontSize: "10px"
						}
					},
					data: [
							{
								value:"入职人数",
							},
							{
								value:"offer人数",
							},
							{
								value:"到场人数",
							},
							{
								value:"邀约人数",
							},
							{
								value: "筛选简历",
							}]
				},
				grid: [
					{ x: '27%', y: '-4%', width: '80%', height: '90%' }
				],
				tooltip: {
					formatter: function(val, b) {
						return val.name + "  " + val.data + "  人";
					}
				},
				xAxis: {
					gridIndex: 0,
					type: "value",
					splitLine: {
						show: false,
						color: "#eeeeee"
					},
					axisTick: {
						show: false
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: "#eeeeee"
						}
					},
					axisLabel: {
						textStyle: {
							color: "#999999",
							fontSize: "10px"
						}
					},
				},
				series: {
					type: "bar",
					barWidth: "12",
					label: {
						normal: {
							show: true,
							offset: [10, 1],
							position: 'insideRight'
						}
					},
					data: obj.series.data
				}
			}
			return option;
		}
		let monthCountoption = {
			series: {
				data: [100, 120, 160, 180, 190, ]
			}
		}
		let Cumulativeoption = {
			series: {
				data: [80, 120, 162, 172, 183, ]
			}
		}
		let jobTurnoverOption = {
			tooltip: {
				trigger: 'item',
				formatter: function(val) {
					return val.name + " " + val.value + "</br>转化率 " + val.data.convert;
				}
			},
			color: ["#76B6F1", "#7DC4D1", "#82CFB4", "#87D99E", "#8BE287"],
			calculable: true,
			series: [{
				type: 'funnel',
				left: '25%',
				width: '65%',
//				sort: 'descending',
				top: 0,
				bottom: "10%",
				right:"0%",
				gap: 1,
				label: {
					normal: {
						show: true,
						position: 'left',
						formatter: function(val) {
							return val.name;
						},
						textStyle: {
							fontSize: 10,
							color: "#999999"
						}
					},
					emphasis: {
						show: true,
						textStyle: {
							fontSize: 12
						}
					}
				},
				labelLine: {
					normal: {
						show: false,
					}
				},
				data: [
					{ value: 100, name: '筛选简历', convert: "80%" },
					{ value: 80, name: '邀约人数', convert: "50%" },
					{ value: 60, name: '到场人数', convert: "20%" },
					{ value: 40, name: 'offer人数', convert: "30%" },
					{ value: 20, name: '入职人数', convert: "40%" }
				]
			}]
		}
		monthCountoption = barCountOption(monthCountoption);
		Cumulativeoption = barCountOption(Cumulativeoption);
		monthCount.setOption(monthCountoption);
		Cumulative.setOption(Cumulativeoption);
		jobTurnover.setOption(jobTurnoverOption);

/*		monthCount.on("click", function(params) {
			layer.open({
				type: 1,
				title: false,
				closeBtn: 0,
				shadeClose: true,
				skin: 'layer',
				area: ["89%", "57.5%"],
				content: '<div id=xxx style="width:100%;height:100%"></div>'
			});
			let xxx = echarts.init(document.getElementById("xxx"));
			let xxxoption = {
				textStyle: {
					fontFamily: "microsoft yahei",
					fontSize: 12,
					color: "#999999"
				},
				color: ['#44ADEB', '#FD9390',"#FFBE72","#92E389","#C6ADD5"],
				title: {
					textStyle: {
						color: "#888888",
						fontSize: 14,
						fontFamily: "microsoft yahei",
					},
					text: '2016年会议时长统计趋势',
					top: 8,
					right: "50%",
					fontSize: "14px"
				},
				tooltip: {},
				legend: {
					bottom: 10,
					data: ['会议个数', '会议时长',"会长","时长","会议"]
				},
				grid: {
					show: true,
					borderColor: "#EEEEEE",
					borderWidth: 0.5
				},
				xAxis: {
					type: 'category',
					data: ["a","b","c","d","e","f"],
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
				yAxis: {
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
				},
				series: [
					{
						name: '会议时长',
						type: 'line',
						symbolSize: 8,
						data: [15,12,15,16,15,12]
					},
					{
						name: '会议个数',
						type: 'line',
						symbolSize: 8,
						data: [15,12,15,16,10,9].sort((a,b)=>a>b?a:b),
					},
					{
						name: '会长',
						type: 'line',
						symbolSize: 8,
						data: [15,12,15,8,18,13]
					},
					{
						name: '时长',
						type: 'line',
						symbolSize: 8,
						data: [15,16,15,16,16,19]
					},
					{
						name: '会议',
						type: 'line',
						symbolSize: 8,
						data: [15,10,15,16,14,21]
					},
				
				]
			}
			xxx.setOption(xxxoption);

		})*/

		/*		layer.open({
				  type: 1,
				  title: false,
				  closeBtn: 0,
				  shadeClose: true,
				  skin: 'yourclass',
				  content: '自定义HTML内容'
				});*/
	});