define(["JQuery", "bootstrap", "layer", "BaseClass","echarts" , "config"], function($, bootstrap, layer, BaseClass, echarts, config) {
	var insterestingCude = inherit(BaseClass.prototype);
	insterestingCude.init = function() {
		insterestingCude.navigation_top({
			id: "container",
			pageUrl: "./homepage.html?token=" + insterestingCude.getParameter().token,
			pageName: "<span style='letter-spacing:0px;font-size:14px;'>个人报表</span>",
			type: 0
		});
		insterestingCude.navigation_top({
			id: "container",
			pageUrl: "#",
			pageName: "<span style='color:#B0BDC9;font-size:14px;'>趣味魔方</span>",
			type: 1
		});
	};
	
	;(function() {
		let index = $(".checked", "#message").index();
		$(".navigation", "#message")
			.eq(index)
			.siblings('.navigation')
			.hide();
		$(".select", "#message").click(function() {
			var n = $(this).index();
			$(".navigation", "#message")
				.eq(n)
				.show()
				.siblings('.navigation')
				.hide();
			$(this).addClass("checked")
				.siblings(".select")
				.removeClass("checked");
		})
	})()
option = {
    tooltip: {},
	textStyle:{
		fontSize:16,
		color:"#999999"
	},
    radar: {
        // shape: 'circle',
        indicator: [
           { name: "发起瞬间", max: 6500},
           { name: '被评论', max: 16000},
           { name: '被点赞', max: 30000},
           { name: '评论', max: 38000},
           { name: '点赞', max: 52000},
        ]
    },
    series: [{
        type: 'radar',
        symbol:"roundRect",
        label:{
        	normal:{
        		show:false
        	}
        },
        lineStyle:{
        	normal:{
        		color:"#12E7BC"
        	}
        },
        itemStyle:{
        	normal:{
        		color:"#29BDFF"
        	}
        },
        areaStyle:{
        },
        data : [
            {
                value : [4300, 10000, 28000, 35000, 50000],
//              name : '预算分配'
            }
        ]
    }]
};
	var moment = echarts.init(document.getElementById("moment"));
	moment.setOption(option);

	return insterestingCude;
});