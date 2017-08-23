/**
 * Created by csl on 2017/3/7.
 */
define(["JQuery", "bootstrap", "layer", "BaseClass", "config", "echarts","artTemplate","bs-datetimepicker","bs-datetimepicker-zh-CN","klwTools","public"],
    function ($, bootstrap, layer, BaseClass, config, echarts,template) {

        var assign = inherit(BaseClass.prototype);
        //当前所查看报表所属员工信息
        var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));

        //初始化
        assign.init = function () {

            //添加最大化最小化图标
            var obj = {
                "id": "assignment",
                "pageUrl": "./reimburseStatement.html?token=" + assign.getParameter().token + "&companyId=" + assign.getParameter().companyId,
                "pageName": "任务分析"
            };
            assign.navigation_top(obj);

            /*
             * 添加头部当前所查看的报表所属员工信息
             * */
            var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
            $('#assignment .navigation_block').append(html);
            if(sessionStorage.getItem('isPCWeb') == 'false'){
                $('#assignment .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
            }

            /*初始化时间控件*/
            $('.timeInput').datetimepicker({
                language: 'zh-CN',
                format: "yyyy-mm",
                autoclose: true,
                minView: 3,
                startView: 3,
                endDate: new Date()
            });
            $('.timeFilter .startTime').val(new Date().addMonths(-11).format('yyyy-MM'));
            $('.timeFilter .endTime').val(new Date().format('yyyy-MM'));
            this.loadFinishedAssignment($('.timeFilter .startTime').val(), $('.timeFilter .endTime').val());
        };

        /*按时间段筛选*/
        $('.timeFilter').on('change', '.selectPeriod', function () {
            if (checkIsTrigger($(this))) {
                var begin = $(this).parents('.timeFilter').find('.startTime').val(),
                    end = $(this).parents('.timeFilter').find('.endTime').val();
                assign.loadFinishedAssignment(begin, end);
            }
        });

        /*检查时间段是否合理，能否触发筛选事件*/
        function checkIsTrigger(obj) {
            var begin = obj.parents('.timeFilter').find('.startTime').val(),
                end = obj.parents('.timeFilter').find('.endTime').val();
            if (begin == '' || begin == null || end == '' || end == null) {
                return false;
            } else if (begin > end) {
                layer.msg('起始时间不能大于结束时间');
                return false;
            } else {
                return true;
            }
        }

        //筛选项
        $('#assignmentDetails').on('click', '#assignmentCategory', function () {
            $('#assignmentDetails .screenList').toggle();
        });
        //点击空白处关闭筛选框
        $(document).on('click', function (event) {
            if (!$('#assignmentCategory').is(event.target) && $('#assignmentCategory').has(event.target).length === 0 && !$('.screenList').is(event.target) && $('.screenList').has(event.target).length === 0) {
                $('#assignmentDetails .screenList').css('display', 'none');
            }
        });

        //完成任务饼图、柱状图
        assign.loadFinishedAssignment = function(startTime,endTime) {
            var param = [
                {
                    repName: "getTaskTrend",
                    repCondition: {
                        where: [
                            {name: "uesr_id", oper: "eq", value: userInfo.userId},
                            {name: "dt_month", oper: "moreeq", value: startTime},
                            {name: "dt_month", oper: "lesseq", value: endTime}
                        ]
                    }
                }
            ];
            assign._ajax({
                type:"post",
                url:"/worksheet/report.json",
                data:{ rep:JSON.stringify(param)},
                token:assign.getParameter().token,
                dataType:"json",
                error:function(status){
                    console.log(status);
                },
                success:function(res){
                    console.log(res);
                    if(res.code == 1){
                        var finishedList = [];
                        $.each(res.data,function (index,value) {
                            if(value['repName'] == "getTaskTrend"){
                                finishedList = (value['repResult'] != null ? value['repResult'] : []);
                                $.each(finishedList,function(index,value){
                                    data = [
                                        {value:value.timeAfterSize,name:'延期完成'},
                                        {value:value.timeAheadSize,name:'提前完成'},
                                        {value:value.timeInSize,name:'按期完成'},
                                        {value:value.timeOtherSize,name:'其他'}
                                    ];
                                });
                            }
                        })
                    }else{
                        layer.msg(res.message ? res.message : '网络错误，请稍后重试', {time: 1000});
                    }
                }
            });
            var finishedAssignment = echarts.init(document.getElementById("finishedAssignment"));
            var option = {
                tooltip: {},
                title: {
                    textStyle: {
                        color: "#333",
                        fontSize: 18,
                        fontWeight: 'normal',
                        fontFamily: 'ArialMT'
                    },
                    text:'\t 22',
                    itemGap: 2,
                    subtext: '完成任务',
                    subtextStyle: {
                        color: "#999",
                        fontSize: 12,
                        fontFamily: "microsoft yahei"
                    },
                    top: 54,
                    left: 75,
                    fontSize: "14px"
                },
                textStyle: {
                    color: '#666',
                    fontFamily: 'microsoft YaHei',
                    fontSize: '12'
                },
                legend: {
                    orient: 'vertical',
                    left: 198,
                    top: 20,
                    itemGap: 8,
                    itemWidth: 8,
                    itemHeight: 8,
                    textStyle: {
                        color: '#666',
                        fontFamily: 'microsoft YaHei',
                        fontSize: '12'
                    },
                    // data:['按期完成','提前完成','延期完成','其他']
                    //修改右边标题图标为小圆
                    data: [
                        {name: '按期完成', icon: 'circle'},
                        {name: '提前完成', icon: 'circle'},
                        {name: '延期完成', icon: 'circle'},
                        {name: '其他', icon: 'circle'}
                    ]
                },
                color: ['#16A1E1', '#96E086', '#FF9391', '#ADC6E9'],
                animation: false,
                series: {
                    type: 'pie',
                    radius: ['41.83%', '62.75%'],//圆环大小
                    center: [103, 74],//圆心位置
                    avoidLabelOverlap: false,
                    label: {
                        normal: {
                            show: false,
                        }
                    },
                    data:[
                        {name: '按期完成', value: 1},
                        {name: '提前完成', value: 2},
                        {name: '延期完成', value: 3},
                        {name: '其他', value: 4}
                    ]
                }
            };
            finishedAssignment.setOption(option);
        };

        //加载任务详情表
        assign.loadAssignmentAnalysis = function () {
            var param = [
                {
                    repName: "getCompletedTaskDetail",
                    repCondition: {
                        where: [
                            {name: "uesr_id", oper: "eq", value:userInfo.userId},
                            {name: "task_status", oper: "eq", value: 1},
                            {name:"DATE_FORMAT(complete_time,'%Y-%m')",oper:"moreeq",value:'2016-01'},
                            {name:"DATE_FORMAT(complete_time,'%Y-%m')",oper:"lesseq",value:'2017-02'}
                        ]
                    }
                }
            ];
            assign._ajax({
                type: "post",
                url: "/worksheet/report.json",
                data: { rep : JSON.stringify(param) },
                token: assign.getParameter().token,
                dataType: "json",
                error: function (status) {
                    console.log(status);
                },
                success: function (res) {
                    console.log(res);
                    if(res.code == 1){
                        var detailList = [];
                        $.each(res.data, function (index, value) {
                            if(value['repName'] == "getCompletedTaskDetail"){
                                if(value['repResult'] != null){
                                    detailList = value['repResult'];
                                    $('.finishedAssignmentDetails tbody').html(template('assignmentDetailsTable',{ data: detailList }));
                                } else{
                                    detailList = [];
                                    $('.finishedAssignmentDetails tbody').html('暂无数据');
                                }
                            }
                        });

                    }else{
                        layer.msg(res.message ? res.message : '网络错误，请稍后重试', {time: 1000});
                    }
                }
            });

        }();

        // function getRepResult( data, name ){
        //     var result;
        //     $.each(data, function (index, value) {
        //         if( value['repName'] == name ){
        //             result = value["repResult"];
        //         }
        //     });
        //     return result;
        // }
        return assign;

    });