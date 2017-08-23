/**
 * Created by Sasha on 2017/2/8.
 */
define(["JQuery","BaseClass","layer","artTemplate","bootstrap","config"], function($,BaseClass,layer,template) {

    var asset = inherit(BaseClass.prototype);
    //当前所查看报表所属员工信息
    var userInfo = JSON.parse(sessionStorage.getItem('reportUserInfo'));

    asset.init = function(){

        //添加最大化最小化图标
        var obj = {
            "id":"assetStatement",
            "pageUrl":"./assetStatement.html?token="+asset.getParameter().token+"&companyId="+asset.getParameter().companyId,
            "pageName":"资产记录"
        };
        asset.navigation_top(obj);

        /*
        * 添加头部当前所查看的报表所属员工信息
        * */
        var html = '<div class="reviewUser"><span><img src="../../images/personalStatement/avatar.svg"></span><span class="viewUserName">'+userInfo.name+'</span></div>';
        $('#assetStatement .navigation_block').append(html);
        if(sessionStorage.getItem('isPCWeb') == 'false'){
            $('#assetStatement .reviewUser .viewUserName').css('border-right','1px solid #E1E1E1');
        }

        this.event();
        $('.assetList .nav-tabs a[href="#currentAsset"]').trigger('click');
        sessionStorage.removeItem('filterAssetList');
    };

    asset.event = function(){
        //切换导航标签
        $('.assetList .nav-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
            switch($(this).text()){
                case '当前领用资产':
                    $('#assetStatement .exportList').css('display','block');
                    $('#currentAsset .fixed_head').css('width',$('#currentAsset .fixed_head').next().width());
                    break;
                case '历史领用资产':
                    $('#assetStatement .exportList').css('display','none');
                    $('#historicalAsset .fixed_head').css('width',$('#historicalAsset .fixed_head').next().width());
                    break;
            }
        });

        /*//资产使用成本提示框  - 已取消
        $('.assetList .useCostIntroduction').popover({
            content:'<span>资产使用成本根据资产原值、净残值率、使用期限、使用时长，按照直线折旧法预估，具体计算规则为资产使用成本 = </span>'
                    +'<span class="calculateMethod">资产原值*（1-净残值率）/使用期限(月)/30*使用时长（天）</span>',
            html:true,
            placement:'top',
            trigger:'hover'
        });*/

        loadAssetList();
        //加载领用资产列表以及资产分类列表
        function loadAssetList(){
            var param = [
                {
                    repName:"getAssetList",
                    repCondition:{where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"status",oper:"eq",value:"0"}
                    ]}
                },
                {
                    repName:"getAssetHistoryList",
                    repCondition:{where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"status",oper:"eq",value:"1"}
                    ]}
                },
                {
                    repName:"getAssetTypeList",
                    repCondition:{where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"status",oper:"eq",value:"1"}
                    ]}
                }
            ];
            asset._ajax({
                url: '/worksheet/report.json'/*'/report_web/js/personalStatement/assetStatement/asset.json'*/,
                data: { rep : JSON.stringify(param) },
                token: asset.getParameter().token,
                success:function(res){
                    if(res.code == 1){
                        var currentList = [];
                        var historyList = [];
                        var typeList = [];
                        $.each(res.data, function (index, value) {
                            if(value['repName']=='getAssetList'){
                                currentList = (value['repResult']!=null?value['repResult']:[]);
                            }else if(value['repName']=='getAssetHistoryList'){
                                historyList = (value['repResult']!=null?value['repResult']:[]);
                            }else if(value['repName']=='getAssetTypeList'){
                                typeList = (value['repResult']!=null?value['repResult']:[]);
                            }
                        });
                        $('#historicalAsset .assetTypeMenu').html(template('assetTypeMenu', {data: typeList}));
                        var currentListSorted = bubbleSort(currentList,'receiveTime',1);
                        var historyListSorted = bubbleSort(historyList,'receiveTime');
                        var assetList = {'currentList':currentListSorted,historyList:historyListSorted};
                        sessionStorage.setItem('assetList',JSON.stringify(assetList));
                        loadCurrentAssetList(currentListSorted);
                        loadHistoricalAssetList(historyListSorted);
                    }else{
                        layer.msg(res.message?res.message:'网络错误，请稍后重试', {time: 1000});
                    }
                }
            });
        }

        /*加载当前领用资产列表*/
        function loadCurrentAssetList(currentList){
            if(currentList.length == 0){
                $('#assetStatement .exportList').remove();
                $('#currentAsset .assetListTable').html('<div><p><img src="../../images/personalStatement/icon_zanwuzichanpeitu.svg" alt=""></p><p>当前未领用资产</p></div>')
                $('#currentAsset .dataStatistic').html('');
            }else{
                var totalValue = 0;
                for(var i=0; i<currentList.length; i++) {
                    if(currentList[i].valWorth){
                        totalValue += currentList[i].valWorth;
                        currentList[i].valWorth = formatNum(currentList[i].valWorth);
                    }
                    if(currentList[i].expectReturnTime && dateStringToMS(currentList[i].expectReturnTime) < dateStringToMS(new Date().format('yyyy-MM-dd'))){
                        currentList[i].isOverDue = true;
                    }
                    $.each(currentList[i], function (key, value) {
                        if((value===null || value === '')&&(key!='isLive'||key!='isRepair')){
                            currentList[i][key] = '—';
                        }
                    });
                }
                $('#currentAsset .assetListTable tbody').html(template('currentAssetList', {data: currentList}));
                $('#currentAsset .dataStatistic').html('<span class="totalCount">数量<span class="dataValue">'+ currentList.length +'</span></span><span>资产原值 <span class="dataValue">'+ formatNum(totalValue) +'元</span></span>');
                $('#currentAsset .fixed_head').css('width',$('#currentAsset .fixed_head').next().width());
            }
        }

        /*加载历史领用资产列表*/
        function loadHistoricalAssetList(historyList,sortNum){
            if(!sortNum && historyList.length == 0){
                $('#historicalAsset .assetListTable').html('<div><p><img src="../../images/personalStatement/icon_zanwuzichanpeitu.svg" alt=""></p><p>历史无领用资产</p></div>')
                $('#historicalAsset .dataStatistic').html('');
            }else{
                var totalValue = 0;
                for(var i=0; i<historyList.length; i++) {
                    if(historyList[i].valWorth){
                        totalValue += historyList[i].valWorth;
                        historyList[i].valWorth = formatNum(historyList[i].valWorth);
                    }
                    if(historyList[i].expectReturnTime && dateStringToMS(historyList[i].expectReturnTime) < dateStringToMS(new Date().format('yyyy-MM-dd'))){
                        historyList[i].isOverDue = true;
                    }
                }
                $('#historicalAsset .assetListTable tbody').html(template('historicalAssetList', {data: historyList}));
                $('#historicalAsset .dataStatistic').html('<span class="totalCount">数量<span class="dataValue">'+ historyList.length +'</span></span><span>资产原值 <span class="dataValue">'+ formatNum(totalValue) +'元</span></span>');
            }
        }

        //导出当前资产列表
        $('#assetStatement').off('click','.exportList').on('click','.exportList',function(){
            var exportParam ={
                    repName:"getAssetList",
                    repCondition:{where:[
                        {name:"user_id",oper:"eq",value:userInfo.userId},
                        {name:"status",oper:"eq",value:"0"}
                    ]}
                };
            location.href = asset.getLocalhostPort() + '/worksheet/export.json?rep='+JSON.stringify(exportParam);
        });

        //资产列表排序; column为排序字段，若参数type存在则升序排列，默认按降序排列
        function bubbleSort(arr,column,type) {
            var i = arr.length, j;
            var tempExchangVal;
            while (i > 0) {
                for (j = 0; j < i - 1; j++) {
                    var flag = dateStringToMS(arr[j][column]) < dateStringToMS(arr[j + 1][column]);
                    if(type){
                        flag = dateStringToMS(arr[j][column]) > dateStringToMS(arr[j + 1][column]);
                    }
                    if (flag) {
                        tempExchangVal = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = tempExchangVal;
                    }
                }
                i--;
            }
            return arr;
        }

        //资产列表数据筛选，传参当前列表，以及要筛选的字段
        function filterAssetList(assetList,filter){
            var filterList = [];
            for(var i=0; i < assetList.length;i++){
                for(var j=0; j<filter.length; j++){
                    if( assetList[i].assetTypeName === filter[j] ){
                        filterList.push(assetList[i]);
                    }
                }
            }
            return filterList;
        }

        //当前领用资产列表排序
        $('#assetStatement #currentAsset').off('click','.fixed_head .sortColumn').on('click','.fixed_head .sortColumn', function(){
            $(this).toggleClass('ascending');
            var currentList = JSON.parse(sessionStorage.getItem('assetList')).currentList;
            if(!$(this).hasClass('ascending')){
                currentList = bubbleSort(currentList,'receiveTime');
            }
            loadCurrentAssetList(currentList);
        });

        //历史领用资产列表排序
        $('#assetStatement #historicalAsset').off('click','.fixed_head .sortColumn').on('click','.fixed_head .sortColumn', function(){
            $(this).addClass('active').siblings().removeClass('active');
            $(this).toggleClass('ascending').siblings().removeClass('ascending');
            var historyList;
            if(sessionStorage.getItem('filterAssetList')){
                historyList = JSON.parse(sessionStorage.getItem('filterAssetList'));
            }else{
                historyList = JSON.parse(sessionStorage.getItem('assetList')).historyList;
            }
            var sortColumn = $(this).text()=='领用时间'?'receiveTime':'returnTime';
            if($(this).hasClass('ascending')){
                historyList = bubbleSort(historyList,sortColumn,1);
            }else if(sortColumn=='receiveTime'){
                historyList = bubbleSort(historyList,sortColumn);
            }
            loadHistoricalAssetList(historyList,1);
        });

        //历史领用资产筛选
        $('#assetStatement').on('click','#assetCategory',function () {
            $('#assetStatement .assetTypeMenu').toggle();
        });
        //点击空白处关闭筛选框
        $(document).on('click',function(event){
            if (!$('#assetCategory').is(event.target) && $('#assetCategory').has(event.target).length === 0 &&
                !$('.assetTypeMenu').is(event.target) && $('.assetTypeMenu').has(event.target).length === 0) {
                $('#assetStatement .assetTypeMenu').css('display','none');
            }
        });

        //历史领用资产筛选：实时刷新列表 - 全选
        $('#assetStatement').off('click','.assetTypeMenu .selectAll').on('click','.assetTypeMenu .selectAll',function(){
            sessionStorage.removeItem('filterAssetList');
            $(this).toggleClass('checked_y');
            if($(this).hasClass('checked_y')){
                $('#assetStatement .assetTypeItem .kx-checkbox').addClass('checked_y');
                var historyList = JSON.parse(sessionStorage.getItem('assetList')).historyList;
                var sortColumn = $('#historicalAsset .sortColumn.active').text()=='退库时间'?'returnTime':'receiveTime';
                if($('#historicalAsset .sortColumn.active').hasClass('ascending')){
                    historyList = bubbleSort(historyList,sortColumn,1);
                }else if(sortColumn=='receiveTime'){
                    historyList = bubbleSort(historyList,sortColumn);
                }
                loadHistoricalAssetList(historyList);
            }else{
                $('#assetStatement .assetTypeItem .kx-checkbox').removeClass('checked_y');
                loadHistoricalAssetList([],1);
            }
        });

        //历史领用资产筛选：实时刷新列表 - 单个勾选
        $('#assetStatement').off('click','.assetTypeItem .kx-checkbox').on('click','.assetTypeItem .kx-checkbox',function(){
            $(this).toggleClass('checked_y');
            if($('#assetStatement .assetTypeItem .checked_y').length < $('#assetStatement .assetTypeItem .kx-checkbox').length){
                $('#assetStatement .assetTypeMenu .selectAll').removeClass('checked_y');
                if($('#assetStatement .assetTypeItem .checked_y').length == 0){
                    loadHistoricalAssetList([],1);
                }else{
                    var filterType = [];
                    for(var i=0; i<$('#assetStatement .assetTypeItem .checked_y').length; i++){
                        filterType.push($('#assetStatement .assetTypeItem .checked_y').eq(i).next().text());
                    }
                    var historyList = JSON.parse(sessionStorage.getItem('assetList')).historyList;
                    historyList = filterAssetList(historyList,filterType);
                    //如果当前列表为筛选后的列表，另存筛选后的数据对象
                    sessionStorage.setItem('filterAssetList',JSON.stringify(historyList));
                    var sortColumn = $('#historicalAsset .sortColumn.active').text()=='退库时间'?'returnTime':'receiveTime';
                    if($('#historicalAsset .sortColumn.active').hasClass('ascending')){
                        historyList = bubbleSort(historyList,sortColumn,1);
                    }else if(sortColumn=='receiveTime'){
                        historyList = bubbleSort(historyList,sortColumn);
                    }
                    loadHistoricalAssetList(historyList,1);
                }
            }else{
                $('#assetStatement .assetTypeMenu .selectAll').trigger('click');
            }
        });

        //已逾期文本提示
        $('#assetStatement').on('mouseover mouseout','.isOverDue', function(event){
            if(event.type=='mouseover'){
                var leftPx = $(this).position().left - 20,
                    topPx = $(this).position().top+20;
                $('#assetStatement .hintMsg').css({
                    "display": "block",
                    "left": leftPx,
                    "top": topPx
                });
            }else if(event.type=='mouseout'){
                $('#assetStatement .hintMsg').css('display', 'none');
            }
        });

        //窗口大小改变时，改变固定表头大小
        window.onresize = function(){
            $('#currentAsset .fixed_head').css('width',$('#currentAsset .fixed_head').next().width());
            $('#historicalAsset .fixed_head').css('width',$('#historicalAsset .fixed_head').next().width());
        }

    };

    return asset;
});

/*时间字符串转毫秒*/
function dateStringToMS(dateStr,flag){
    var newStr = dateStr.replace(new RegExp("-","gm"),"/");
    var miSec = (new Date(newStr)).getTime();
    //参数2为true则返回时间戳秒数
    return flag === true ? (miSec/1000) : miSec;
}

/*数字类型转换为带逗号的货币格式*/
var formatNum = function(num){
    var str = num.toString();
    var pointNum = '';
    if(str.indexOf('.')!=-1){
        pointNum = '.' + str.split('.')[1];
        str = str.split('.')[0];
    }
    var n = str.length % 3;
    if(n){
        return str.slice(0,n) + str.slice(n).replace(/(\d{3})/g,',$1') + pointNum;
    }else{
        return str.replace(/(\d{3})/g,',$1').slice(1) + pointNum;
    }
};