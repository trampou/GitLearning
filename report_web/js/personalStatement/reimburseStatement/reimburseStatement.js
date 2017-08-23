/**
 * Created by Sasha on 2017/2/13.
 */
define(["JQuery","BaseClass","echarts","layer","artTemplate","klwTools","bootstrap","bs-datetimepicker","bs-datetimepicker-zh-CN","config"],
    function($,BaseClass,echarts,layer,template) {

    var reimburse = inherit(BaseClass.prototype);
    //当前所查看报表所属员工信息
    var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));

    reimburse.init = function(){

        //添加最大化最小化图标
        var obj = {
            "id":"reimburseStatement",
            "pageUrl":"./reimburseStatement.html?token="+reimburse.getParameter().token+"&companyId="+reimburse.getParameter().companyId,
            "pageName":"报销分析"
        };
        reimburse.navigation_top(obj);

        /*
         * 添加头部当前所查看的报表所属员工信息
         * */
        var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
        $('#reimburseStatement .navigation_block').append(html);
        if(sessionStorage.getItem('isPCWeb') == 'false'){
            $('#reimburseStatement .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
        }

        /*初始化时间控件*/
        $('.timeInput').datetimepicker({
            language: 'zh-CN',
            format: "yyyy-mm",
            autoclose: true,
            minView:3,
            startView:3,
            endDate:new Date()
        });
        $('.timeFilter .startTime').val(new Date().addMonths(-11).format('yyyy-MM'));
        $('.timeFilter .endTime').val(new Date().format('yyyy-MM'));

        this.renderChart($('.timeFilter .startTime').val(),$('.timeFilter .endTime').val());
        this.event();

    };

    reimburse.renderChart = function(startTime,endTime){
        //加载报销分析图表
        var param = [
            {
                repName:"getSumReimburseByRang",
                repCondition:{where:[
                    {name:"approver_id",oper:"eq",value:userInfo.userId},
                    {name:"dt_month",oper:"moreeq",value:startTime},
                    {name:"dt_month",oper:"lesseq",value:endTime}
                ]}
            },
            {
                repName:"getReimbursePassPercentByRang",
                repCondition:{where:[
                    {name:"approver_id",oper:"eq",value:userInfo.userId},
                    {name:"dt_month",oper:"moreeq",value:startTime},
                    {name:"dt_month",oper:"lesseq",value:endTime}
                ]}
            },
            {
                repName:"getReimbursePassTrendByRang",
                repCondition:{where:[
                    {name:"approver_id",oper:"eq",value:userInfo.userId},
                    {name:"dt_month",oper:"moreeq",value:startTime},
                    {name:"dt_month",oper:"lesseq",value:endTime}
                ]}
            },
            {
                repName:"getReimburseCompar",
                repCondition:{where:[
                    {name:"approver_id",oper:"eq",value:userInfo.userId},
                    {name:"dt_month",oper:"moreeq",value:startTime},
                    {name:"dt_month",oper:"lesseq",value:endTime}
                ]}
            }
        ];
        reimburse._ajax({
            url: '/worksheet/report.json'/*'/report_web/js/personalStatement/reimburseStatement/reimburse.json'*/,
            data: { rep : JSON.stringify(param) },
            token: reimburse.getParameter().token,
            success:function(res){
                if(res.code == 1){
                    var sumReimburse = getRepResult(res.data, 'getSumReimburseByRang').value;
                    var reimbursePassRate = getRepResult(res.data, 'getReimbursePassPercentByRang').value;
                    var reimburseTrend = getRepResult(res.data, 'getReimbursePassTrendByRang');
                    var reimburseCompar = getRepResult(res.data, 'getReimburseCompar');

                    var trendCategory = splitColumnToArr(reimburseTrend,'name');
                    var trendData = splitColumnToArr(reimburseTrend,'value', 'int');

                    var personAvg = splitColumnToArr(reimburseCompar,'personAvg');
                    var companyAvg = splitColumnToArr(reimburseCompar,'companyAvg');

                    $('#sumReimburse').text(sumReimburse!=null?sumReimburse:0);
                    loadPassRateChart(reimbursePassRate!=null?reimbursePassRate:0);
                    loadTrendChart(trendCategory , trendData);
                    loadEfficiencyChart(personAvg,companyAvg);
                }else{
                    layer.msg(res.message?res.message:'网络错误，请稍后重试', {time: 1000});
                }
            }
        });

        //获取对应报表的数据，data为数据列表，name为需要的数据列表名称
        function getRepResult( data, name ){
            var result;
            $.each(data, function (index, value) {
                if( value['repName'] == name ){
                    result = value["repResult"];
                }
            });
            return result;
        }

        //从表格中获取指定列值，一数组格式返回
        function splitColumnToArr( arr,colunm ,type){
            if(!arr){
                arr = [];
            }
            var col = [];
            for(i= 0; i<arr.length; i++ ){
                if(type == 'int'){
                    arr[i][colunm] = parseInt(arr[i][colunm]);
                }
                col.push( arr[i][colunm] );
            }
            return col;
        }


        //完成率饼图的label参数设置
        var labelTop = {
            normal : {
                label : {
                    show : true,
                    position : 'center',
                    formatter : '{b}',
                    textStyle: {
                        baseline : 'bottom'
                    }
                },
                labelLine : {
                    show : false
                }
            }
        };
        var labelBottom = {
            normal : {
                color: '#EEEEEE',
                label : {
                    show : true,
                    position : 'center'
                },
                labelLine : {
                    show : false
                }
            },
            emphasis: {
                color: '#EEEEEE'
            }
        };

        /*累计审批报销单据饼图*/
        function loadPassRateChart(data) {
            var passRate_echart = echarts.init(document.getElementById('passRateEchart'));
            var passRate_option = {
                title: {
                    text: '审批通过率',
                    itemGap: 10,
                    textStyle: {
                        color: '#999999',
                        fontSize: 10,
                        fontWeight: 'normal'
                    },
                    textAlign: 'center',
                    left: '48%',
                    bottom: 25
                },
                legend: {
                    show : false
                },
                calculable: true,  //设置更改data数据项
                series: [
                    {
                        name: "比率",
                        type: "pie",
                        center: ['50%', '40%'],       //圆心位置
                        radius: ['30%', '45%'],       //饼环大小
                        hoverAnimation: false,        //鼠标hover放大
                        avoidLabelOverlap: false,
                        itemStyle: {
                            normal : {
                                color: function(params) {
                                    var colorList = ['#76B6F1','#EEEEEE'];
                                    return colorList[params.dataIndex]
                                }
                            }
                        },
                        data:  [
                            {name:(data*100)+'%', value:data,itemStyle:labelTop},
                            {name:'', value:1-data,itemStyle:labelBottom}
                        ]
                    }
                ]
            };
            passRate_echart.setOption(passRate_option);
        }

        /*审批单据个数折线图*/
        var trend_echart = echarts.init(document.getElementById('qtyTrendEchart'));
        function loadTrendChart(category , data){
            if(category.length<12){
                if(category.length==0){
                    category.push($('.timeFilter .startTime').val());
                }
                var startDate = new Date(category[category.length-1]);
                for(var i=category.length; i<12; i++){
                    category.push(new Date(startDate.addMonths(1)).format('yyyy-MM'));
                    data.push('');
                }
                data[11] = '';
            }
            var trend_option = {
                title: {
                    text: '审批单据个数趋势',
                    itemGap: 10,
                    textStyle: {
                        color: '#999999',
                        fontSize: 14,
                        fontWeight: 'normal'
                    },
                    textAlign: 'center',
                    left: '48%',
                    top: 10
                },
                tooltip : {
                    trigger: 'item',
                    formatter:'{b} : {c}个'
                },
                calculable : true,
                xAxis :{
                    position:'bottom',
                    type : 'category',
                    boundaryGap : false,
                    data : category,
                    axisLine: {
                        show: true,
                        lineStyle:{
                            color : '#EEEEEE'
                        }
                    },
                    axisTick: {
                        show: true,
                        interval:'true',
                        inside: 'true'
                    },
                    axisLabel: {
                        textStyle: {
                            color: 'rgba(102,102,102,0.87)',
                            fontSize: 10
                        }
                    }
                },
                yAxis : {
                    type: 'value',
                    axisLine: {
                        show: true,
                        lineStyle:{
                            color : '#EEEEEE'
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        formatter: function (val) {
                            return val+'个';
                        },
                        textStyle: {
                            color: 'rgba(102,102,102,0.87)',
                            fontSize: 10
                        }
                    },
                    scale:true,
                    splitNumber:3,
                    splitLine: {
                        show: true,
                        interval: 'auto',
                        lineStyle: {
                            color: '#E5E5E5',
                            width:1
                        }
                    },
                    minInterval: 1
                },
                series : [
                    {
                        name:'审批单据数',
                        type:'line',
                        showAllSymbol: true,
                        symbolSize: 7,
                        smooth:false,
                        itemStyle: {
                            normal: {
                                color:'#22B998'
                            }
                        },
                        lineStyle: {
                            normal:{
                                color: '#22B998',
                                width: 1
                            }
                        },
                        data:data
                    }
                ]
            };
            trend_echart.setOption(trend_option);
        }

        /*审批效率对比分析 柱状图*/
        var efficiency_echart = echarts.init(document.getElementById('efficiencyEchart'));
        function loadEfficiencyChart(personAvg,companyAvg) {
            if(!personAvg || personAvg.length==0 ){
                personAvg = [0,0,0,0,0]
            }
            var efficiency_option = {
                legend: {
                    top: 18,
                    right: '6%',
                    itemGap : 15,
                    itemWidth: 6,    //图例标记的图形宽度,默认值为25。
                    itemHeight: 6,    //图例标记的图形高度,默认值为14。
                    textStyle: {
                        color: '#999999'
                    },
                    data:[userInfo.name , '公司平均']
                 },
                tooltip : {
                    trigger: 'item',
                    formatter: function (params, ticket, callback) {
                        return params.seriesName + ' : ' + params.value*100 + '%';
                    }
                },
                xAxis :{
                    type : 'category',
                    data : ['1天内','1-3(含)天','3-5(含)天','5-10(含)天','10天以上'],
                    axisLabel: {
                        interval:0,   //强制显示类目轴所有名称
                        textStyle: {
                            color: 'rgba(102,102,102,0.87)',
                            fontSize: 10
                        }
                    },
                    splitLine: {show:false},  //x轴标记线
                    axisTick: {               //x轴刻度
                        show: false
                    },
                    axisLine: {                 //x轴线
                        show: true,
                        lineStyle:{
                            color : '#EEEEEE'
                        }
                    }
                },
                yAxis : {
                    type : 'value',
                    scale:true,
                    splitNumber:5,
                    max:1,
                    splitLine: {
                        show: true,
                        interval: 'auto',
                        lineStyle: {
                            color: '#E5E5E5',
                            width:1
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLine: {
                        show: true,
                        lineStyle:{
                            color : '#EEEEEE'
                        }
                    },
                    axisLabel: {
                        formatter: function (val) {
                            return val*100+'%';
                        },
                        textStyle: {
                            color: 'rgba(102,102,102,0.87)',
                            fontSize: 10
                        }
                    }
                },
                series : [
                    {
                        name: userInfo.name,
                        type:'bar',
                        barWidth: 36,
                        barGap : 0,
                        itemStyle: {
                            normal: {
                                barBorderWidth: 1,
                                color : '#20B897'
                            }
                        },
                        data:personAvg
                    },
                    {
                        name:'公司平均',
                        type:'bar',
                        barWidth: 36,
                        barGap : 0,
                        itemStyle: {
                            normal: {
                                barBorderWidth: 1,
                                color : '#96E086'
                            }
                        },
                        data:companyAvg
                    }
                ]
            };
            efficiency_echart.setOption(efficiency_option);
        }

        /*
        * 审批效率对比分析提示框
        * */
        $('.reimbursement .efficiencyMsg img').popover({
            content:'<span>柱形高度=审批所花费时长为n天（比如1天内）的报销单据个数/所有审批完成的报销单据个数*100%；通过个人和公司平均进行效率对比</span>',
            html:true,
            placement:'bottom',
            trigger:'hover'
        });

        //图表自适应
        $(window).resize(function() {
            trend_echart.resize();
            efficiency_echart.resize();
        });
    };

    reimburse.event = function(){

        /*按时间段筛选*/
        $('.reimbursement').on('change','.selectPeriod',function(){
            if(checkIsTrigger($(this))){
                var begin = $(this).parents('.timeFilter').find('.startTime').val(),
                    end = $(this).parents('.timeFilter').find('.endTime').val();
                reimburse.renderChart(begin,end);
            }
        });

        /*检查时间段是否合理，能否触发筛选事件*/
        function checkIsTrigger(obj){
            var begin = obj.parents('.timeFilter').find('.startTime').val(),
                end = obj.parents('.timeFilter').find('.endTime').val();
            if(begin==''||begin==null||end==''||end==null){
                return false;
            }else if(begin > end){
                layer.msg('起始时间不能大于结束时间');
                return false;
            }else{
                return true;
            }
        }

    };

    return reimburse;
});
