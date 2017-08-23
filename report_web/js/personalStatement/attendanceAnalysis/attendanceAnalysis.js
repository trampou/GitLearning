/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：考勤里面带薪假期页面渲染和基本交互的实现
 */
define(["JQuery","layer","baseclass","bootstrapDateTimePicker","bs-datetimepicker_zh-CN","config","moment","fullCalendar"],function($, layer, baseclass ){
    var attendanceAnalysis = inherit(baseclass.prototype);
    var userToken = attendanceAnalysis.getParameter().token;
    var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));/*查看的那个人的相关信息*/
    var userId = attendanceAnalysis.getParameter().userId; /*300*//**/;/*这是当前登录的用户的id*/
    var companyId = attendanceAnalysis.getParameter().companyId;
    var workFrequency = ["first","second","third","fourth","fifth"]; /*排班制要用到的五个类*/
    var workFrequencyClass = {0:['aStart',"aEnd","aArea"],
                              1:['bStart',"bEnds","bArea"],
                              2:['cStart',"cEnd","cArea"],
                              3:['dStart',"dEnd","dArea"],
                              4:['eStart',"eEnd","eArea"]};  /*对应各个排班制的类名*/
    var now = '';  /*从系统请求到的现在的时间*/
    var url = "/worksheet/report.json";/*报表的请求地址*/
    var globalDate;  /*给自己的时间，在得到系统时间后会赋值，然后在用户选择时间后会重新赋值*/
    var globalDateTwo; /*给后台的时间，在得到系统时间后会赋值，然后在用户选择时间后会重新赋值*/
    /*var globalRepCondition;*//*配置的请求参数，首次赋值是得到系统时间后，然后用户选择时间后再次请求也是用的这个配置参数，所以放在最外面，用户选择时间后是肯定已经有值了的。*/
    /*初始化页面*/
    attendanceAnalysis.init = function(){
        /*先请求得到时间，然后再请求数据渲染页面*/
        attendanceAnalysis._ajax({
            url:"/worksheet/getTime.json",
            success:function(response){
                /*console.info(response);*/
                var month;
                if(response.data.time.month <10){
                    month = "0"+response.data.time.month;
                }
                var day;
                if(response.data.time.day<10){
                    day = "0"+response.data.time.day;
                }
                now = response.data.time.year+"-"+month;
               globalDate = response.data.time.year+"-"+month+"-"+day;  /*传给自己的函数*//*response.data.time.year+"-"+month+"-"+day*/
                globalDateTwo = response.data.time.year+"-"+month;  /*globalDate.substr(0,4)+"-"+globalDate.substr(5,2)*//*传给后台*/

                /*配置请求数据所需要的参数*/
                var globalRepCondition = configure(globalDateTwo);

                requestData(url,globalRepCondition,globalDate);
            }
        });

        /*公共的头部导航*/
        attendanceAnalysis.navigation_top({
            id: 'navigation',
            pageUrl: './attendanceAnalysis.html?token=' + userToken+'&userId='+userId+'&companyId='+companyId,
            pageName: '考勤统计'
        });
        /*添加查看的那个人的名字*/
        var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
        $('#cl_index_wrap .navigation_block').append(html);
        if(sessionStorage.getItem('isPCWeb') == 'false'){
            $('#cl_index_wrap .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
        }
    };

    /*配置请求参数*/
    function configure(dataTwo){
        var repData =[{
            repName:"getAttendanceTeamInfo",
            repCondition:{
                where:[
                    {name:"user_id",oper:"eq",value:userInfo.userId}
                ]
            }
        },
            {
                repName:"getAttendancePlan",
                repCondition:{
                    where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"DATE_FORMAT(work_day,'%Y-%m')",oper:"eq",value:dataTwo}
                    ]
                }
            },
            {
                repName:"getAttendanceOverView",
                repCondition:{
                    where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"dt_month",oper:"eq",value:dataTwo}
                    ]
                }
            },
            {
                repName:"getAttendanceDetail",
                repCondition:{
                    where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"DATE_FORMAT(dt_date,'%Y-%m')",oper:"eq",value:dataTwo}
                    ]
                }
            },
            {
                repName:"getAttendanceStartDate",
                repCondition:{
                    where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId}
                    ]
                }
            }
        ];
        repData = JSON.stringify(repData);
        return repData;
    }

    /*请求数据*/
    function requestData(url,repCondition,date){
        console.info(url);
        attendanceAnalysis._ajax({
            url:url,
            type:"post",
            data:{"rep":repCondition},
            token:userToken,
            dataType:"json",
            success:function(response){
                /*console.info(response);*/
                var startDateInfoCon = response.data.filter(function(index){   /*装每天打卡状态的容器*/
                    return (index['repName'] == 'getAttendanceStartDate');
                });
                selectMonth(startDateInfoCon,now,date);  /*得到系统时间了才会调用这个函数，所以这个时候now肯定是有值了的*/
                var headerInfoCon = response.data.filter(function(index){  /*装考勤组信息的容器*/
                    return (index['repName'] == 'getAttendanceTeamInfo');
                });
                attendanceHeader(headerInfoCon,date);
                var planInfoCon = response.data.filter(function(index){  /*装排班日历的容器*/
                    return (index['repName'] == 'getAttendancePlan');
                });
                attendancePlan(planInfoCon,date);
                var overviewInfoCon = response.data.filter(function(index){   /*装月的考勤总览的容器*/
                    return (index['repName'] == 'getAttendanceOverView');
                });
                attendanceOverview(overviewInfoCon,date);
                var dayInfoCon = response.data.filter(function(index){   /*装每天打卡状态的容器*/
                    return (index['repName'] == 'getAttendanceDetail');
                });
                attendanceDay(dayInfoCon,date);
            },
            error:function(response){
                console.info(response);
                console.info("请求整张报表出错。");
            }
        });

    }

    /*配置用户可选的下拉框*/
    function selectMonth(response,now,sendDate){  /*now是现在的月份，sendDate是展示的时间。可以是现在月份，也可能是用户选择的月份*/
        if(response[0]['repResult']){/*判断月份要不要出现下拉框,没有截止时间是null。*/
            /*有时间以后还要判断这个时间是不是本月，如果是本月也没有下拉框*/
            var startDate = response[0]['repResult'].value;
            var startYear = Number(startDate.substr(0,4)); /*开始年份*/
            var endYear = Number(now.substr(0,4));  /*结束年份*/                    /*配置默认时间用这个，不行，用户选择月份后重新渲染不能用这个，只能用request函数的参数date*/
            var startMonth = Number(startDate.substr(5,2));  /*开始那年的开始月份*/
            var endMonth = Number(now.substr(5,2));    /*结束那年的结束月份*/        /*配置默认时间用这个*/
            var obj = {};  /*放每一年的开始月份*/
            obj[startYear] = startMonth;
            for(var i = startYear+1; i <endYear+1; i++){
                obj[i] = 1 ;
            }
            var objEnd = {};/*放每一年的结束月份*/
            for(var i = startYear; i <endYear; i++){
                objEnd[i] = 12 ;
            }
            objEnd[endYear] = endMonth;
            for(var i = endYear ; i>startYear-1 ; i--){
                for(var j = objEnd[i] ; j > obj[i]-1 ; j--){
                    if(j<10){
                        j="0"+j;
                    }
                    $('.cl_chooseMonthTip').append('<p>'+i +"年"+ j +"月"+'</p>');
                }
            }
            /*选择月份的箭头是否出现*/
            if(endYear==startYear && startMonth==endMonth){ /*开始时间和结束时间是同年同月的，就只有一个月，就不需要出现选择月份的箭头*/
                $('.cl_index_content_headerOne>div').eq(0).append('<span>'+sendDate.substr(0,4)+"年"+sendDate.substr(5,2)+"月"+'</span><span></span>');
            }else{
                $('.cl_index_content_headerOne>div').eq(0).append('<span>'+sendDate.substr(0,4)+"年"+sendDate.substr(5,2)+"月"+'</span><span class="cl_index_down_arrow"></span>');
            }
        }else{
            $('.cl_index_content_headerOne>div').eq(0).append('<span>'+sendDate.substr(0,4)+"年"+sendDate.substr(5,2)+"月"+'</span><span></span>');
        }
    }

    /*考勤信息头部渲染*/
    function attendanceHeader(response,sendDate){
        var dataCon = response[0]['repResult'];
        if(dataCon == null){
            console.info('相关考勤组信息为null');
            return ;
        }
        $('.cl_index_content_headerOne>div:last').append('<span>所属考勤组名称：</span><span>'+dataCon['teamName']+'</span><span>类型：</span>');
        if(dataCon['type'] == 'fixed'){   /*固定班制*/
            $('.cl_index_content_headerOne>div:last').append('<span>固定班制</span>');
        }else if(dataCon['type'] == 'plan'){  /*排班制*/
            $('.cl_index_content_headerOne>div:last').append('<span>排班制</span> <span class="cl_index_exclamationMark"></span>');
            /*班次信息数组*/
            var workFrequencyArray = dataCon['groupClassTime'].split(',');
            // console.info(workFrequencyArray);
            for(var i = 0; i < workFrequencyArray.length ; i++){
                var frequencyName = workFrequencyArray[i].substr(0,workFrequencyArray[i].indexOf(":")-3);/*减去3是冒号前面有两位数是小时，有一位是空格*/
                // console.info(frequencyName);
                $('#myCalendar>header>table>tbody>tr').append('<td class="'+workFrequency[i]+'">'+frequencyName+'</td>');
                var startHour = workFrequencyArray[i].substr(workFrequencyArray[i].indexOf(":")-2,5);/*冒号前面两位就是小时*/
                var endHour = workFrequencyArray[i].substr(workFrequencyArray[i].indexOf("-")+1);/*横杠后面一位就是分钟*/
                $('#dataContainer').append('<span data-start-hour="'+startHour+'" data-end-hour="'+endHour+'">'+frequencyName+'</span>'); /*对应班次的时间段放在自定义属性这，鼠标移上去就去取。*/
            };
        };
        if(dataCon['groupUserName']){  /*如果有勤组负责人*/
            $('.cl_index_content_headerOne>div:last').append('<span>考勤组负责人：</span> <span>'+dataCon['groupUserName']+'</span>');
        }else{
            $('.cl_index_content_headerOne>div:last').append('<span>考勤组负责人：</span> <span>无</span>');
        }
    }

    /*排班制日历*/
    function attendancePlan(planInfoCon,sendDate){
        $('#datetimepicker').datetimepicker({
            language:"zh-CN",
            initialDate:sendDate  /*初始化日历的日期*/
        });
        /*最前面一排如果全是下上一个月份的时间也需要全部删除掉*/
        var dateTargetEle = $('.datetimepicker-days table tbody tr:first').children();
        var dateTargetEleMarkFirst = 0 ;/*记录第一排为上一个月份的总数*/
        $.each(dateTargetEle,function(index){
            var ele = dateTargetEle[index];
            if($(ele).hasClass('old')){
                dateTargetEleMarkFirst +=1;
            }
        });
        if(dateTargetEleMarkFirst == 7){
            $('.datetimepicker-days table tbody tr:first').remove();
        }
        /*最后一排如果全是下一个月份的时间就删除掉*/
        var dateTargetEle = $('.datetimepicker-days table tbody tr:last').children();
        var dateTargetEleMark = 0 ;/*记录最后一排为下一个月份的总数*/
        $.each(dateTargetEle,function(index){
            var ele = dateTargetEle[index];
            if($(ele).hasClass('new')){
                dateTargetEleMark +=1;
            }
        });
        if(dateTargetEleMark == 7){
            $('.datetimepicker-days table tbody tr:last').remove();
        }

        /*渲染日历上的颜色*/
        var planCon = planInfoCon[0]['repResult'];
        if(planCon == null){
            console.info('排班制日历为null。');
            return;
        }else if(planCon.length == 0){
            console.info('排班制日历数组长度为0。');
            return;
        }
        var classNameArray = {};/*一个班次对应哪几天*/
        $.each(planCon,function(index){
            var dayDate = planCon[index]['workDay'].substr(8,2);/*工作日期的日期，不需要年月，只要日*/
            if(dayDate.charAt('0') == 0){
                dayDate = dayDate.substr(1); /*第一个字符是0，就只取后面的字符*/
            }
            classNameArray[planCon[index]['className']] += dayDate+",";
        });
        var workFrequencyCount =-1; /*用于取出对应排班制的数组里的类名*/
        $.each(classNameArray,function(v){
            workFrequencyCount+=1;
            /*排班制对应的对象*/
            var wFI = classNameArray[v].split(',');     /*当前这个v排班班次名字对应的工作日期范围数组的索引*/
            wFI.splice(0,1,wFI[0].substr(9));
            wFI.pop();/*清除最后一个空字符串*/
            for(var d = 0 ; d< wFI.length ;  d++){
                /*console.info(wFI[d]);*/  /*是字符串啊，怪不得比较的时候8会比10大*/
                for(var x =d+1 ; x < wFI.length ;x++){
                    if(Number(wFI[d])>Number(wFI[x])){  /*最小的排最前面*/
                        var temp = wFI[x];
                        wFI[x] = wFI[d];
                        wFI[d] = temp;
                    }
                   /* console.info(wFI);*/
                };
            }
            /*console.info(wFI);*/
            var obj = {};  /*把装一个班次的所有天数的大数组拆成装着连续时间段的小数组*/
            var initialNumber = 0;

            getTimeQuantum(initialNumber,wFI,obj);
            function getTimeQuantum(init,wFI,test){  /*得到时间段*/
                test[init] = new Array();
                for(var m = init ; m < wFI.length ;m++){
                    /*函数直接执行到这里的，所以在这里面判断，如果这个数组只有一天，就直接一个圆圈圈就好了*/
                    var count = 0 ;
                      $.each(test,function(t){  /*即使已经得到结果了还会继续执行函数。参数为上一次执行的值，因为上一次已经分割完了，所以上一次test对象的数组里数的总数和进行分割之前的数组的长度是一样的*/
                     count+= test[t].length;
                     });
                     if(count == wFI.length){
                     return;
                     }
                    test[init].push(wFI[m]);
                    if(Number(wFI[m])+1 != wFI[m+1] && wFI[m+1] != undefined){  /*上一个的值加1不等于下一个的值，说明上一个和下一个是不连续的，也就是这个班次有多个时间段*/
                        initialNumber = m+1;
                        getTimeQuantum(initialNumber,wFI,test);
                    }
                }
            }
           /* console.info(obj);*/

            $.each(obj,function(n){
                console.info(obj[n]);
                var target = obj[n];/*当前班次的连续的时间段数组，如果这个数组只有一个天数，就去掉背景的颜色，只要背景图片*/
                var targetEle = $('.datetimepicker-days .table-condensed tbody td');/*日历上所有的单元格*/

                    var wfStartDate = Number(target[0]);       /*当前班次的工作时间范围的第一天*/
                    var wfEndDate = Number(target[target.length-1]);      /*当前班次的工作时间范围的最后一天*/
                    $.each(targetEle,function(n){
                        var mark = Number($(targetEle[n]).text());  /*Datetimepicker上面的日期*/
                        /* console.info(mark);*/
                        var status = $(this).hasClass('new');  /*Datetimepicker上面的日期有这个类就不是这个月的*/
                        var statusOld = $(this).hasClass('old');
                        if(status == false && statusOld == false && target.length > 1){
                            if(mark == wfStartDate){  /*班次的第一天*/
                                var c = workFrequencyClass[workFrequencyCount][0];
                                /*$(this).addClass('aStart');*/
                                $(this).addClass(c);
                            }else if(mark == wfEndDate){  /*班次的最后一天*/
                                var c = workFrequencyClass[workFrequencyCount][1];
                                /*$(this).addClass('aEnd');*/
                                $(this).addClass(c);
                            }else if(mark>wfStartDate && mark<wfEndDate){    /*班次的中间天数*/
                                var c = workFrequencyClass[workFrequencyCount][2];
                                /*$(this).addClass('aArea');*/
                                $(this).addClass(c);
                            }
                        }else if(status == false && statusOld == false && target.length == 1){
                            if(mark == Number(target[0])){  /*班次的第一天*/
                                var c = workFrequencyClass[workFrequencyCount][0];
                                /*$(this).addClass('aStart');*/
                                $(this).addClass(c);
                                $(this).css('backgroundColor','transparent');/*把背景色去掉,会影响到所有用了这个类的元素*/
                            }
                        }
                    });
            });

        });
    }

    /*考勤信息月份总览*/
    function attendanceOverview(response){
        var overViewInfoContainer = response[0]['repResult'][0];
        if(overViewInfoContainer == null){
            layer.msg('暂无相关考勤统计信息。');
            return;
        }
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['lateTimes']+"次"+'</td>');/*迟到次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['leaveTimes']+"次"+'</td>');/*早退次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['absencesTimes']+"天"+'</td>'); /*旷工次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['recordTimes']+"次"+'</td>');/*漏打卡次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['workOutTimes']+"次"+'</td>');/*外勤次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['outTimes']+"次"+'</td>'); /*外出次数*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['businessDay']+"天"+'</td>'); /*出差0天*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['appendWorkMinutes']+"h"+'</td>'); /*加班h*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['rest']+"天"+'</td>'); /*休假几天*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['budegetWorkDay']+"天"+'</td>'); /*应出勤几天*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['workDay']+"天"+'</td>'); /*实际出勤几天*/
        $('.cl_index_content_table>table>tbody>tr:last').append('<td>'+overViewInfoContainer['workMinutes']+"h"+'</td>'); /*工作时长h*/
        $('#dataContainer').append('<span class="lateMinutes">'+overViewInfoContainer['lateMinutes']+'</span>'); /*迟到多少分钟*/
        $('#dataContainer').append('<span class="leaveMinutes">'+overViewInfoContainer['leaveMinutes']+'</span>');/*早退多少分钟*/
        $('#dataContainer').append('<span class="paymentHoliday">'+overViewInfoContainer['paymentHoliday']+'</span>'); /*带薪假多少天*/
        $('#dataContainer').append('<span class="noPaymentHoliday">'+overViewInfoContainer['noPaymentHoliday']+'</span>'); /*常规假多少天*/
    }

    /*考勤信息月份详情的总览*/
    function attendanceDay(response,sendDate){
        var eventsData = [];
        if(response[0]['repResult'] == null){
            layer.msg('暂无相关考勤打卡详情信息。');
            console.info('每天的打卡信息为null。');
            fullCalendarPaint(sendDate,$('#calendar').fullCalendar({
                header:false,
                defaultDate: sendDate/*用户自己选择的月份*/
            }));
            return;
        }
        $.each(response[0]['repResult'],function(v){
            var infoContainer = response[0]['repResult'][v];
            /*var data_item = '';*/
            var informalMarkCount = 0 ;  /*每一天的五种情况的出现总数*/
            var clockStatus = infoContainer['classStartStaturs'].split(',');  /*打卡状态字符串转成数组,用于筛选出五种打卡状态*/
            clockStatus.pop();  /*最后一个总为空字符串，所以删掉*/
            /*clockStatus.splice(clockStatus.length-1,1);*/  /*意思是删掉最后一个。但总是不行,每次然而只剩最后那个空字符串了*/
            var clockStatusTwo  = infoContainer['classStartStaturs'].split(','); /*用于保存普通的打卡时间*/
            var clockTime = infoContainer['classStartTime'].split(',');  /*打卡时间点字符串转成数组*/
            /*console.info(clockStatus);*/
            var statusObj = {};/*放那五种特殊的打卡状态*/
            var outMark = Number(infoContainer['outTimes']); /*这个字段代表外出，只要值大于0，就代表外出了*/
            for(var index in clockStatus){
                clockStatus[index] = clockStatus[index].substr(0,2);/*因为请假是以13开头,后面数字不确定，所以直接只截前面两位*/
                for(var d = Number(index)+1 ; d<clockStatus.length ;d++){
                    clockStatus[d] = clockStatus[d].substr(0,2);/*因为请假是以13开头,后面数字不确定，所以直接只截前面两位*/
                    if(clockStatus[index] == clockStatus[d]){
                        clockStatus.splice(d,1);
                    }
                }/*删除重复的打卡类别，比如两次打卡都是迟到，我只要次数为一次就好*/
                if(clockStatus[index] != "2" && clockStatus[index] != "3" && clockStatus[index] != "10" && clockStatus[index] != "8" &&clockStatus[index] != "9" &&clockStatus[index] != "12" && clockStatus[index] != "13"&&clockStatus[index] != "15"&&clockStatus[index] != "16"&&clockStatus[index] != "17"&&clockStatus[index] != "18"&&clockStatus[index] != "19"&&clockStatus[index] != "20"){
                    clockStatus.splice(index,1);   /*不是五种情况以内的都删除，这样下面判断类名的时候依据的情况的数量就只有这五种情况的可能了,这里没包括外出*/
                }

            }/*确保是在五种情况以内*/
            console.info(clockStatus);
            for(var i = 0 ; i < clockStatusTwo.length-1; i++){  /*这是循环的普通的打卡数组，以天为单位，一天可以打很多次卡，这些打卡数据都需要的*/
                var classname = '';  /*每一种情况对应一种类名*/
                var markTitle = '';  /*每一种情况的中文名*/
                clockStatusTwo[i] = clockStatusTwo[i].substr(0,2);/*因为请假是以13开头,后面数字不确定，所以直接只截前面两位*/
                /*console.info(clockStatus[i]);*/
                if(clockTime[i]!=0){   /*打卡时间为0是漏打卡，存储所有有打卡时间的*/
                    var hour = clockTime[i].substr(8,2);  /*截出打卡的小时*/
                    var min = clockTime[i].substr(10,2);    /*截出打卡的分钟*/
                    var dataDate  = hour+":"+min;
                    $('#dataContainer').append('<span class="'+infoContainer['date']+'" data-date="'+dataDate+'">'+clockStatusTwo[i]+'</span>');
                }
                /*clockStatusTwo是没有去掉重复和不在五种状态里的，所以在这里判断长度依据是去重和排外过的clockStatus*/
                clockStatus.length += outMark; /*长度还要加上外出的情况，比如迟到和外出一起存在，就是两个情况了，那迟到的类名就不能用只有一个的*/
                if(clockStatus.length == 1){  /*情况只有一种的类名*/
                    switch(clockStatusTwo[i]){
                        case "2": classname = "lateJustOne",markTitle='迟到'
                            break;
                        case "3": classname = "beforeJustOne",markTitle='早退'
                            break;
                        case "10": classname = "overtimeJustOne",markTitle='加班'
                            break;
                        case "17": classname = "overtimeJustOne",markTitle='加班'
                            break;
                        case "18": classname = "overtimeJustOne",markTitle='加班'
                            break;
                        case "8": classname = "non_attendanceJustOne",markTitle='旷工'
                            break;
                        case "9": classname = "businessJustOne",markTitle='外勤'
                            break;
                        case "15": classname = "businessJustOne",markTitle='外勤'
                            break;
                        case "16": classname = "businessJustOne",markTitle='外勤'
                            break;
                        case "12": classname = "businessJustOne",markTitle='出差'
                            break;
                        case "19": classname = "businessJustOne",markTitle='出差'
                            break;
                        case "20": classname = "businessJustOne",markTitle='出差'
                            break;
                        case "外出": classname = "businessJustOne",markTitle='外出'
                            break;
                        case "13": classname = "vacationJustOne",markTitle='休假'
                            break;/*这里没有break的话，会接着执行下面的，所以每次休假最后都变成了normal*/
                        default:classname = "normal"  /*还有其他很多状态，但是通通不用展示，所以统一用这个类名表示*/
                            break;
                    }
                }else  if(clockStatus.length >1){   /*情况有多种*/
                    switch(clockStatusTwo[i]){
                        case "2": classname = "late",markTitle='迟到'
                            break;
                        case "3": classname = "before",markTitle='早退'
                            break;
                        case "10": classname = "overtime",markTitle='加班'
                            break;
                        case "17": classname = "overtime",markTitle='加班'
                            break;
                        case "18": classname = "overtime",markTitle='加班'
                            break;
                        case "8": classname = "non_attendance",markTitle='旷工'
                            break;
                        case "9": classname = "business",markTitle='外勤'
                            break;
                        case "15": classname = "businessJustOne",markTitle='外勤'
                            break;
                        case "16": classname = "businessJustOne",markTitle='外勤'
                            break;
                        case "12": classname = "business",markTitle='出差'
                            break;
                        case "19": classname = "business",markTitle='出差'
                            break;
                        case "20": classname = "business",markTitle='出差'
                            break;
                        case "外出": classname = "business",markTitle='外出'
                            break;
                        case "13": classname = "vacation",markTitle='休假'
                            break;
                        default:classname = "normal"
                            break;
                    }
                }

                if(classname != "normal" && classname != ""){  /*为空数组的时候都没有执行上面那些步骤就直接跳到这里来了，所以就会出现给日历插件加入了空字符串元素*/
                    statusObj[markTitle] = classname;
                    informalMarkCount+=1;
                }
            }
            $.each(statusObj,function(s){
                eventsData.push({
                    "title":s,
                    "start":infoContainer['date'],
                    "className":statusObj[s]
                });
            })

           /* console.info(statusObj);*/
            /*这是循环的外出打卡的时间段，外出打卡是单独的字段*/

            if(outMark > 0 ){   /*大于0就是外出了,把对应的打卡时间放入隐藏的数据元素里面去*/
               var outTimesClockArray = infoContainer['outInWorkTimes'].split(',');
              $.each(outTimesClockArray,function(o){
                  /*console.info('外出的时间点'+outTimesClockArray[o]);*/
                  var outHour = outTimesClockArray[o].substr(11,2);  /*截出打卡的小时*/
                  /*console.info("外出的小时:"+outHour);*/
                  var outMin = outTimesClockArray[o].substr(14,2);    /*截出打卡的分钟*/
                  /*console.info("外出的分钟:"+outMin);*/
                  /*console.info('那一天对应的时间'+infoContainer['date']);*/
                  var outDataDate  = outHour+":"+outMin;
                  $('#dataContainer').append('<span class="'+infoContainer['date']+'" data-date="'+outDataDate+'">外出</span>');
              });
               /*console.info(outTimesClockArray);*/
               /*判断外出的类名*/
               var outClassName;
               if(informalMarkCount>0){  /*如果这一天五种情况在上面已经出现了任何一种，那么外出的类名都不能是justOne的那个*/
                   outClassName = "business";
               }else if(informalMarkCount == 0){
                   outClassName = "businessJustOne";
               }
                eventsData.push({
                    "title":"外出",
                    "start":infoContainer['date'],
                    "className":outClassName
                });
            }
        });

        var full_initial_date = sendDate.substr(0,4)+"-"+sendDate.substr(5,2)+"-01";
        fullCalendarPaint(full_initial_date,$('#calendar').fullCalendar({
            header:false,
            defaultDate: full_initial_date,/*用户自己选择的月份*/
            events:function(start,end,timezone,callback){
                callback(eventsData);
            },
            eventMouseover:function(){
                /*console.info($(this).attr('data-date'));*/
            },
            eventRender: function(event, element) {   /*自己控制元素*/
                element.attr('data-date',event.start._i);
            }
        }));
    }

    /*打卡悬浮层*/
    function clockLayer(that,mark,eleWidth){
        var dataContainer = $('#dataContainer').children('.'+mark);
        var lengthMark =  dataContainer.length;
        /*如果不是五种状态就不用展示打卡数据了*/
       for(var c = 0 ; c< dataContainer.length ; c++){  /*先进行判断，如果这一天没有五种状态内的，就不需要执行下面的了*/
           var textMark = $(dataContainer[c]).text(); /*对应这一天的隐藏数据元素的考勤状态值*/
            if(textMark!="2"&&textMark!="3"&&textMark!="10"&&textMark!="8"&&textMark!="9"&&textMark!="12"&&textMark!="13"&&textMark!="外出"&&textMark!="15"&&textMark!="16"&&textMark!="17"&&textMark!="18"&&textMark!="19"&&textMark!="20"){
                /*dataContainer.length -=1;*/  /*这会影响循环里面的值，所以用另一个变量代替*/
                lengthMark -= 1;
            }
       }
       if(lengthMark> 0 ){  /*代表这一天有打卡数据*/
            /*先判断这个浮层是不是已经出现了，如果已经出现了就不必再执行这个函数了没，不然会造成闪的厉害的情况*/
            var markTop = that.parent().parent().parent().parent().parent().offset().top+28;/*当前日期最大单元格距离上面的偏移量*/
            var targetTop = getLastIndexOf($('#clockDataLayer').css('top'),"px");/*这个浮层现在的距离*/
            var markLeft = that.offset().left+eleWidth;
            var targetLeft = getLastIndexOf($('#clockDataLayer').css('left'),"px");/*同一行不同单元格的top是一样的，所以还要判断left*/
            var status = $('#clockDataLayer').css('display');
            if(markTop == targetTop && markLeft == targetLeft && status=="block"){   /*如果相等，就是浮层已经出现了，就不需要做什么了，*/

            }else{
                $('#clockDataLayer').empty();/*先清空之前的*/
                var clockDataArray = [];/*打卡时间点是放在元素自定义属性上的，因为需要对打卡时间进行排序，所以需要抽出所有的打卡时间点*/
                /*收集打卡时间点*/
                $.each(dataContainer,function(da){
                    clockDataArray.push($(dataContainer[da]).attr('data-date'));
                });
                /*排序*/
                console.info(dataContainer);
                console.info(clockDataArray);
                for(var a = 0 ; a< clockDataArray.length ;a++){
                    for(var b = a+1; b < clockDataArray.length ; b++){
                        if(clockDataArray[a] > clockDataArray[b]){  /*大的往后面排*/
                            var temp = clockDataArray[a];
                            clockDataArray[a] = clockDataArray[b];
                            clockDataArray[b] = temp;
                            /*console.info(dataContainer[a]);*/
                            var tempTwo = dataContainer[a];
                            dataContainer[a] = dataContainer[b];
                            dataContainer[b] = tempTwo;
                        }
                    }
                }
                console.info(clockDataArray);
                for(u = 0 ; u < dataContainer.length ; u++ ){   /*jquery对象不能直接用var in，因为有别的参数在里面*/
                    /* console.info($(dataContainer[u]).attr("data-date"));*/
                    /*配置当天的打卡数据浮层*/
                    if($(dataContainer[u]).text() == '2'){
                        $('#clockDataLayer').append('<span class="late" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '3'){
                        $('#clockDataLayer').append('<span class="before" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '10' || $(dataContainer[u]).text() == '17' || $(dataContainer[u]).text() == '18'){
                        $('#clockDataLayer').append('<span class="overtime" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '8'){
                        $('#clockDataLayer').append('<span class="non-attendance" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '9' || $(dataContainer[u]).text() == '15' ||$(dataContainer[u]).text() == '16'){
                        $('#clockDataLayer').append('<span class="out" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '12' || $(dataContainer[u]).text() == '19' || $(dataContainer[u]).text() == '20'){
                        $('#clockDataLayer').append('<span class="out" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '外出'){
                        $('#clockDataLayer').append('<span class="out" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else if($(dataContainer[u]).text() == '13'){
                        $('#clockDataLayer').append('<span class="vacation" >'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }else{
                        $('#clockDataLayer').append('<span>'+$(dataContainer[u]).attr("data-date")+'</span>');
                    }
                    /*console.info(that);*/
                    var height = that.parent().parent().parent().parent().parent().offset().top+28;/*反正浮层总是在标题那下面*/
                    var left = that.offset().left+eleWidth;
                    $('#clockDataLayer').css({"left":left,"top":height,"display":"block"});
                }
            }
        }
    }

    /*日历去掉不是这个月的元素后要改变高度*/
    function changeFullCalendarHeight(){
        var countHeight = getLastIndexOf($('.fc-scroller').css('height'),"px"); /*总高度*/
        var singleHeight = getLastIndexOf($('.fc-day-grid').children().first().css('height'),"px");/*单行高度*/
        var currentHeight = countHeight - singleHeight; /*总高度上要减去去掉的这一行的高度得到最后高度*/
        $('.fc-bg').parent().parent().parent().css('height',currentHeight);
    }

    /*打卡日历没有数据的时候也得渲染，所以直接把公用的这些写成了函数*/
    function fullCalendarPaint(date,initFn){   /*日历的渲染*/
        var full_initial_date = date;
        initFn;
        /*令单元格的title属性值为空*/
        $('.fc-title').attr('title','');

        /*判断日历的第一行所有单元格显示的是不是当前这个月份的日期*/
        var currentDateMarkTwo = 0; /*默认第一排的日期都是当前用户选择的月份*/
        var waitCompare = full_initial_date.substr(0,7);  /*如2017-03*/
        $.each($('.fc-bg:first td'),function(){
            var fcFirstDate = ($(this).attr('data-date')).substr(0,7); /*第一排每个单元格代表的日期,如2017-03*/
            if(fcFirstDate != waitCompare){
                currentDateMarkTwo += 1;
            }
        });
        if(currentDateMarkTwo == 7){
            $('.fc-bg:first').parent().remove();
            changeFullCalendarHeight();
        }

        /*判断日历的最后一行所有单元格显示的是不是当前这个月份的日期*/
        var currentDateMark = 0; /*默认最后一排的日期都是当前用户选择的月份*/
       /* var waitCompare = full_initial_date.substr(0,7);*/
        $.each($('.fc-bg:last td'),function(){
            var fcLastDate = ($(this).attr('data-date')).substr(0,7); /*最后一排每个单元格代表的日期*/
            if(fcLastDate != waitCompare){
                currentDateMark += 1;
            }
        });
        if(currentDateMark == 7){   /*如果currentDateMark为7，代表最后一行的单元格全都不是用户设置的当前月份，就要令其消失*/
            $('.fc-bg:last').parent().remove();
            changeFullCalendarHeight();
        }
    }


    /*页面交互事件*/
    attendanceAnalysis.events = function(){
        /*点击页面其他地方都要消失的组件就写在这里*/
        $(':root').on("click",function(){
            $('.cl_cmt_wrap').css("display","none");
            $('#controlCalendarShow').css({"display":"none"});
        });

        /*用户选择月份的箭头*/
        $('.cl_index_content_headerOne').on('click',".cl_index_down_arrow",function(e){
            e.stopPropagation();
            var status = $('.cl_cmt_wrap').css('display');
            if(status == "none"){
                /*先判断有没有数据，没有数据就不显示了*/
                var childrenEle = $('.cl_chooseMonthTip').children().length; /*如果子元素长度为0，则说明没有其他月份*/
                if(childrenEle == 0){
                    return ;
                }
                var top = $(this).offset().top+18;
                var left = $(this).offset().left+10;
                $('.cl_cmt_wrap').css({"top":top,"left":left});
                $('.cl_cmt_wrap').slideDown();
            }else if(status == "block"){
                $('.cl_cmt_wrap').slideUp();
            }
            /*在点击这个时有可能排班制日历出现了，但并没有消失，所以这里要令其消失，目前没找到更好的办法*/
            $('#controlCalendarShow').css({"display":"none"});
        });
        /*下拉框的事件*/
        $('.cl_cmt_wrap').on({
            "mouseenter":function(){
                $(this).addClass("cl_cm_default");
            },
            "mouseleave":function(){
                $(this).removeClass("cl_cm_default");
            },
            "click":function(){
                var chooseDate = $(this).text();
                var date = chooseDate.substr(0,4)+"-"+chooseDate.substr(5,2)+"-"+"01";
                /*局部更新数据*//*先清空容器内的原有数据，然后再渲染*/
                $('.cl_chooseMonthTip').empty();/*可选月份提示层*/
                $('.cl_index_content_headerOne>div').empty(); /*选择时间部分和考勤信息部分*/
                $('#myCalendar>header>table>tbody>tr').empty(); /*班次排班日历上面的班次名字*/
                /*$('#datetimepicker').empty();*//*班次排班的日历部分无效*/
                $('#datetimepicker').datetimepicker('remove');
                $('.cl_index_content_table>table>tbody>tr:last').empty();/*总览的表格的内容部分*/
                /*$('#calendar').empty();*//*打卡日历无效*/
                /*$('#calendar').removeClass('fc fc-unthemed fc-ltr');*//*打卡日历无效*/
                $('#cl_goldenrodyellow').empty();/*通用的米黄色背景提示层*/
                $('#clockDataLayer').empty(); /*通用的打卡时间段提示层*/
                $('#dataContainer').empty();  /*放数据的隐藏元素*/
                /*fullcalendar的goto方法，跳到某个日期去。就像datetimepicker的remove然后再初始化渲染一样。*/
                $('.cl_index_content_table').next().next().scrollTop(0); /*日历外面的滚动条还原*/
                $('#calendar').fullCalendar('gotoDate',date);
                globalDate = date;  /*给自己的用户选择的时间*/
                globalDateTwo = chooseDate.substr(0,4)+"-"+chooseDate.substr(5,2);  /*给后台的时间*/
                var globalRepCondition = configure(globalDateTwo);
                requestData(url,globalRepCondition,globalDate);
            }
        },"p");

        /*感叹号标志移上去就出现排班表日历*/
        $('.cl_index_content_headerOne').on({
            'mouseenter':function(e){
                e.stopPropagation();
                /*有可能用户点了选择月份的，但没有令下拉框收起来*/
                $('.cl_cmt_wrap').css("display","none");
                var left = $(this).offset().left;
                left = Number(left)-170;
                console.info(left);
                $('#myCalendar').css("left",left);
                $('#calendarMask').css("left",left);
                $('#controlCalendarShow').css({"display":"block"});
            }
        },".cl_index_exclamationMark");
        $('#controlCalendarShow').on('mouseleave',function(){   /*离开这个范围就让排班表日历消失*/
            $('#controlCalendarShow').css({"display":"none"});
        });

        $('#myCalendar header table tbody').on({    /*日历上面的班次名称，鼠标移上去就有时间提示浮层*/
            "mouseenter":function(){
                var mark = $(this).text();
                var that = $(this);
                $.each($('#dataContainer>span'),function(index){
                    if($(this).text() == mark){  /*班次名字对上了就取自定义属性里面的时间段数据生成提示框*/
                        var start = $(this).attr('data-start-hour');
                        var end = $(this).attr('data-end-hour');
                        $('#cl_calendar_goldenrodyellow').text(mark+"\t"+start+"-"+end);
                        var top = that.offset().top+40;
                        var left = that.offset().left-20;
                        $('#cl_calendar_goldenrodyellow').css({"display":"block","top":top,"left":left});
                    }
                });
            },
            'mouseleave':function(){
                $('#cl_calendar_goldenrodyellow').css({"display":"none"});
            }
        },"td");

        /*带薪假期详情跳转*/
        $('.cl_index_content_headerTwo>span:last').on('click',function(){
            window.location.href = "vacationStatus.html?token=" + userToken+'&userId='+userId+'&companyId='+companyId;
        });

        /*鼠标移到月份总览的单元格上时出现详细情况*/
        $('.cl_index_content_table>table>tbody').on({   /*总共迟到多少分钟*/
            "mouseover":function(){
                if($('#dataContainer>.lateMinutes').text()){  /*如果有数据就显示*/
                    $('#cl_goldenrodyellow').text("迟到"+$('#dataContainer>.lateMinutes').text()+"分钟");
                    var left = $(this).offset().left+20;
                    var top = $(this).offset().top+43;
                    $('#cl_goldenrodyellow').css({
                        "left":left,
                        "top":top,
                        "display":"block"
                    });
                };
            },
            "mouseleave":function(){
                $('#cl_goldenrodyellow').css({
                    "display":"none"
                });
            }
        },"#late");

        $('.cl_index_content_table>table>tbody').on({  /*总共早退多少分钟*/
            "mouseover":function(){
                if($('#dataContainer>.leaveMinutes').text()){
                    $('#cl_goldenrodyellow').text("早退"+$('#dataContainer>.leaveMinutes').text()+"分钟");
                    var left = $(this).offset().left+20;
                    var top = $(this).offset().top+43;
                    $('#cl_goldenrodyellow').css({
                        "left":left,
                        "top":top,
                        "display":"block"
                    });
                }
            },
            "mouseleave":function(){
                $('#cl_goldenrodyellow').css({
                    "display":"none"
                });
            }
        },"#before");

        $('.cl_index_content_table>table>tbody').on({  /*休假情况*/
            "mouseover":function(){
                if($(".paymentHoliday").text()){
                    $('#cl_goldenrodyellow').empty(); /*先清空之前的*/
                    $('#cl_goldenrodyellow').append('<span>带薪假'+$(".paymentHoliday").text()+"天"+'</span> <span>常规假'+$(".noPaymentHoliday").text()+"天"+'</span>');
                    var left = $(this).offset().left+20;
                    var top = $(this).offset().top+43;
                    $('#cl_goldenrodyellow').css({
                        "left":left,
                        "top":top,
                        "display":"block"
                    });
                }
            },
            "mouseleave":function(){
                $('#cl_goldenrodyellow').css({
                    "display":"none"
                });
            }
        },"#vacation");

        /*鼠标浮到每天的单元格上就显示那天的打卡信息,这是每天打卡状态下面的空白区域，还有打卡状态也要有，然后打卡状态上面的时间区域也需要*/
        $('#calendar').on({
            "mouseenter":function(){
                var mark = $(this).children().attr('data-date');/*只有日程的时间数据是在单元格的子元素上面*/
                var eleWidth = getLastIndexOf($(this).css('width'),"px")-112;
                clockLayer($(this),mark,eleWidth);
            }/*,
             'mouseleave':function(){
             $('#clockDataLayer').css({"display":"none"});
             }*/
        },'.fc-day-grid .fc-week table>tbody>tr>td');  /*日程在tbody里面*/
        $('#calendar').on({            /*表头在thead里面*/
            "mouseenter":function(){
                var mark = $(this).attr('data-date');
                var eleWidth = getLastIndexOf($(this).css('width'),"px")-108;
                clockLayer($(this),mark,eleWidth);
            },
            'mouseleave':function(){
                $('#clockDataLayer').css({"display":"none"});
            }
        },'.fc-day-grid .fc-week table>thead>tr>td');/*日期在thead里面,然后日期容器有一个padding，所以css获得width会少了那个padding的值,所以直接在这里少减去4px*/

        $('#calendar').on({
            "mouseenter":function(){
                var mark = $(this).attr('data-date');
                var eleWidth = getLastIndexOf($(this).css('width'),"px")-112;
                clockLayer($(this),mark,eleWidth);
            }/*,
             'mouseleave':function(){
             $('#clockDataLayer').css({"display":"none"}); /!*只有离开了外面最大的单元格才令浮层消失*!/
             }*/
        },'.fc-day-grid .fc-bg table>tbody>tr>td');  /*表格里面除去表头和日程之外的空白区域,也就是最外层最大的单元格*/

        $('#clockDataLayer').on('mouseleave',function() {
            $('#clockDataLayer').css({"display": "none"});
        });

    };
    /*页面渲染完成以后页面交互事件*/
    attendanceAnalysis.events();

    return attendanceAnalysis;
});

/*截取类似360px的360这种数据*/
function getLastIndexOf(target,str){
    return target = target.substr(0,target.lastIndexOf(str));
}
/*毫秒数返回时间*/
Number.prototype.formatDate = function(type){
    var target = new Date(this.valueOf()); /*this暂不知道是什么，但是toString和valueOf都能得到毫秒数*/
    var year = target.getFullYear();
    var month = target.getMonth()+1;
    var date = target.getDate();
    var hour = target.getHours();
    var minute = target.getMinutes();

        if(month < 10){
            month = "0"+month;
        }
        if(date<10){
            date = "0"+date;
        }
        if(hour<10){
            hour = "0"+hour;
        }
        if(minute<10){
            minute = "0"+minute;
        }
        if(type == 2){
            return year+"-"+month+"-"+date+"\t"+hour+":"+minute;
        }else{
            return year+"-"+month+"-"+date;
        }
}