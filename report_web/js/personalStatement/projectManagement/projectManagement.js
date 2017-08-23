/**
 * 作者：陈丽
 * 最新更新：2017/03/10
 * 功能：项目页面渲染和基本交互的实现
 */

define(["JQuery", "layer", "echarts", "artTemplate", "baseclass", 'config'], function ($, layer, echarts, template, baseclass) {
    var projectManagement = inherit(baseclass.prototype);

    /*整张报表所有的请求参数大容器，即rep对应的值,用户选择时间以后改变这里面的值*/
    /*保存每次用户请求的表格的相关信息，然后用户进行的一系列的排序操作都是基于这个元数据*/
    var tableDetailCon;
    var myChart = echarts.init($('#myEcharts')[0]); /*柱图对象*/
    //根据后台表格详情传的项目详情的时间判断生成用户可选择的时间范围，然后可能用户选了2016年2月到2017年3月，但项目详情却没有2016年2月的，就会显示的和用户选择的不一致,所以这个标志原本为0，只要用户自己选择了就会变为1
    sessionStorage.setItem('markOfUserChoose',0);
    //查看当前员工的相关信息
    var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));
     console.info(userInfo);
    /*全局变量*/
    projectManagement.global = {
        "userToken": projectManagement.getParameter().token,
        "userId": projectManagement.getParameter().userId,
        "companyId":projectManagement.getParameter().companyId,
        //系统时间也就是最新时间，项目详情的表格选择时间范围用到
        "systemTime": projectManagement.getParameter().timestamp*1000
    }
    /*初始化页面*/
    projectManagement.init = function () {

        /*头部公共导航*/
        projectManagement.navigation_top({
            id: "headerOne",
            pageUrl: "./projectManagement.html?token=" + projectManagement.global['userToken'] + '&userId=' + projectManagement.global['userId']+"&timestamp"+projectManagement.global['systemTime']+"&companyId"+projectManagement.global['companyId'],
            pageName: "项目分析"
        });
        /*头部添加用户名字*/
         var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
         $('#assetStatement .navigation_block').append(html);
         if(sessionStorage.getItem('isPCWeb') == 'false'){
         $('#assetStatement .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
         }

        var repData = [];
        /*本月参与项目个数总览接口的请求参数*/
        var joinByMonthWhere = [];
        joinByMonthWhere.push(configure('user_id', "eq", projectManagement.global['userId']));
        joinByMonthWhere.push(configure('dt_month', "eq", "2017-03"));
        repData.push(configureAll("getJoinedProjectByMonth", joinByMonthWhere));

        /*本年参与项目个数接口的请求参数*/
        var joinByYearWhere = [];
        joinByYearWhere.push(configure('user_id', "eq", projectManagement.global['userId']));
        joinByMonthWhere.push(configure('substr(dt_month,1,4)', "eq", "2017"));
        repData.push(configureAll("getJoinedProjectsByYear", joinByYearWhere));

        /*入职至今参与项目接口的请求参数*/
        var allJoin = [];
        allJoin.push(configure('user_id', 'eq', projectManagement.global['userId']));
        allJoin.push(configure('dt_month', 'lesseq', "2017-03"));
        repData.push(configureAll("getAllJoinedProjects", allJoin));

        /*项目详情表格接口的请求参数*/
        var projectDetail = [];
        projectDetail.push(configure("user_id", 'eq', projectManagement.global['userId']));
        repData.push(configureAll("getProjectDetailByUserId", projectDetail));

        /*柱形图几月到几月的项目统计数据接口的请求参数*/
        var allJoinByMonth = [];
        allJoinByMonth.push(configure('user_id', 'eq', projectManagement.global['userId']));
        allJoinByMonth.push(configure('dt_month', 'moreeq', "2017-01"));
        allJoinByMonth.push(configure('dt_month', 'lesseq', "2017-12"));
        repData.push(configureAll("getAllJoinedProjectByMonth", allJoinByMonth));

        repData = JSON.stringify(repData);
        //发送请求
        sendRequest(repData);


        //注册事件
        projectManagement.events();

    }

    //注册事件
    projectManagement.events = function () {/*注意JS添加的要用事件委托*/
        /*
         *鼠标悬浮在条形图上面出现提示框
         * */

        //第一个条形图,提示层箭头朝下
        $('#member').on('mouseenter', function () {
            if ($('#member').hasClass('hasData') && !$('#cl_tipOne').hasClass('managerShowing')) {  /*确保已经渲染了，并且没有展示出来*/
                $('#cl_commonTipLayerUp').next().addClass('afterUp');
                $('#cl_commonTipLayerUp').next().removeClass('beforeUp');
                //在元素上取值
                $('#cl_commonTipLayerUp>p').eq(1).text("项目经理：" + $('#manager').attr('managerCount'));
                $('#cl_commonTipLayerUp>p').eq(2).text("项目成员：" + $('#member').attr('memberCount'));
                //加个类说明是项目角色结构，对应的小方框的颜色的改变
                $('#cl_commonTipLayerUp>p').eq(1).addClass('managerBefore');
                $('#cl_commonTipLayerUp>p').eq(2).addClass('memberBefore');
                var top = $(this).offset().top;
                var width = getComputedStyle($('#member')[0], '*').width;
                /*有单位*/
                width = width.substr(0, width.indexOf('px'));
                //证明这个浮层已经展示了，就不需要再执行生成代码了
                $('#cl_tipOne').addClass('managerShowing');
                $('#cl_tipOne').css({
                    //减去20三角形尖尖就正好对着长条中间
                    "left": width / 2 - 20,
                    //三角形高8，提示层高60，顶部导航有50px,中间距离有10px
                    "top": top - 123,
                    "display": "block"
                });
            }
        });
        $('#member').on('mouseleave', function () {
            $('#cl_tipOne').removeClass('managerShowing');
            $('#cl_commonTipLayerUp>p').eq(1).removeClass('managerBefore');
            $('#cl_commonTipLayerUp>p').eq(2).removeClass('memberBefore.');
            $('#cl_tipOne').css({
                "left": 0,
                "top": 0,
                "display": "none"
            });
        });

        /*第二个条形图，提示层箭头朝上*/
        $('#ingProject').on('mouseenter', function () {
            //hasData这个类是在渲染时加上去的,filedShowing这个类是在显示了这个条形图对应的提示层数据后加上去的
            if ($('#ingProject').hasClass('hasData') && !$('#cl_tipOne').hasClass('filedShowing')) {  /*确保已经渲染了，并且没有展示出来*/
                $('#cl_commonTipLayerUp').next().removeClass('afterUp');
                $('#cl_commonTipLayerUp').next().addClass('beforeUp');
                //在元素上取值
                $('#cl_commonTipLayerUp>p').eq(1).text("已归档：" + $('#filed').attr('filedCount'));
                $('#cl_commonTipLayerUp>p').eq(2).text("未归档：" + $('#ingProject').attr('ingProjectCount'));
                //加个类说明是项目状态结构，对应的小方框的颜色的改变
                $('#cl_commonTipLayerUp>p').eq(1).addClass('filedBefore');
                $('#cl_commonTipLayerUp>p').eq(2).addClass('ingProjectBefore');
                var top = $(this).offset().top;
                var width = getComputedStyle($('#ingProject')[0], '*').width;
                /*有单位*/
                width = width.substr(0, width.indexOf('px'));
                //证明这个浮层已经展示了，就不需要再执行生成代码了
                $('#cl_tipOne').addClass('filedShowing');
                $('#cl_tipOne').css({
                    //减去20三角形尖尖就正好对着长条中间
                    "left": width / 2 - 20,
                    //
                    "top": top - 34,
                    "display": "block"
                });
            }
        });
        $('#ingProject').on('mouseleave', function () {
            $('#cl_tipOne').removeClass('filedShowing');
            $('#cl_commonTipLayerUp>p').eq(1).removeClass('filedBefore');
            $('#cl_commonTipLayerUp>p').eq(2).removeClass('ingProjectBefore');
            $('#cl_tipOne').css({
                "left": 0,
                "top": 0,
                "display": "none"
            });
        });

        /*第三个条形图，提示层箭头朝上*/
        $('#memberYear').on('mouseenter', function () {
            if ($('#memberYear').hasClass('hasData') && !$('#cl_tipOne').hasClass('managerYearShowing')) {  /*确保已经渲染了，并且没有展示出来*/
                $('#cl_commonTipLayerUp').next().removeClass('beforeUp');
                $('#cl_commonTipLayerUp').next().addClass('afterUp');
                //在元素上取值
                $('#cl_commonTipLayerUp>p').eq(1).text("项目经理：" + $('#managerYear').attr('managerCount'));
                $('#cl_commonTipLayerUp>p').eq(2).text("项目成员：" + $('#memberYear').attr('memberCount'));
                //加个类说明是项目状态结构，对应的小方框的颜色的改变
                $('#cl_commonTipLayerUp>p').eq(1).addClass('managerBefore');
                $('#cl_commonTipLayerUp>p').eq(2).addClass('memberBefore');
                var top = $(this).offset().top;
                var width = getComputedStyle($('#memberYear')[0], '*').width;
                /*有单位*/
                width = width.substr(0, width.indexOf('px'));
                //证明这个浮层已经展示了，就不需要再执行生成代码了
                $('#cl_tipOne').addClass('managerYearShowing');
                $('#cl_tipOne').css({
                    //减去20三角形尖尖就正好对着长条中间
                    "left": width / 2 - 20,
                    //
                    "top": top - 124,
                    "display": "block"
                });
            }
        });
        $('#memberYear').on('mouseleave', function () {
            $('#cl_tipOne').removeClass('managerYearShowing');
            $('#cl_commonTipLayerUp>p').eq(1).removeClass('managerBefore');
            $('#cl_commonTipLayerUp>p').eq(2).removeClass('memberBefore');
            $('#cl_tipOne').css({
                "left": 0,
                "top": 0,
                "display": "none"
            });
        });

        //第四个条形图，提示曾箭头朝上
        $('#memberAll').on('mouseenter', function () {
            if ($('#memberAll').hasClass('hasData') && !$('#cl_tipOne').hasClass('managerAllShowing')) {  /*确保已经渲染了，并且没有展示出来*/
                $('#cl_commonTipLayerUp').next().removeClass('beforeUp');
                $('#cl_commonTipLayerUp').next().addClass('afterUp');
                //在元素上取值
                $('#cl_commonTipLayerUp>p').eq(1).text("项目经理：" + $('#managerAll').attr('managerCount'));
                $('#cl_commonTipLayerUp>p').eq(2).text("项目成员：" + $('#memberAll').attr('memberCount'));
                //加个类说明是项目状态结构，对应的小方框的颜色的改变
                $('#cl_commonTipLayerUp>p').eq(1).addClass('managerBefore');
                $('#cl_commonTipLayerUp>p').eq(2).addClass('memberBefore');
                var top = $(this).offset().top;
                var width = getComputedStyle($('#memberAll')[0], '*').width;
                /*有单位*/
                width = width.substr(0, width.indexOf('px'));
                //证明这个浮层已经展示了，就不需要再执行生成代码了
                $('#cl_tipOne').addClass('managerAllShowing');
                $('#cl_tipOne').css({
                    //减去20三角形尖尖就正好对着长条中间
                    "left": width / 2 - 20,
                    //
                    "top": top - 124,
                    "display": "block"
                });
            }
        });
        $('#memberAll').on('mouseleave', function () {
            $('#cl_tipOne').removeClass('managerAllShowing');
            $('#cl_commonTipLayerUp>p').eq(1).removeClass('managerBefore');
            $('#cl_commonTipLayerUp>p').eq(2).removeClass('memberBefore');
            $('#cl_tipOne').css({
                "left": 0,
                "top": 0,
                "display": "none"
            });
        });

        //项目详表旁的小箭头
        $('#J_detailLayer').on('mouseenter', function () {
            $('#cl_tipTwo').toggle();
            $('.arrow').toggle();
        });
        $('#J_detailLayer').on('mouseleave', function () {
            $('#cl_tipTwo').toggle();
            $('.arrow').toggle();
        });

        //用户选择时间的箭头
        $('.openSelect').on('click', function (e) {
            e.stopPropagation();
            var showStatus = $('.filterTime').css('display');
            var left = $(this).offset().left;
            if (showStatus === 'none') {
                $('.filterTime').css('left', left);
                //增加这个类表示选择时间的框选择的是起始时间
                $('.filterTime').addClass('oso');
                $('.filterTime').slideDown();
            } else if (showStatus === 'block' && $('.filterTime').hasClass('ost')) {  /*表明是这个div是在展示的，并且是在旁边这个箭头这里*/
                $('.filterTime').removeClass('ost');
                /*去除原来的标识类名*/
                $('.filterTime').css('left', left);
                $('.filterTime').addClass('oso');
                /*增加当前的标志类名*/
            } else if (showStatus === 'block' && $('.filterTime').hasClass('oso')) {  /*表明这个div是正在展示并且是就展示在这个箭头这里*/
                $('.filterTime').slideUp();
                $('.filterTime').removeClass('ost');
            }
        });
        $('.openSelectTwo').on('click', function (e) {
            e.stopPropagation();
            var showStatus = $('.filterTime').css('display');
            var left = $(this).offset().left;
            if (showStatus === 'none') {
                $('.filterTime').css('left', left);
                //增加这个类表示选择时间的框选择的是结束时间
                $('.filterTime').addClass('ost');
                $('.filterTime').slideDown();
            } else if (showStatus === 'block' && $('.filterTime').hasClass('oso')) {/*表明是这个div是在展示的，并且是在旁边这个箭头这里*/
                $('.filterTime').removeClass('oso');
                $('.filterTime').css('left', left);
                $('.filterTime').addClass('ost');
            } else if (showStatus === 'block' && $('.filterTime').hasClass('ost')) { /*表明这个div是正在展示并且是就展示在这个箭头这里*/
                $('.filterTime').slideUp();
                $('.filterTime').removeClass('ost');
            }
        });

        //用户选择时间的事件
        $('.filterTime').on('click', "span", function (e) {
            e.stopPropagation();
            var text = $(this).text();
            var startDate, endDate;
            if ($('.filterTime').hasClass('oso')) {  /*代表是选择的初始日期*/
                $('.headerRight>p:nth-of-type(1)').text(text);
                $('.filterTime').removeClass('oso');
                startDate = text;
                endDate = $('.headerRight>p:nth-of-type(3)').text();
            } else if ($('.filterTime').hasClass('ost')) {/*代表是选择的结束日期*/
                $('.headerRight>p:nth-of-type(3)').text(text);
                $('.filterTime').removeClass('ost');
                startDate = $('.headerRight>p:nth-of-type(1)').text();
                endDate = text;
            }
            var startYear = startDate.substr(0, 4);
            var startMonth = startDate.substr(5, 2);
            var endYear = endDate.substr(0, 4);
            var endMonth = endDate.substr(5, 2);
            //因为传给后台是假如小于3月31号代表需要这一个月内的数据，然后懒得判断那个月最后一天是多少号，所以直接转成数字加一个1，截止日期设为小于下个月的第一天
            if(endMonth < 10){
                endMonth = Number(endMonth.substr(1,1))+1;
            }
            if(endMonth < 10){
                endMonth = "0"+endMonth;
            }
            /*console.info(startYear+"-"+startMonth+"-01");
             console.info(endYear+"-"+endMonth+"-01");*/
            $('.filterTime').slideUp();
            /*更新表格数据*/
            /*var rep = JSON.parse(repData);*/
            //去掉之前的这个接口参数
           /* for (var i = 0; i < rep.length; i++) {
                if (rep[i]['repName'] == "getProjectDetailByUserId") {
                    rep.splice(i, 1);
                }
            }*/
            sessionStorage.setItem('markOfUserChoose',1);
            //重新配置这个接口的参数 :项目详情表格接口的请求参数
            var rep = [];
            var projectDetail = [];
            projectDetail.push(configure("user_id", 'eq', projectManagement.global['userId']));
            projectDetail.push(configure("plan_start_date", 'moreeq', startYear + "-" + startMonth + "-01"));
            projectDetail.push(configure("plan_start_date", 'less', endYear + "-" + endMonth + "-01"));
            rep.push(configureAll("getProjectDetailByUserId", projectDetail));
            rep = JSON.stringify(rep);
            sendRequest(rep);
        });

        //导出图标
        $('.headerRight>p:nth-of-type(4)').on('click', function () {
            var rep = {
                "repName": "getProjectDetailByUserId",
                "repCondition": {
                    "where": [
                        {
                            "name": "user_id",
                            "oper": "eq",
                            "value": projectManagement.global.userId
                        }
                    ]
                }
            };
            rep = JSON.stringify(rep);
            location.href = projectManagement.getLocalhostPort() + '/worksheet/export.json?rep=' + rep;
        });

        //筛选框图标
        $('.headerRight>p:nth-of-type(5)').on('click', function (e) {
            e.stopPropagation();
            var showStatus = $('#cl_filter').css('display');
            showStatus === "none" ? $('#cl_filter').slideDown() : $('#cl_filter').slideUp();

        });

        //表格单元格上面的图标:工期由短到长排序
        $('#tableHeader>tbody>tr>td:nth-of-type(5)>span').on('click', function () {
            if(!tableDetailCon){  /*没有得到数据的时候是没有这个变量的*/
                return ;
            }
           if(tableDetailCon.length == 0){
               /*do nothing*/
           }else if (tableDetailCon[0]['repResult'].length == 0) {
               /*console.info('暂无项目表格数据');*/
               return;
           } else if (tableDetailCon[0]['repResult'][0] == null) {
               /*console.info('暂无项目表格数据');*/
               return;
           };
           /*确定有数据以后就对数据进行排序：进行中的计划取计划工期，已归档的计划取实际工期，比较的时候只比较工期*/
           var targetData = tableDetailCon[0]['repResult']; /*这是一个数组*/
            var workTimesArray =[];
            for(var i = 0 ; i < targetData.length ; i++){
                if(targetData[i]['status'] == 1){  /*如果是进行中就取计划工期*/
                    workTimesArray.push(targetData[i]['planTimes']);
                }else if(targetData[i]['status'] == 2){  /*如果是已归档就取实际工期*/
                    workTimesArray.push(targetData[i]['realTimes']);
                }
            }
           for(var i = 0 ; i < workTimesArray.length ; i++){
                for(var j = Number(i)+1 ; j < workTimesArray.length ; j++){
                    if(workTimesArray[i] > workTimesArray[j]){
                        var temp = workTimesArray[i];
                        workTimesArray[i] = workTimesArray[j];
                        workTimesArray[j] = temp;
                        var tempTwo = targetData[i];
                        targetData[i] = targetData[j];
                        targetData[j] = tempTwo;
                    }
                }
           }
            tableTemplateContent(targetData);
        });

        //表格单元格上面的图标：归档日期由旧到新
        $('#tableHeader>tbody>tr>td:nth-of-type(6)>span').on('click', function () {
            if(!tableDetailCon){  /*没有得到数据的时候是没有这个变量的*/
                return ;
            }
            if(tableDetailCon.length == 0){
                /*do nothing*/
                return ;
            }else if (tableDetailCon[0]['repResult'].length == 0) {
                /*console.info('暂无项目表格数据');*/
                return;
            } else if (tableDetailCon[0]['repResult'][0] == null) {
                /*console.info('暂无项目表格数据');*/
                return;
            };
            /*确定有数据以后就对数据进行排序：归档日期就是项目的实际结束日期，但是有可能第一次结束了产生了一次实际结束日期，结果后来又开了，这个时候还是有实际结束日期，所以先判断状态，再决定归档日期用什么值*/
            var targetData = tableDetailCon[0]['repResult'];
            var filedTimeArray=[];
            for(var i = 0 ; i < targetData.length ; i++){
                if(targetData[i]['status'] == 1){  /*如果是进行中就没有归档日期*/
                    filedTimeArray.push('0');
                }else if(targetData[i]['status'] == 2){  /*如果是已归档就取实际结束日期*/
                    filedTimeArray.push(targetData[i]['realEndDate']);
                }
            }
            console.info("0">"2017-03-10"); /*是false*/
            //日期最大就是第一个数组元素
            for(var i = 0 ; i < targetData.length ; i++){
                for(var j = Number(i)+1 ; j < filedTimeArray.length ; j++){
                    if(filedTimeArray[i] < filedTimeArray[j]){
                        var temp = filedTimeArray[i];
                        filedTimeArray[i] = filedTimeArray[j];
                        filedTimeArray[j] = temp;
                        var tempTwo = targetData[i];
                        targetData[i] = targetData[j];
                        targetData[j] = tempTwo;
                    }
                }
            }
            tableTemplateContent(targetData);
        });

        //表格单元格上面的图标：成员人数由多到少
        $('#tableHeader>tbody>tr>td:nth-of-type(7)>span').on('click', function () {
            if(!tableDetailCon){  /*没有得到数据的时候是没有这个变量的*/
                return ;
            }
            if(tableDetailCon.length == 0){
                /*do nothing*/
                return ;
            }else if (tableDetailCon[0]['repResult'].length == 0) {
                /*console.info('暂无项目表格数据');*/
                return;
            } else if (tableDetailCon[0]['repResult'][0] == null) {
                /*console.info('暂无项目表格数据');*/
                return;
            };
            /*确定有数据以后就对数据进行排序*/
            var targetData = tableDetailCon[0]['repResult'];
            targetData.sort(function(a,b){
                return a['userSize'] - b['userSize'];
            });
            /*console.info(targetData);*/
            tableTemplateContent(targetData);
        });

        //筛选框筛选
        $('#cl_filter>div>span').on('click',function(e){
            e.stopPropagation();
            //点击的这个条目是否已经被选择了,这个类就是被选中的标志
            var classStatus = $(this).hasClass('optionChoosed');
            if(classStatus){
                $(this).removeClass('optionChoosed');
            }else{
                $(this).addClass('optionChoosed');
                //选择这个条目的同时，其他条目不能选
                $(this).siblings().removeClass('optionChoosed');
            };
        });

        //筛选框的确定按钮确定筛选
        $('#cl_filter').on('click',function(e){
            e.stopPropagation();
        });

        $('#cl_filter button:nth-of-type(1)').on('click',function(e){
            //项目角色的筛选条件,没有选择也就是没有为这个类的元素的时候text为空字符串，typeof 为string
            var conditionOne = $('.projectRole .optionChoosed').text();
            if(conditionOne == '项目经理'){
                conditionOne = 0 ;
            }else if(conditionOne == '项目成员'){
                conditionOne = 1;
            }
            //项目状态的筛选条件
            var conditionTwo = $('.projectStatus .optionChoosed').text();
            if(conditionTwo == '未归档'){
                conditionTwo = 1;
            }else if(conditionTwo == '已归档'){
                conditionTwo = 2;
            }
            //筛选
            var targetData = tableDetailCon[0]['repResult']; //这是一个数组
            var typeStatusOne = typeof conditionOne;
            var typeStatusTwo = typeof conditionTwo;
            //都为字符串说明选的全部，是没有被转成后台传的对应的数值的，所以不需要筛选
            if(conditionOne === '' && conditionTwo === ''){  /*如果都是空字符串，说明没有选择筛选项*/
                return ;
            }else if(typeStatusOne === 'string' && typeStatusTwo === 'string'){
                tableTemplateContent(targetData);
            }else{
                var realDataArray = [];//放筛选后的数据
                //只选择了对角色进行筛选，没有筛选状态或者选的是全部
                if(typeStatusOne === 'number' && typeStatusTwo === 'string'){
                    var projectRoleArray = targetData.filter(function(index){
                        return index['roleId'] == conditionOne;
                    });
                    for(var i = 0 ; i < projectRoleArray.length ; i++){
                        realDataArray.push(projectRoleArray[i]);
                    };
                    tableTemplateContent(realDataArray);
                }else if(typeStatusOne === 'number' && typeStatusTwo === 'number'){//对角色和状态都要进行筛选
                    /*console.info("角色:"+typeof conditionOne);
                    console.info("状态:"+typeof conditionTwo);*/
                    //先筛选角色
                    var projectRoleArray = targetData.filter(function(index){
                        return index['roleId'] == conditionOne;
                    });
                    for(var i = 0 ; i < projectRoleArray.length ; i++){
                        realDataArray.push(projectRoleArray[i]);
                    };
                    /*console.info(realDataArray);*/
                    //再筛选状态
                    var statusArray = realDataArray.filter(function(index){
                        return index['status'] == conditionTwo;
                    });
                   /* console.info(statusArray);*/
                    tableTemplateContent(statusArray);
                }else if(typeStatusOne === 'string' && typeStatusTwo === 'number'){//只筛选状态，不筛选角色
                    var statusArray = targetData.filter(function(index){
                        return index['status'] == conditionTwo;
                    });
                    for(var i = 0 ; i < statusArray.length ; i++){
                        realDataArray.push(statusArray[i]);
                    };
                    tableTemplateContent(realDataArray);
                }
            }
            $('#cl_filter').slideUp();
        });

        //筛选框的清除按钮清除筛选条件
        $('#cl_filter button:nth-of-type(2)').on('click',function(e){
            //选择的其他条件都取消，全部默认选中全部
            $('#cl_filter>div>span').removeClass('optionChoosed');
            $('#cl_filter>div>span:nth-of-type(1)').addClass('optionChoosed');
            tableTemplateContent(tableDetailCon[0]['repResult']);
            $('#cl_filter').slideUp();
        });

        //整个页面任意处点击需要执行的操作
        $(document).on('click', function () {
            $('#cl_filter').slideUp();
            $('.filterTime').slideUp();
            //收起时间筛选框时这两个类要删掉
            $('.filterTime').removeClass('oso');
            $('.filterTime').removeClass('ost');
        });

        /*
         * 页面高度和宽度的变化事件
         * */
        /*装柱形图的外层容器，是一个DOM元素*/
        var echartsContainer = $('#myEcharts').parent()[0];
        window.onresize = function () {
            var width = getComputedStyle(echartsContainer, "*").width;
            var height = getComputedStyle(echartsContainer, "*").height;
            myChart.resize({
                "width": width,
                "height": height
            });
        }
    }


    /*
     * 配置请求参数的条件部分
     * @name:条件的名称
     * @oper：条件的操作范围
     * @value:条件的值
     * */
    function configure(name, oper, value) {
        return {
            name: name,
            oper: oper,
            value: value
        }
    };

    /*
     * 配置完整的请求参数
     * @repName:请求报表数据的接口名字
     * @option:请求条件的值
     * */
    function configureAll(repName, option) {
        return {
            "repName": repName,
            "repCondition": {
                "where": option
            }
        }
    };

    /*
     * 发送请求获得数据
     * @option:发送请求需要传给后台的数据
     * */
    function sendRequest(option/*, type*/) {
        projectManagement._ajax({
            url: "/worksheet/report.json",
            type: "post",
            data: {"rep": option},
            success: function (response) {
                /*console.info(response);*/
                var targetData = response.data;
                //type为1就是初始化第一次渲染，type为2就是用户选择时间段，只渲染表格
                /*if (type == 1) {*/
                    /*本月参与项目个数总览*/
                    var joinByMonthContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getJoinedProjectByMonth');
                    });
                    paintJoinByMonth(joinByMonthContainer);
                    /*本年参与项目个数*/
                    var joinByYearContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getJoinedProjectsByYear');
                    });
                    paintJoinByYear(joinByYearContainer);
                    /*入职至今参与项目*/
                    var joinAllContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getAllJoinedProjects');
                    });
                    paintJoinAll(joinAllContainer);
                    /*项目详情表格*/
                    var projectDetailContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getProjectDetailByUserId');
                    });
                    paintProjectDetail(projectDetailContainer);
                    tableDetailCon = projectDetailContainer;
                    /*柱形图几月到几月的项目统计数据*/
                    var joinAllByMonthContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getAllJoinedProjectByMonth');
                    });
                    paintJoinAllByMonth(joinAllByMonthContainer);
                /*} else if (type == 2) {
                    /!*项目详情表格*!/
                    var projectDetailContainer = targetData.filter(function (index) {
                        return (index['repName'] == 'getProjectDetailByUserId');
                    });
                    paintProjectDetail(projectDetailContainer);
                    tableDetailCon = projectDetailContainer; /!*每次用户改变了时间都会重新请求，然后只要在请求这里改变值就可以了*!/
                }*/

            },
            error: function (response) {
                console.info(response);
                console.info('请求整张报表出错');
            }
        });
    };

    /*
     * 根据数据渲染本月参与项目个数部分
     * @data:渲染所需要的数据
     * */
    function paintJoinByMonth(data) {
        if(data.length == 0){
            /*data为0是当用户选择时间以后只传了表格详情一个接口的请求参数，所以结果也只有表格详情这一个结果，其他几个接口就没有结果,所以这时不做任何事*/
            return ;
        }else if (data[0]['repResult'].length == 0 ) {  /*没有数据,*/
            console.info('暂无本月参与项目数据');
            return;
        }
        var targetData = data[0]['repResult'][0];
        var projectCount = targetData['projectSize'];
        /*总的项目数*/
        var managerCount = targetData['managerProjectSize'];
        /*当项目经理的总数*/
        var memberCount = targetData['memberProjectSize'];
        /*当项目成员的总数*/
        var closeCount = targetData['closeProjectSize'];
        /*已归档项目总数*/
        var ingCount = targetData['openProjectSize'];
        /*未归档项目*/
        $('#joinByMonth>span').eq(0).text(projectCount);
        /*项目角色结构*/
        var topWidth = managerCount / projectCount * 100;
        /*项目经理蓝色那个条条*/
        $('#joinByMonth #manager').animate({
            "width": topWidth + "%"
        }, 700);
        $('#joinByMonth #manager').attr('managerCount', managerCount);
        $('#joinByMonth #member').attr('memberCount', memberCount);
        $('#joinByMonth #member').addClass('hasData');
        /*意味着是已经渲染了的，即使没有数据也是渲染了的，这样悬浮上去就可以判断要不要有提示*/
        /*项目归档结构*/
        var topWidthTwo = closeCount / projectCount * 100;
        /*已归档绿色那个条条*/
        $('#joinByMonth #filed').animate({
            "width": topWidthTwo + "%"
        }, 700);
        $('#joinByMonth #filed').attr('filedCount', closeCount);
        $('#joinByMonth #ingProject').attr('ingProjectCount', ingCount);
        $('#joinByMonth #ingProject').addClass('hasData');
        /*console.info(data);*/
    };

    /*
     *根据数据渲染本年参与项目个数部分
     * @data:渲染所需要的数据
     * */
    function paintJoinByYear(data) {
        if(data.length == 0 ){
            /*do nothing*/
            return ;
        }else if (data[0]['repResult'].length == 0) {  /*没有数据*/
            console.info('暂无本年参与项目数据');
            return;
        } else if (data[0]['repResult'][0] == null) {  /*没有数据*/
            console.info('暂无本年参与项目数据');
            return;
        }
        var targetData = data[0]['repResult'][0];
        var projectCount = targetData['projectSize'];
        /*总数*/
        var managerCount = targetData['managerProjectSize'];
        /*项目经理总数*/
        $('#joinByYear>span').eq(0).text(projectCount);
        /*项目角色结构*/
        var topWidth = managerCount / projectCount * 100;
        /*项目经理蓝色那个条条*/
        $('#joinByYear #managerYear').animate({
            "width": topWidth + "%"
        }, 700);
        $('#joinByYear #managerYear').attr('managerCount', managerCount);
        $('#joinByYear #memberYear').attr('memberCount', targetData['memberProjectSize']);
        $('#joinByYear #memberYear').addClass('hasData');
        /*console.info(data);*/
    };

    /*
     *根据数据渲染入职至今参与项目个数部分
     * @data:渲染所需要的数据
     * */
    function paintJoinAll(data) {
        if(data.length == 0 ){
            /*do nothing*/
            return ;
        }else if (data[0]['repResult'].length == 0) {  /*没有数据*/
            console.info('暂无入职至今参与项目数据');
            return;
        } else if (data[0]['repResult'][0] == null) {  /*没有数据*/
            console.info('暂无入职至今参与项目数据');
            return;
        }
        var targetData = data[0]['repResult'][0];
        var projectCount = targetData['projectSize'];
        /*总数*/
        var managerCount = targetData['managerProjectSize'];
        /*项目经理总数*/
        $('#joinAll>span').eq(0).text(projectCount);
        /*项目角色结构*/
        var topWidth = managerCount / projectCount * 100;
        /*项目经理蓝色那个条条*/
        $('#joinAll #managerAll').animate({
            "width": topWidth + "%"
        }, 700);
        $('#joinAll #managerAll').attr('managerCount', managerCount);
        $('#joinAll #memberAll').attr('memberCount', targetData['memberProjectSize']);
        $('#joinAll #memberAll').addClass('hasData');
        /*console.info(data);*/
    };

    /*
     *根据数据渲染项目详情表格部分
     * @data:渲染所需要的数据
     * */
    function paintProjectDetail(data) {
        //每次都要先清空
        $('#tableContent>tbody').empty();
        //没有数据
        if(data.length == 0){
            $('#tableContent').css('display','none');
            $('#noDataContainer').css('display','flex');
            return ;
        }else if (data[0]['repResult'].length == 0) {
            console.info('暂无项目表格数据');
            $('#tableContent').css('display','none');
            $('#noDataContainer').css('display','flex');
            return;
        } else if (data[0]['repResult'][0] == null) {
            console.info('暂无项目表格数据');
            $('#tableContent').css('display','none');
            $('#noDataContainer').css('display','flex');
            return;
        }
        var targetData = data[0]['repResult'];
        //放后台传过来的数据里的计划开始时间，然后要以初始时间为依据来判断是否生成用户选择日期的部分
        var timeArray = [];
        for (var i = 0; i < targetData.length; i++) {
            timeArray.push(targetData[i]['planStartDate']);
        }
        ;
        //按照计划开始日期,最新的为数组最后一个
        for (var i = 0; i < timeArray.length; i++) {
            //这个索引对应着数据数组里的索引，然后数据数组里的数据也要换位置，日期最小的为数组里的第一个
            for (var j = Number(i) + Number(1); j < timeArray.length; j++) {
                if (timeArray[i] > timeArray[j]) {
                    var temp = timeArray[i];
                    timeArray[i] = timeArray[j];
                    timeArray[j] = temp;
                    var dataTemp = targetData[i];
                    targetData[i] = targetData[j];
                    targetData[j] = dataTemp;
                }
            }
        };

        if(sessionStorage.getItem('markOfUserChoose') == 0){  /*只有第一次初始化的时候需要这么做，用户选择时间以后年月哪里就改了，而选时间的下拉框一直都不需要改*/
//时间数组和数据数组都排完序就有表格上面用户选择时间的起始时间了，然后就可以渲染那一部分了
            var startYear = Number(timeArray[0].substr(0, 4));
            var startMonth = timeArray[0].substr(5, 2);
            if (startMonth.indexOf('0') == 0) {  /*说明月份是02,03这种情况*/
                startMonth = Number(startMonth.substr(1, 1));
            } else {
                startMonth = Number(startMonth);
            }
            var endYear = new Date(Number(projectManagement.global['systemTime'])).getFullYear();
            var endMonth = new Date(Number(projectManagement.global['systemTime'])).getMonth() + 1;

            //2016年5月开始第一个项目，现在是2017年3月，然后(2017-2016)*12-5+3=10,也就是总共从有项目开始到现在是10个月的时间
            var remainderMonth = (endYear - startYear) * 12 - startMonth + endMonth;
            //如果起始时间到现在距离不大于12个月就不显示可选择的箭头，也不生成可选月份下拉框
            if (remainderMonth <= 12) {
                $('.openSelect').css('display','none');
                 $('.openSelectTwo').css('display','none');
                startMonth >= 10 ? $('.headerRight>p:nth-of-type(1)').text(startYear + '年' + startMonth + "月") : $('.headerRight>p:nth-of-type(1)').text(startYear + '年0' + startMonth + "月");
                $('.headerRight>p:nth-of-type(2)').text("-");
                endMonth >= 10 ? $('.headerRight>p:nth-of-type(3)').text(endYear + '年' + endMonth + "月") : $('.headerRight>p:nth-of-type(3)').text(endYear + '年0' + endMonth + "月");

            } else if (remainderMonth > 12) {
                $('.openSelect').css('display', 'inline');
                $('.openSelectTwo').css('display', 'inline');
                //配置选择时间下拉框
                //开始年份的截止月份是12月
                createFilterTimeLayer(startYear, startMonth, 12);
                //结束年份的截止月份是endMonth
                createFilterTimeLayer(endYear, 1, endMonth);
                //中间年份都是从1月到12月，只有年份会变
                for (var i = Number(startYear) + Number(1); i < endYear; i++) {
                    createFilterTimeLayer(i, 1, 12);
                }
            }
        }

        //表格所需数据默认需要按归档日期排序
        var filedTimeArray = [];
        for (var i = 0; i < targetData.length; i++) {
            filedTimeArray.push(String(targetData[i]['realEndDate']));
        }
        //按照归档日期对数据进行排序(测试字符串null是大于字符串‘2017-02-03的,而为null的都是正在进行中没有归档的,要放前面’)
        for (var i = 0; i < filedTimeArray.length; i++) {
            for (var j = Number(i) + Number(1); j < filedTimeArray.length; j++) {
                if (filedTimeArray[i] < filedTimeArray[j]) {
                    var temp = filedTimeArray[i];
                    filedTimeArray[i] = filedTimeArray[j];
                    filedTimeArray[j] = temp;
                    var tempTwo = targetData[i];
                    targetData[i] = targetData[j];
                    targetData[j] = tempTwo;
                }
            }
        }
        //已归档然后再次打开变成正在进行中也会有实际结束日期，所以还要再根据状态值来排一次,2代表已归档比1进行中大，所以大的放在最后面
        for (var i = 0; i < targetData.length; i++) {
            for (var j = Number(i) + Number(1); j < targetData.length; j++) {
                if (targetData[i]['status'] > targetData[j]['status']) {
                    var tempTwo = targetData[i];
                    targetData[i] = targetData[j];
                    targetData[j] = tempTwo;
                }
            }
        }
        //表格模板填充数据并加入页面
        tableTemplateContent(targetData);
    };

    /*
     * 生成用户选择日期的层
     * @param:initYear:某某年
     * @param:initMonth:某某年的开始月份
     * @param:endMonth:某某年的结束月份
     * */
    function createFilterTimeLayer(initYear, initMonth, endMonth) {
        //每次都要先清空
        $('.filterTime').empty();
        for (var i = initMonth; i <= endMonth; i++) {
            i >= 10 ? $('.filterTime').append('<span>' + initYear + "年" + i + "月" + '</span>') : $('.filterTime').append('<span>' + initYear + "年0" + i + "月" + '</span>');
        }
    }

    /*
     *表格模板填充数据并加入页面
     * @param:targetData：表格所需数据按归档日期排完序后的数组
     * */
    function tableTemplateContent(targetData) {
        //每次都要先清空
        $('#tableContent>tbody').empty();  /*按工期什么排序的时候直接调用这个的*/
        //没有数据
        if(targetData.length == 0){
            $('#tableContent').css('display','none');
            $('#noDataContainer').css('display','flex');
            return ;
        }
        var dataCon = {};
        for (var i = 0; i < targetData.length; i++) {
            var data = {};
            /*序号*/
            data['order'] = i + 1;
            /*项目名称*/
            data['projectName'] = targetData[i]['projectName'];
            /*项目角色*/
            var roleId = targetData[i]['roleId'];
            if (Number(roleId) == 1) {
                data['projectRole'] = "项目成员";
            } else if (Number(roleId) == 0) {
                data['projectRole'] = "项目经理";
            }
            /*项目状态*/
            /*实际归档日期*/
            /*实际工期*/
            var statusId = targetData[i]['status'];
            if (Number(statusId) == 1) {
                data['projectStatus'] = "进行中";
                data['fileTime'] = '-';
                data['workTime'] = targetData[i]['planTimes'];
                /*已使用工期*/
            } else if (Number(statusId) == 2) {
                data['projectStatus'] = '已完成';
                data['fileTime'] = targetData[i]['realEndDate'];
                data['workTime'] = targetData[i]['realTimes'];
                /*实际工期*/
            }
            /*成员人数*/
            data['memberCount'] = targetData[i]['userSize'];
            /*用户总数*/
            dataCon[i] = data;
        }
        var templateData = {
            "data": dataCon
        }
        /*console.info(dataCon);*/
        var html = template('trContent', templateData);
        $('#tableContent>tbody').append(html);
    }

    /*
     *根据数据渲染柱形图部分
     * @data:渲染所需要的数据
     * */
    function paintJoinAllByMonth(data){
        if(data.length == 0){
        /*do nothing*/
            return;
        }else if (data[0]['repResult'].length == 0) {  /*没有数据*/
            console.info('暂无项目表格数据');
            return;
        } else if (data[0]['repResult'][0] == null) {  /*没有数据*/
            console.info('暂无项目表格数据');
            return;
        }
        var targetData = data[0]['repResult'];
        var monthCon = [];
        /*装月份的数组*/
        var managerProjectCount = [];
        /*装那个月对应的作为项目经理的项目总数*/
        var memberProjectCount = [];
        /*装那个月对应的作为项目成员的项目总数*/
        for (var i = 0; i < targetData.length; i++) {
            monthCon.push(targetData[i]['month']);
            managerProjectCount.push(targetData[i]['managerProjectSize']);
            memberProjectCount.push(targetData[i]['memberProjectSize']);
        }
        /*console.info(data);
        console.info(monthCon);
        console.info(managerProjectCount);
        console.info(memberProjectCount);*/
       /* var xData = ['2017年1月', '2017年2月', '2017年3月'];
        var testOne = "2017年12月";
        /!*表格数据范围的开始*!/
        var testTwo = "2017年12月";
        /!*表格数据范围的结束*!/
        var obj = {};
        /!*存放表格数据范围开始和结束对应的索引值*!/
        for (var i = 0; i < xData.length; i++) {
            if (xData[i] == testOne || xData[i] == testTwo) {
                obj[xData[i]] = i;
            }
        }
        var percentArray = [];
        for (var index in obj) {
            percentArray.push(obj[index] / xData.length);
        }*/
        /*var dStart = percentArray[0] * 100;
        var dEnd = percentArray[1] * 100;
        if (xData.length > 12) {*/
            /*console.info(xData.length);
             console.info((xData.length-11)/2);
             console.info((xData.length-11)/2/xData.length);
             console.info((xData.length-11)/2/xData.length*100);
             var dEnd = ((xData.length-11)/2+11)/xData.length*100;
             console.info(dStart);
             console.info(dEnd);*/
        /*} else {
            dStart = 0;
            dEnd = 100;
        }*/
        var dStart;
        if(monthCon.length>12){
            dStart = (1-12/monthCon.length)*100;
        }else{
            dStart = 0 ;
        }
        /*项目情况柱状图*/

        myChart.setOption({
            title: {
                show: true,
                text: "各月参与的项目个数",
                padding: [0, 0, 0, 17],
                textStyle: {
                    color: '#546576',
                    fontSize: 14,
                    fontWeight: "normal"
                }
            },
            legend: {
                show: true,
                x: "right",
                y: "top",
                itemWidth: 8,
                itemHeight: 8,
                data: [{
                    name: "项目经理",
                    icon: "circle",
                    textStyle: {
                        color: "#666666"
                    }
                }, {
                    name: "项目成员",
                    icon: "circle",
                    textStyle: {
                        color: "#666666"
                    }
                }]
            },
            /*lineStyle:{
             color:'#76B6F1',
             type:"solid"
             },*/
            color: ['#3398DB'],
            tooltip: {
                trigger: 'axis',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'none'        // 默认为直线，可选为：'line' | 'shadow'
                },
                backgroundColor: ' rgba(23,39,51,0.80)'

            },
            grid: {
                show: true, /*不是控制坐标轴和背景的网格线的*/
                top: "15%",
                left: '3%',
                right: '4%',
                bottom: '22%',
                /*backgroundColor:'lightCyan',*/
                borderWidth: 0, /*像表格一样在最外框*/
                borderColor: "red",
                containLabel: true
            },
            dataZoom: [
                {
                    /*id:"dataZoomX",*/
                    type: 'slider',
                    show: true,
                    /*xAxisIndex: [0],*/
                    filterMode: 'empty',
                    showDataShadow: false,
                    start: dStart,
                    end: 100,
                    backgroundColor: '#F1F4F8', dataBackgroundColor: '#F1F4F8',
                    fillerColor: "#D4EFFF",
                    height: "23px",
                    handleColor: "#4EAFEB",
                    handleSize: 28,
                    textStyle: {
                        color: "#3DA2E2",
                        fontFamily: "microsoft yahei"
                    }
                }
            ],
            xAxis: [
                {
                    /*name:"test",*/ /*在最右边*/
                    type: 'category',
                    data:monthCon,
                    axisTick: {
                        show: false,
                        alignWithLabel: true
                    },
                    axisLine: {
                        show: false/*这才是控制坐标轴的轴线的*/
                    },
                    axisLabel: {
                        show: true,
                        /* interval:0,*//*为1就会间隔显示横坐标的文字标签,设为0是强制显示所有标签*/
                        textStyle: {
                            color: '#999',
                            fontSize: 10
                        },
                        margin: 10
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            yAxis: [
                {
                    /*name:"retest", */ /*在左上角*/
                    type: 'value',
                    /*max:8,*/
                    axisLine: {
                        show: false/*这才是控制坐标轴的轴线的*/
                    },
                    axisLabel: {
                        margin: 18,
                        textStyle: {
                            color: '#999'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: "#e1e1e1",
                            width: 1
                        }
                    },
                    lineStyle: {
                        opacity: 1
                    },
                    axisTick: {
                        show: false
                    }
                }
            ],
            series: [
                {
                    name: '项目经理',
                    type: 'bar',
                    itemStyle: {
                        normal: {
                            color: '#76B6F1'
                        },
                        emphasis: {
                            /*鼠标放上去不会有高亮的效果，因为和原来的颜色一样*/
                            color: '#76B6F1'
                        }
                    },
                    barWidth: '20',
                    stack: 'two',
                    /* z:10,*/
                    data: managerProjectCount
                },
                {
                    name: '项目成员',
                    itemStyle: {
                        normal: {
                            color: '#D2E1FC'
                        },
                        emphasis: {
                            /*鼠标放上去不会有高亮的效果，因为和原来的颜色一样*/
                            color: '#D2E1FC'
                        }
                    },
                    stack: "two",
                    type: 'bar',
                    barWidth: '20',
                    /*barGap:'-100%',*/
                    data:memberProjectCount
                }
            ]
        });

        /*var echartsStyleObj = {};*/
        /**/
    };


    return projectManagement;
});

