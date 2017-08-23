!(function(){

    /**
     * 去除数组中的重复项
     * @returns {Array} 返回几个新的数组
     */
    Array.prototype.removeRepeat = function () {
        var reset = [], done = {};
        for (var i = 0; i < this.length; i++) {
            var temp = this[i];
            //这里的json对象一定要以数组的方式访问，否则会认为找不到这个对象
            if (!done[temp]) {
                done[temp] = true;
                reset.push(temp);
            }
        }
        return reset;
    };

    /**
     * 删除指定的数组
     * @param n
     * @returns {*}
     */
    Array.prototype.del = function(n)
    {
        if (n<0) return this;
        return this.slice(0,n).concat(this.slice(n+1,this.length));
    };

// 数组第一次出现指定元素值的位置
    Array.prototype.indexOf = function(o)
    {
        for (var i=0; i<this.length; i++) if (this[i]==o) return i;
        return -1;
    };

    /**
     *  检索数组元素（原型扩展或重载）
     * @param {o} 被检索的元素值
     * @type int
     * @returns 元素索引
     */
    Array.prototype.contains = function(o) {
        var index = -1;
        for(var i=0;i<this.length;i++){if(this[i]==o){index = i;break;}}
        return index;
    };

    /******************Date 对象扩展***********************/


    Date.prototype.getWeek = function () {
        var a = new Array("日", "一", "二", "三", "四", "五", "六");
        var week = new Date().getDay();
        var str = a[week];
        return str;
    };


    /**
     * 将指定的秒数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addSeconds = function (value) {
        var second = this.getSeconds();
        this.setSeconds(second + value);
        return this;
    };


    /**
     * 将指定的分钟数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addMinutes = function (value) {
        var minute = this.getMinutes();
        this.setMinutes(minute + value);
        return this;
    };


    /**
     * 将指定的小时数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addHours = function (value) {
        var hour = this.getHours();
        this.setHours(hour + value);
        return this;
    };


    /**
     * 将指定的天数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addDays = function (value) {
        var date = this.getDate();
        this.setDate(date + value);
        return this;
    };


    /**
     * 将指定的星期数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addWeeks = function (value) {
        return this.addDays(value * 7);
    };


    /**
     * 将指定的月份数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addMonths = function (value) {
        var month = this.getMonth();
        this.setMonth(month + value);
        return this;
    };

    /**
     * 将指定的年份数加到此实例的值上
     * @param value
     * @returns {Date}
     */
    Date.prototype.addYears = function (value) {
        var year = this.getFullYear();
        this.setFullYear(year + value);
        return this;
    };

    /**
     * 日期格式化（原型扩展或重载）
     * 格式 YYYY/yyyy/YY/yy 表示年份
     * MM/M 月份
     * W/w 星期
     * dd/DD/d/D 日期
     * hh/HH/h/H 时间
     * mm/m 分钟
     * ss/SS/s/S 秒
     * @param {formatStr} 格式模版
     * @type string
     * @returns 日期字符串
     */
    Date.prototype.format = Date.prototype.format || function(formatStr){
        var str = formatStr;
        var Week = ['日','一','二','三','四','五','六'];
        str=str.replace(/yyyy|YYYY/,this.getFullYear());
        str=str.replace(/yy|YY/,(this.getYear() % 100)>9?(this.getYear() % 100).toString():'0' + (this.getYear() % 100));
        str=str.replace(/MM/,(this.getMonth()+1)>9?(this.getMonth()+1).toString():'0' + (this.getMonth()+1));
        str=str.replace(/M/g,this.getMonth());
        str=str.replace(/w|W/g,Week[this.getDay()]);
        str=str.replace(/dd|DD/,this.getDate()>9?this.getDate().toString():'0' + this.getDate());
        str=str.replace(/d|D/g,this.getDate());
        str=str.replace(/hh|HH/,this.getHours()>9?this.getHours().toString():'0' + this.getHours());
        str=str.replace(/h|H/g,this.getHours());
        str=str.replace(/mm/,this.getMinutes()>9?this.getMinutes().toString():'0' + this.getMinutes());
        str=str.replace(/m/g,this.getMinutes());
        str=str.replace(/ss|SS/,this.getSeconds()>9?this.getSeconds().toString():'0' + this.getSeconds());
        str=str.replace(/s|S/g,this.getSeconds());
        return str;
    };

    /**
     * 比较日期差（原型扩展或重载）
     * @param {strInterval} 日期类型：'y、m、d、h、n、s、w'
     * @param {dtEnd} 格式为日期型或者 有效日期格式字符串
     * @type int
     * @returns 比较结果
     */
    Date.prototype.dateDiff = function(strInterval, dtEnd) {
        var dtStart = this;
        if (typeof dtEnd == 'string' ) { //如果是字符串转换为日期型
            dtEnd = StringToDate(dtEnd);
        }
        switch (strInterval) {
            case 's' :return parseInt((dtEnd - dtStart) / 1000);
            case 'n' :return parseInt((dtEnd - dtStart) / 60000);
            case 'h' :return parseInt((dtEnd - dtStart) / 3600000);
            case 'd' :return parseInt((dtEnd - dtStart) / 86400000);
            case 'w' :return parseInt((dtEnd - dtStart) / (86400000 * 7));
            case 'm' :return (dtEnd.getMonth()+1)+((dtEnd.getFullYear()-dtStart.getFullYear())*12) - (dtStart.getMonth()+1);
            case 'y' :return dtEnd.getFullYear() - dtStart.getFullYear();
        }
    };

    /**
     * 日期计算（原型扩展或重载）
     * @param {strInterval} 日期类型：'y、m、d、h、n、s、w'
     * @param {Number} 数量
     * @type Date
     * @returns 计算后的日期
     */
    Date.prototype.dateAdd = function(strInterval, Number) {
        var dtTmp = this;
        switch (strInterval) {
            case 's' :return new Date(Date.parse(dtTmp) + (1000 * Number));
            case 'n' :return new Date(Date.parse(dtTmp) + (60000 * Number));
            case 'h' :return new Date(Date.parse(dtTmp) + (3600000 * Number));
            case 'd' :return new Date(Date.parse(dtTmp) + (86400000 * Number));
            case 'w' :return new Date(Date.parse(dtTmp) + ((86400000 * 7) * Number));
            case 'q' :return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number*3, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
            case 'm' :return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
            case 'y' :return new Date((dtTmp.getFullYear() + Number), dtTmp.getMonth(), dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
        }
    };

    /**
     * daysNumber 表示当前日期往前推的天数
     * return Array
     * @param number
     */
    Date.prototype.getBeforeDate = function(daysNumber) {
        var myDate = this;
        var dateArray = [];
        for (var i = 1; i <= daysNumber; i++) {
            var tempDate = new Date(myDate.getTime() - i *24 * 3600 * 1000);
            //dateArray.push(tempDate.format('yyyy/MM/dd'));
            dateArray.push(tempDate);
        }
        return dateArray;
    };

    /**
     * daysNumber 表示当前日期往后推的天数
     * return Array
     * @param number
     */
    Date.prototype.getAfterDate = function(daysNumber) {
        var myDate = this;
        var dateArray = [];
        for (var i = 1; i <= daysNumber; i++) {
            var tempDate = new Date(myDate.getTime() + i *24 * 3600 * 1000);
            //dateArray.push(tempDate.format('yyyy/MM/dd'));
            dateArray.push(tempDate);
        }
        return dateArray;
    };

    /**
     * 取得日期数据信息（原型扩展或重载）
     * @param {interval} 日期类型：'y、m、d、h、n、s、w'
     * @type int
     * @returns 指定的日期部分
     */
    Date.prototype.datePart = function(interval){
        var myDate = this;
        var partStr='';
        var Week = ['日','一','二','三','四','五','六'];
        switch (interval)
        {
            case 'y' :partStr = myDate.getFullYear();break;
            case 'm' :partStr = myDate.getMonth()+1;break;
            case 'd' :partStr = myDate.getDate();break;
            case 'w' :partStr = Week[myDate.getDay()];break;
            case 'ww' :partStr = myDate.WeekNumOfYear();break;
            case 'h' :partStr = myDate.getHours();break;
            case 'n' :partStr = myDate.getMinutes();break;
            case 's' :partStr = myDate.getSeconds();break;
        }
        return partStr;
    };


    /**
     * 把日期分割成数组（原型扩展或重载）
     * @type array
     * @returns 日期数组
     */
    Date.prototype.toArray = function() {
        var myDate = this;
        var myArray = Array();
        myArray[0] = myDate.getFullYear();
        myArray[1] = myDate.getMonth()+1;
        myArray[2] = myDate.getDate();
        myArray[3] = myDate.getHours();
        myArray[4] = myDate.getMinutes();
        myArray[5] = myDate.getSeconds();
        return myArray;
    };

    /**
     * 判断闰年（原型扩展或重载）
     * @type boolean
     * @returns 是否为闰年 true/false
     */
    Date.prototype.isLeapYear = function() {
        return (0==this.getYear()%4&&((this.getYear()%100!=0)||(this.getYear()%400==0)));
    };

    /******************String 表单检查***********************/

    /**
     * 检查是否是URL地址
     */
    String.prototype.isURL=function(){
        var re=/http[s]?:\/\/([\w-]+.)+[\w-]+(\/[\w-./?%&=]*)?/;
        var result = re.test(this);
        return result;
    };

    /**
     * 检查表单是否是email字符串
     */
    String.prototype.isEmail=function(){
        var re=/\w+([-+.]\w+)*@\w+([-.]\w+)*.\w+([-.]\w+)*/;
        var result = re.test(this);
        return result;
    };

    /**
     * 检查号码，正确格式为：XXXX-XXXXXXX，XXXX-XXXXXXXX，XXX-XXXXXXX，XXX-XXXXXXXX，XXXXXXX，XXXXXXXX
     */
    String.prototype.isPhoneNumber=function(){
        var re=/^((\d{3,4})|\d{3,4}-)?\d{7,8}$/;
        var result = re.test(this);
        return result;
    };


    /******************String 数字检查***********************/
    /**
     * 获取字符串长度（原型扩展或重载）
     * @type int
     * @returns 字符串长度
     */
    String.prototype.len = function() {
        var arr=this.match(/[^\x00-\xff]/ig);
        return this.length+(arr==null?0:arr.length);
    };


    /**
     * //检查是否是浮点数，包括0，包括正浮点数  负浮点数
     * @returns {boolean}
     */
    String.prototype.isFloat=function(){
        var re=/^-?([1-9]\d*.\d+|0.\d*[1-9]\d*|0?.0+|0)$/;
        var result = re.test(this);
        return result;
    };


    /**
     * //检查是否是非负浮点数，包括0
     * @param isContainZero
     * @returns {boolean}
     */
    String.prototype.isFloatNegativ=function(isContainZero){
        if(isContainZero){
            var re=/(^-([1-9]\d*.\d+|0.\d*[1-9]\d*)$)|(0)/;
            var result = re.test(this);
            return result;
        }else{
            var re=/^-([1-9]\d*.\d+|0.\d*[1-9]\d*)$/;
            var result = re.test(this);
            return result;
        }
    };


    /**
     * //检查是否是正浮点数，包括0
     * @param isContainZero
     * @returns {boolean}
     */
    String.prototype.isFloatPositive=function(isContainZero){

        if(isContainZero){
            var re=/^[1-9]\d*.\d+|0.\d*[1-9]\d*|0?.0+|0$/;
            var result = re.test(this);
            return result;
        }else{
            var re=/^[1-9]\d*.\d+|0.\d*[1-9]\d*$/;
            var result = re.test(this);
            return result;
        }
    };


    /**
     * //检查是否是整数，包括0，正整数，负整数
     * @returns {boolean}
     */
    String.prototype.isInt = function(){
        var re=/^-?\d+$/;
        var result = re.test(this);
        return result;
    };

    /**
     * 检查是否是正整数
     * isContainZero 是否包含0
     */
    String.prototype.isIntPositive = function(isContainZero){
        if(isContainZero){
            var re=/(^[0-9]*[1-9][0-9]*$)|(0)/;
            var result = re.test(this);
            return result;
        }else{
            var re=/^[0-9]*[1-9][0-9]*$/;
            var result = re.test(this);
            return result;
        }
    };

    /**
     * 检查是否是负整数
     * isContainZero 是否包含0
     */
    String.prototype.isIntNegativ = function(isContainZero){
        if(isContainZero){
            var re=/(^-[0-9]*[1-9][0-9]*$)|(0)/;
            var result = re.test(this);
            return result;
        }else{
            var re=/^-[0-9]*[1-9][0-9]*$/;
            var result = re.test(this);
            return result;
        }
    };

    /******************String***********************/

    /**
     * //检查字符串是否是指定字符串开头，返回true 和 false
     * @param str
     * @returns {boolean}
     */
    String.prototype.isStartWith=function(str){
        var reg=new RegExp("^"+str);
        return reg.test(this);
    };

    /**
     * //检查字符串是否是指定字符串结尾，返回true 和 false
     * @param str
     * @returns {boolean}
     */
    String.prototype.isEndWith=function(str){
        var reg=new RegExp(str+"$");
        return reg.test(this);
    };


    /**
     * //一个单词首字母大写,返回字符串
     * @returns {string}
     */
    String.prototype.capitalize=function(){
        var result = this.charAt(0).toUpperCase()+this.substring(1).toLocaleLowerCase();
        return result;
    };

    /**
     * // 保留字母和空格,返回字符串
     * @returns {string}
     */
    String.prototype.getEn = function() {
        var result = this.replace(/[^A-Z a-z]/g, "");
        return result;
    };

    /**
     * //逆序
     * @returns {string}
     */
    String.prototype.reverse = function() {
        return this.split("").reverse().join("");
    };

    /**
     * //检查字符串是否包含自定字符串，返回true 和 false
     * @param target
     * @returns {boolean}
     */
    String.prototype.isContains=function(target){
        var myReg = new RegExp(target);
        var result = myReg.test(this);
        return result;
    };

    /**
     * //去除两边的空格,返回字符串
     * @returns {string}
     */
    String.prototype.trim = function() {
        var result = this.replace(/^\s+|\s+$/g, "");
        return result;
    };

    /**
     * // 除去左边空白,返回字符串
     * @returns {string}
     */
    String.prototype.trimLeft = function() {
        return this.replace(/^\s+/g, "");
    };

    /**
     * // 除去右边空白,返回字符串
     * @returns {string}
     */
    String.prototype.trimRight = function() {
        return this.replace(/\s+$/g, "");
    };

    /**
     * // 去除所有的空白
     * @returns {string}
     */
    String.prototype.delBlank = function() {
        var result = this.replace(/\s+/g, "");
        return result;
    };
    /**
     * 字符串转换为日期型（原型扩展或重载）
     * @type Date
     * @returns 日期
     */
    String.prototype.toDate = function() {
        var converted = Date.parse(this);
        var myDate = new Date(converted);
        if (isNaN(myDate)) {
            var arys= this.split('-');
            myDate = new Date(arys[0],--arys[1],arys[2]);
        }
        return myDate;
    };


    /**
     * //将json字符串转为json对象
     * @returns {*}
     */
    String.prototype.toJson=function(){
        return (new Function("return " + this))();
    };

    var klwTools = function(){};

    /**
     * 将JSON对象转为字符串，
     * 调试JSON字符串
     */
    klwTools.obj2str = function(o){
        var r = [];
        if(typeof o =="string") return "\""+o.replace(/([\'\"\\])/g,"\\$1").replace(/(\n)/g,"\\n").replace(/(\r)/g,"\\r").replace(/(\t)/g,"\\t")+"\"";
        if(typeof o =="undefined") return "undefined";
        if(typeof o == "object"){
            if(o===null) return "null";
            else if(!o.sort){
                for(var i in o)
                    r.push(i+":"+obj2str(o[i]))
                r="{"+r.join()+"}"
            }else{
                for(var i =0;i<o.length;i++)
                    r.push(obj2str(o[i]))
                r="["+r.join()+"]"
            }
            return r;
        }
        return o.toString();
    };


    /**
     * //将json对象转为String
     * @param o 为JSON对象
     * @returns {string}
     * @constructor
     */
    klwTools.JsonToString = function(o) {
        var arr = [];
        var fmt = function(s) {
            if (typeof s == 'object' && s != null) return JsonToStr(s);
            return /^(string)$/.test(typeof s) ? '"' + s + '"' : s;
        }
        for (var i in o)
            arr.push("'" + i + "':" + fmt(o[i]));
        return '{' + arr.join(',') + '}';
    };

    /**
     * //历史回退到上一个链接地址
     */
    klwTools.goBack = function(){
        window.history.go(-1);
    };

    /**
     * //页面跳转转到target属性指明的链接，obj代表控件this
     * @param obj
     */
    klwTools.jumpTo = function(obj){
        var _href = obj.getAttribute("target");
        window.location.href = _href;
    };

    /**
     * //获取屏幕宽度
     * @returns {number}
     */
    klwTools.getScreenWidth = function(){
        return document.documentElement.clientWidth;
    };

    /**
     * //获取屏幕高度
     * @returns {number}
     */
    klwTools.getScreenHeight = function(){
        return document.documentElement.clientHeight;
    };

    /**
     * //只允许输入数字
     * @param obj 为控件对象
     * @param event 为触发的事件
     */
    klwTools.numberInputOnly = function(obj,event){
        if(obj.value.length==1){
            obj.value=obj.value.replace(/[^1-9]/g,'');
        }else{
            obj.value=obj.value.replace(/\D/g,'');
        }
    };

    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return klwTools;
        });
    } else {
        window.klwTools = klwTools;
    }

})();
