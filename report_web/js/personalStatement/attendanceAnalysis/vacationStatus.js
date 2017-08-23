
/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：考勤里面带薪假期页面渲染和基本交互的实现
 */
define(["JQuery","layer","baseclass","config"],function($,layer,baseclass){
    var vacationStatus = inherit(baseclass.prototype);
    var userToken = vacationStatus.getParameter().token;  /*全局通用的用户token*/
    var userId = vacationStatus.getParameter().userId;
    var companyId = vacationStatus.getParameter().companyId;
    var vacationArray = {}; /*筛选类别用到，在渲染假期使用情况时用到*/
    var chooseInfoContainer = '';/*在第一次请求得到假期使用情况的对象以后就是这个，然后筛选时就用这个对象来重新渲染页面*/
    var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));
    /*初始化页面*/
    vacationStatus.init = function(){
        /*公共头部导航*/
        vacationStatus.navigation_top({
            id: 'navigation',
            pageUrl: './vacationStatus.html?token=' + userToken+"&userId="+userId+"&companyId"+companyId,
            pageName: '带薪假期详情'
        });

        /*添加查看的那个人的名字*/
        var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
        $('#vacationStatus_wrap .navigation_block').append(html);
        if(sessionStorage.getItem('isPCWeb') == 'false'){
            $('#vacationStatus_wrap .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
        }
        var url = "/worksheet/report.json";
        var repData = [ {
                            repName:"getRemainsHoliday",
                            repCondition:{
                                            where:[
                                                {name:"user_id",oper:"eq",value:userInfo.userId},
                                                {name:"holiday_type",oper:"eq",value:"1"}
                                            ]
                            }

                        },
                        {
                            repName:"getUsedHoliday",
                            repCondition:{
                                where:[
                                    {name:"user_id",oper:"eq",value:userInfo.userId},
                                    {name:"holiday_type",oper:"eq",value:"1"}
                                ]
                            }
                        }];
        repData = JSON.stringify(repData);
        sendRequest(url,repData);/*请求页面*/
    }

    /*请求数据渲染页面*/
    function sendRequest(url,repData){
        vacationStatus._ajax({
            url:url,
            dataType:"json",
            token:userToken,
            type:"post",
            data:{"rep":repData},
            success:function(response){
                /*console.info(response);*/  /*数据在渲染函数里被改变，为毛这里就开始变了，有这么快吗？？？？？*/
                var remainderVacationObj = response['data'].filter(function(index){
                    return (index['repName'] == "getRemainsHoliday");
                });
                romanceRemainderVacation(remainderVacationObj[0]["repResult"]);/*剩余假期总览*/
                var usedVacationObj = response['data'].filter(function(index){
                    return (index['repName'] == "getUsedHoliday");
                });
                chooseInfoContainer = usedVacationObj[0]['repResult'];/*假期分类筛选数据要用到。*/
                romanceUsedVacation(chooseInfoContainer); /*假期使用情况*/
            },
            error:function(response){
                console.info(response);
            }
        });
    }

    /*渲染剩余假期总览*/
    function romanceRemainderVacation(response){
        var tr = $('<tr></tr>');/*先把固定的表头加上去*/
        tr.append('<td>带薪假期分类</td><td>历史剩余</td><td>当年假期</td><td>当年已休</td><td>剩余假期</td>');
        $(".remainderStatus").append(tr);
        var historyCount = 0 ;/*合计的历史剩余*/
        var yearCount = 0 ;/*合计的当年假期*/
        var usedCount = 0 ;/*合计的当年已休*/
        var remainderCount = 0 ;/*合计的剩余假期*/
        $.each(response,function(){
            /*console.info($(this));*/
            historyCount += $(this)[0]['historyHoliday'];
            yearCount += $(this)[0]['yearHoliday'];
            usedCount += $(this)[0]['usedHoliday'];
            remainderCount += $(this)[0]['lastHoliday'];
            var tr = $('<tr></tr>');
            tr.append('<td>'+$(this)[0]['holidayName']+'</td>');
            tr.append('<td>'+$(this)[0]['historyHoliday']+'</td>');
            tr.append('<td>'+$(this)[0]['yearHoliday']+'</td>');
            tr.append('<td>'+$(this)[0]['usedHoliday']+'</td>');
            tr.append('<td>'+$(this)[0]['lastHoliday']+'</td>');
            $('.remainderStatus').append(tr);
        });
        /*假期都循环完了就添加合计*/
        var tr = $('<tr></tr>');
        tr.append('<td>合计</td>');
        tr.append('<td>'+historyCount+'</td>');
        tr.append('<td>'+yearCount+'</td>');
        tr.append('<td>'+usedCount+'</td>');
        tr.append('<td>'+remainderCount+'</td>');
        $('.remainderStatus').append(tr);
        if(response.length == 0){
            $('.remainderStatus>tbody>tr:last').css('display',"none");
            $('.remainderStatus').parent().append('<figure><img src="../../images/personalStatement/icon_jiaqipeitu.svg"/><figureCaption>暂无剩余假期</figureCaption></figure>');
            $('.vacationTable>header>span').eq(0).addClass('noData');
        }
    }

    /*渲染假期使用情况*/
    function romanceUsedVacation(response,markType){
        console.info(response);
        /*先清空数据，因为分类筛选也是这个*/
        $('.useStatus>tbody').empty();
        $('.vacationTable>div>div>section>span').eq(0).text('');
        $('.vacationTable>div>div>section>span').eq(1).text('');
        var longTimeCount = 0 ;  /*合计请假时长*/
        /*没有数据的时候，表头是需要有滚动条来实现横向滚动的*/
        if(response.length == 0){   /*没有数据是一个空数组,有时候又是为null*/
            $('.useTableMark').append('<figure><img src="../../images/personalStatement/icon_jiaqipeitu.svg"/><figureCaption>暂无休假记录</figureCaption></figure>');
            /*添加合计部分*/
            $('.vacationTable>div>div>section>span').eq(0).text("合计请假时长");
            $('.vacationTable>div>div>section>span').eq(1).text(0+"天");
            $('.vacationTable>header>span').eq(1).addClass('noData');
            return ;
        }
        for(var i = 0 ; i < response.length; i++){
                /*先通过结束时间判断总共有几个时间段*/
                var startTimeArray = response[i]['startTime'].split(',');/*开始时间*/
                var endTimeArray = response[i]['endTime'].split(',');/*结束时间*/
                var count = endTimeArray.length/*-1*/;/*如果数组最后一个数没有跟着逗号就不用减一个1*/
                var order = Number(i+1);  /*做表格内的文本用i+1总是字符串连接,所以在这里先加好*/
                var tr = $('<tr></tr>');
                tr.append('<td rowspan="'+count+'">'+order+'</td>');   /*序号*/
                if(response[i]['reason'].length > 6 ){
                    /*小的悬浮层要展示完整的请假事由*/
                    var oldString = response[i]['reason'];
                    response[i]['reason'] =response[i]['reason'].substr(0,6)+"...";
                    tr.append('<td rowspan="'+count+'" data-oldString="'+oldString+'">'+response[i]['reason']+'</td>');
                }else{
                    tr.append('<td rowspan="'+count+'">'+response[i]['reason']+'</td>');   /*请假事由*/
                }
                tr.append('<td class="dateMark">'+startTimeArray[0]+'</td>');   /*请假开始时间*/
                tr.append('<td class="dateMark">'+endTimeArray[0]+'</td>');   /*请假结束时间*/
                tr.append('<td rowspan="'+count+'">'+response[i]['longTime']+"天"+'</td>');   /*请假时长*/
                longTimeCount += response[i]['longTime'];
                tr.append('<td rowspan="'+count+'">'+response[i]['holidayName']+'</td>');   /*带薪假期分类*/
                vacationArray[response[i]['holidayName']] += String(i)+",";
                tr.append('<td rowspan="'+count+'">'+response[i]['createTime']+'</td>');   /*申请时间*/
                if(response[i]['status']=="审批通过"){ /*如果审批通过了就显示审批时间*/
                    tr.append('<td rowspan="'+count+'">'+response[i]['passTime']+'</td>');   /*审批时间*/
                }else{   /*如果状态不是审批通过就是审批中*/
                    tr.append('<td rowspan="'+count+'">审批中</td>');   /*审批时间*/
                }
                $('.useStatus>tbody').append(tr);
                if(count>1) {    /*多于一个时间段就是请了多个时间段，然后只有第一行需要合并行，其他行就只渲染时间段*/
                    for (var j = 1; j < count; j++) {
                        var tr = $('<tr></tr>');
                        tr.append('<td class="dateMark">' + startTimeArray[j] + '</td>');
                        /*请假开始时间*/
                        tr.append('<td class="dateMark">' + endTimeArray[j] + '</td>');
                        /*请假结束时间*/
                        $('.useStatus>tbody').append(tr);
                    }
                }
        }
        /*添加合计部分*/
        $('.vacationTable>div>div>section>span').eq(0).text("合计请假时长");
        $('.vacationTable>div>div>section>span').eq(1).text(longTimeCount+"天");

        if(markType == 2){   /*是筛选后的数据再渲染页面就需要根据内容改变高度*/
            changeUsedVacationTable($('.useStatus').parent(),1);
            return ;  /*是筛选选择的数据就不执行下面的，不再改变筛选框内的内容*/
        }
        /*数据都循环完了，生成假期分类筛选下拉框*/
        $('.filterSelect').append('<span>全部</span>');/*先加一个全选的*/
        $.each(vacationArray,function(v){
            $('.filterSelect').append('<span>'+v+'</span>');
            /* var indexArray = vacationArray[v].substr(9).split(',');  /!*与这个假期类别相对应的数据索引*!/
             indexArray.pop();  /!*用,字符串拼接的，转为数组时就会多一个空的元素，在这里把它去掉*!/
             console.info(indexArray);*/
        });
    }

    function changeUsedVacationTable(objEle,type){   /*假期使用情况表格高度的改变，只有这个表格用到这个*/
        /*然后联动的滚动条要归回原位*/
        $('.useTableMark').scrollLeft(0);
        var screenHeight = document.body.clientHeight; /*网页可见区域高*/
        console.info("屏幕高度"+screenHeight);
        var shouldTableHeight = screenHeight - 210;  /*页面的高度能够给表格的空间,合计不应该贴着底部，所以给他一个10px的距离*/
        console.info("页面能给的高度"+shouldTableHeight);
        if(type == 2){  /*没有数据就没有表格的情况*/
            objEle.css('height',shouldTableHeight);
        }else if(type == 1){   /*根据表格的高度而变化*/
            var tableHeight = $('.useStatus').css('height').substr(0,$('.useStatus').css('height').indexOf("px"));
            console.info("表格的高度"+tableHeight);
            if(Number(tableHeight)+4>shouldTableHeight){
                $('#vacationStatus_wrap .vacationTable .titleMark').css('padding-right',"5px");
                objEle.css('height',shouldTableHeight);
            }else if(Number(tableHeight)+4<=shouldTableHeight){
                $('#vacationStatus_wrap .vacationTable .titleMark').css('padding-right',"0px");
                objEle.css('height',Number(tableHeight)+4);
            }
        }
    }

    /*页面交互事件*/
    vacationStatus.events = function(){
        /*点击剩余假期总览和假期使用情况出现不同的页面*/
        $('.vacationTable>header>span').on('click',function(){
            $(this).addClass('watching');
            $(this).siblings().removeClass('watching');
            if($(this).text() == "剩余假期总览"){
                if($(this).hasClass('noData')){
                    $('.remainderStatus').parent().children().last().css('display','block');
                }
                $('.useStatus').parent().parent().css('display','none');
                $('.remainderStatus').css('display','table');
            }else if($(this).text() == "假期使用情况查询"){
                if($(this).prev().hasClass('noData')){ /*剩余假期没有数据的情况*/
                    $('.remainderStatus').parent().children().last().css('display','none');
                }
                $('.remainderStatus').css('display','none');
                $('.useStatus').parent().parent().css('display','block');
                /*然后联动的滚动条要归回原位*/
                $('.useTableMark').scrollLeft(0);
                if($(this).hasClass('noData')){  /*无数据的时候*/
                    changeUsedVacationTable($('.useTableMark'),2);
                }else{
                    changeUsedVacationTable($('.useStatus').parent(),1);
                }
            }
        });

        /*假期使用情况表格之间的联动*/
        $('.useTableMark').on('scroll',function(){
            var that = $(this)[0];
            var left = that.scrollLeft;
            $('.titleMark').css('left',"-"+left+"px");
        });

        /*页面交互事件*/
        $('.useStatus').on({        /*当单元格内容很多时浮层展示全部内容，离开单元格则令浮层消失*/
            "mouseenter":function(){
                var oldString = $(this).attr('data-oldString');
                if(oldString){  /*如果有这个属性值就代表要出现浮层*/
                    var top = $(this).offset().top;
                    var left = $(this).offset().left;
                    var width = $(this).css('width');
                    width = getLastIndexOf(width,"px");
                    var height = getComputedStyle($(this)[0],"").height;
                    height = getLastIndexOf(height,"px");
                    top += height/2+15;
                    var count = Number(left)+Number(width)/2;
                    /*var mergeCount = $(this).attr('rowspan');*/  /*合并了几行，一行大概是44px*/
                    $('.commonTipLayer').text(oldString);
                    $('.commonTipLayer').css({"top":top,"left":count,"display":"block"});
                }
            },
            "mouseleave":function(){
                $('.commonTipLayer').css('display',"none");/*鼠标浮到提示层上面就是离开了这个单元格，然后会很闪。。*/
            }
        },"td");

        /*带薪假期分类筛选*/
        $('.titleMark table tbody tr td:nth-of-type(6)>span').on('click',function(e){
            e.stopPropagation();
            var filterSelectStatus = $('.filterSelect').css('display');
            if(filterSelectStatus == "none"){
                var showMark = $('.filterSelect').children().length;
                if(showMark == 0){   /*盒子内没有子元素就代表没有内容*/
                    return;
                }
                var top = $(this).offset().top+30;
                var left = $(this).offset().left;
                $('.filterSelect').css({"left":left,"top":top});
                $('.filterSelect').slideDown();
                $('.filterSelect').scrollTop(0);
            }else if(filterSelectStatus == "block"){   /*明明是inline-block，但输出是block*/
                $('.filterSelect').slideUp();
            }
        });

        /*假期分类下拉框*/
        $('.filterSelect').on('mouseleave',function(){
            $(this).css('display','none');
        });
        $('.filterSelect').on({
            "mouseenter":function(){
                $(this).css('background',"#E1E1E1");
            },
            "mouseleave":function(){
                $(this).css('background',"transparent");
            },
            "click":function(e){
                e.stopPropagation();
                $('.filterSelect').css('display','none');
                var filterText = $(this).text();
                if(filterText == '全部'){  /*全部的话就不需要筛选数据了*/
                    console.info(chooseInfoContainer);
                    romanceUsedVacation(chooseInfoContainer,2);
                }else{
                    var holidayObj = chooseInfoContainer.filter(function(index){
                        return (index['holidayName'] == filterText);
                    });
                    /*console.info(holidayObj);*/
                    romanceUsedVacation(holidayObj,2);
                }
            }

        },"span");

        /*点击整个页面让下拉框消失*/
        $('#vacationStatus_wrap').on('click',function(){
            $('.filterSelect').css('display','none');
        });

        /*监控页面高度的改变然后改变表格的高度*/
        window.onresize = function(){
            if($('.vacationTable>header>span').eq(1).hasClass('noData')){
                changeUsedVacationTable($('.useTableMark'),2);
            }else{
                changeUsedVacationTable($('.useStatus').parent(),1);
            }
        };

    }

    vacationStatus.events();

    return vacationStatus;
});

function getLastIndexOf(target,str){  /*截取类似360px的360这种数据*/
    return target = target.substr(0,target.lastIndexOf(str));
}

/*毫秒格式化*/
function formatMillisecond(number,type){
    var target = new Date(number);
    var year = target.getFullYear();
    var month = target.getMonth()+1;
    if(month < 10){
        month = "0"+month;
    }
    var day = target.getDate();
    if(day < 10){
        day = "0"+day;
    }
    var hour = target.getHours();
    if(hour < 10){
        hour = "0"+hour;
    }
    var minute = target.getMinutes();
    if(minute < 10){
        minute = "0"+minute;
    }
    if(type == 1){  /*不需要小时和分钟的*/
        return year+"-"+month+"-"+day;
    }else if(type == 2){        /*需要小时和分钟的*/
        return year+"-"+month+"-"+day+"&nbsp&nbsp"+hour+":"+minute;
    }
}
