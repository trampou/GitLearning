define(["JQuery",'bootstrap','bs-datetimepicker','bs-datetimepicker-zh-CN'], function($){
    //初始化通用原型扩展
    var commonInit = function(){
        //格式化Date对象成字符串
        Date.prototype.format = Date.prototype.format || function(fmt){
            var o = {
                "M+" : this.getMonth()+1,                 //月份
                "d+" : this.getDate(),                    //日
                "h+" : this.getHours(),                   //小时
                "m+" : this.getMinutes(),                 //分
                "s+" : this.getSeconds(),                 //秒
                "q+" : Math.floor((this.getMonth()+3)/3), //季度
                "S"  : this.getMilliseconds()             //毫秒
            };
            if(/(y+)/.test(fmt))
                fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
            for(var k in o)
                if(new RegExp("("+ k +")").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
            return fmt;
        }
    };

    //字符串转日期对象
    var getDateByStrDate = function (strDate){
        //切割年月日与时分秒称为数组
        var s = strDate.split(" ");
        var s1 = s[0].split("-");

        if(s[1] == undefined || s[1] == null || s[1] == ''){
            return new Date(s1[0], s1[1] - 1, s1[2]);
        }else{
            var s2 = s[1].split(":");
            if (s2.length == 2) {
                s2.push("00");
            }
            return new Date(s1[0], s1[1] - 1, s1[2], s2[0], s2[1], s2[2]);
        }
    };

    //日期控件绑定
    var dateTimePickerBind = function(option){
        //定义默认初始化参数
        var _default = {
            datePicker:'', //根据官方文档上传入应传入的选择器
            dateInput:'', //当前的input选择器
            relateInput:'', //有需要则传入相关联的input选择器
            type:-1, //有需要则配合上一个属性传入0(作为开始时间)或者1(作为结束时间)
            position:'bottom', //所显示的位置top，或者bottom
            startDate:false, //如有需要可传入一个开始的日期对象限制选择
            endDate:false, //如有需要可传入一个结束的日期对象限制选择
            timePosition:'bottom', //时间点选择部分的位置,top或者bottom
            scrollContainer:'' //如果有外部滚动区域，则传入滚动区域选择器,避免滚动引发时间选择器位置样式BUG
        };
        //继承传参
        $.extend(_default,option);

        //封装操作对象
        var $datePicker = $(_default.datePicker);
        var $dateInput = $(_default.dateInput);
        var $relateInput = null;
        var $wrapScrollBox = null;

        //获取关联日期input元素
        if(_default.relateInput != '' && _default.type != -1){
            $relateInput = $(_default.relateInput);
        }

        if(_default.scrollContainer !== ''){
            $wrapScrollBox = $(_default.scrollContainer);
        }

        //初始化配置控件(先释放再重新绑定避免多次绑定)
        $datePicker.datetimepicker('remove');
        $datePicker.datetimepicker({
            language: 'zh-CN',
            weekStart: 0,
            todayBtn: 0,
            startView: 2,
            minView:2,
            maxView:4,
            autoclose: 0,
            todayHighlight: 1,
            showMeridian: 0,
            format: 'yyyy-mm-dd',
            pickerPosition:_default.position + '-right'
        });

        //用于控制一次性的初始化项
        var flag = 0;
        var $picker = null; //天视图的jq引用
        var $timeInput = null;//时间点文本的jq引用
        var $timeSelect = null; //时间选择器的jq引用
        var tmpDateStr = new Date().format('yyyy-MM-dd'); //用于临时记录清除之前的日期字符串
        $datePicker.datetimepicker().off('show').on('show',function(e){
            $datePicker.datetimepicker('update');

            if(flag == 0){
                //当时间选择器显示出来的时候给一个专属id,方便后期用于控制
                $('.datetimepicker:visible:not(.datetimepicker-inline)').attr('data-id',_default.datePicker);

                //如果展示出来的时间选择器内不包含自定义的底部操作区域就追加一个底部操作区域
                $picker = $('.datetimepicker[data-id="'+_default.datePicker+'"] .datetimepicker-days');
                var picker = $picker[0];
                var myArea = $('div.footer')[0];
                if(!$.contains(picker,myArea)){
                    $picker.append('<div class="wp-footer">' +
                        '<input type="text" class="wp-timeInput" value="00:00" readonly/>'+
                        '<select class="wp-timeSelect" size="10" style="display: none"></select>' +
                        '<button type="button" class="btn ensure">确定</button>' +
                        '<button type="button" class="btn clear">清除</button>' +
                        '</div>');

                    var html = '';
                    for(var i = 0;i < 24;i++){
                        var tmp = i;
                        //格式化两位数的分钟显示
                        if(tmp < 10){
                            tmp = '0'+tmp;
                        }

                        html += '<option value="'+(tmp + ':00')+'" '+ (tmp == '00' ? 'selected':'') +'>'+(tmp + ':00')+'</option><option value="'+(tmp + ':30')+'">'+(tmp + ':30')+'</option>'
                    }
                    $picker.find('.wp-timeSelect').html(html);
                    //赋值引用
                    $timeInput = $picker.find('.wp-timeInput');
                }
                
                $timeInput.off('click').on('click',function(e){
                    if($timeSelect.css('display') == 'none'){
                        var datetimepickerTop = $('.datetimepicker:visible').position().top;
                        var tInputTop = $timeInput.position().top;
                        var winHeight = window.innerHeight;
                        if(datetimepickerTop + tInputTop + 36 + 192 >= winHeight){
                            // $timeSelect.css('bottom','-192px');
                            $timeSelect.css('bottom','36px');
                        }

                        $timeSelect.show();
                    }else{
                        $timeSelect.hide();
                    }
                });

                //自定义操作块部署完毕后绑定select时间点选项的事件
                $timeSelect = $('.datetimepicker[data-id="'+_default.datePicker+'"] .datetimepicker-days .wp-timeSelect');

                //处理时间点选择器的位置,向上展开还是向下展开
                if(_default.timePosition == 'top'){
                    $timeSelect.css('bottom','36px');
                }

                $timeSelect.off('click').on('click',function(e){
                    $(this).hide();
                }).off('change').on('change',function(e){
                    //获取input元素中的日期部分字符串
                    var value = $dateInput.val().split(' ')[0];
                    var timeValue = $(this).val();

                    //如果字符串不为空才去拼接完整时间字符串
                    if(value != ''){
                        $dateInput.val(value + " " + timeValue);
                        $timeInput.val(timeValue);//同时赋值到时间点input元素上

                        //如果select改变的时候有关联的时间input元素,就对关联的input元素进行赋值
                        if(_default.relateInput != ''){
                            //获取关联元素的值
                            var relateValue = $relateInput.val();
                            if(_default.type == 0 && relateValue == ''){
                                /*var dateStr = value;
                                 var time = '';
                                 //如果选择的时间点正好是23点30的话关联的时间需要进行日期的判断调整
                                 if($(this).val() == '23:30'){
                                 //重新获取日期部分构造日期对象
                                 var date = getDateByStrDate(dateStr);
                                 //将日期加一天
                                 date.setDate(date.getDate()+1);
                                 //格式化日期
                                 dateStr = date.format('yyyy-MM-dd');
                                 time = "0:00";
                                 }else{
                                 //获取30分钟后的时间点拼接到关联input元素中
                                 time = $(this).find('option[value="'+$(this).val()+'"]').next().val();
                                 }

                                 $relateInput.val(dateStr + ' ' + time);*/
                            }else if(_default.type == 1){
                                //以后可能会追加结束时间改变关联到开始的时间
                            }
                        }
                    }else{
                        //可能以后需要在此处添加其它代码
                        $timeInput.val(timeValue);//同时赋值到时间点input元素上
                    }

                    //关闭select到原始状态
                    $(this).trigger('blur');
                });

                var $myOperateArea = $picker.find('.wp-footer');
                //确定时间选择
                $myOperateArea.find('.ensure').off('click').on('click',function(e){
                    $datePicker.datetimepicker('hide');

                    //如果被清空之后再点击的确定就获取默认值
                    if($dateInput.val() == ''){
                        //如果点击确定的时候是空的就默认当前值
                        $dateInput.val(tmpDateStr + ' ' + $timeSelect.val());

                        //同时如果作为开始日期的时候就联动结束日期
                        if(_default.type == 0){
                            var dateStr = tmpDateStr;
                            //如果本身时间点到了最后一个时间点则关联时间跨1天
                            if($timeInput.val() == '23:30'){
                                //重新获取日期部分构造日期对象
                                var date = getDateByStrDate(dateStr);
                                //将日期加一天
                                date.setDate(date.getDate()+1);
                                //格式化日期
                                dateStr = date.format('yyyy-MM-dd');
                                time = "0:00";
                            }else{
                                //获取30分钟后的时间点拼接到关联input元素中
                                time = $timeSelect.find('option[value="'+$timeInput.val()+'"]').next().val();
                            }

                            $relateInput.val(dateStr + ' ' + time);
                        }
                    }else{ //如果本身有值的话再进行其它判断
                        if(_default.relateInput != '' && _default.type == 0){
                            //有关联且关联元素为空的时候才联动
                            if($relateInput.val() == ''){
                                var dateStr = $dateInput.val().split(' ')[0];
                                if($timeInput.val() == '23:30'){
                                    //重新获取日期部分构造日期对象
                                    var date = getDateByStrDate(dateStr);
                                    //将日期加一天
                                    date.setDate(date.getDate()+1);
                                    //格式化日期
                                    dateStr = date.format('yyyy-MM-dd');
                                    time = "0:00";
                                }else{
                                    //获取30分钟后的时间点拼接到关联input元素中
                                    time = $timeSelect.find('option[value="'+$timeInput.val()+'"]').next().val();
                                }

                                $relateInput.val(dateStr + ' ' + time);
                            }
                        }
                    }
                });

                //清除时间选择
                $myOperateArea.find('.clear').off('click').on('click',function(e){
                    var tDate = $dateInput.val().split(' ')[0];
                    if(tDate != '' && tDate != null && tDate != undefined){
                        tmpDateStr = $dateInput.val().split(' ')[0];
                    }

                    $dateInput.val('');
                    //判断如果关联的时间选择器存在就联动
                    // if(_default.relateInput != ''){
                    //     $relateInput.val('');
                    // }
                });

                if(_default.scrollContainer != ''){
                    //控制显示出来的时间选择器在滚动的时候不跑偏
                    $wrapScrollBox.on('scroll',function(e){
                        //获取当前的时间选择器,因为同一元素同一事件只能绑定一次，所以需要通过当前显示的选择块去判断对应绑定的picker偏移
                        var $curPickerBox = $('.datetimepicker:visible:not(.datetimepicker-inline)');
                        //获取当前时间选择器上的自定义id
                        var id = $curPickerBox.attr('data-id');
                        //获取当前id对应的picker选择器对象，通过对应偏移重置选择块的位置
                        var $curPicker = $(id);
                        var top = $curPicker.offset().top + 30;

                        $curPickerBox.css({
                            'top':top + 'px'
                        });
                    });
                }
                
                flag = 1;
            }

            //时间选择器显示出来后如果本身没值才跳转到今天
            var value = $dateInput.val();
            if(value == ''){
                //$datePicker.datetimepicker('update', new Date());

                //如果是开始时间的话就进行初始化赋值
                if(_default.type == 0 || _default.type == -1){
                    var value = $dateInput.val().split(' ')[0];
                    var time = $timeSelect.val();
                    $dateInput.val(value + ' ' + time);

                    //初始化的时候如果存在关联input日期元素也对关联的日期进行赋值
                    /*if(_default.relateInput != ''){
                     var date = value;
                     var time = $timeSelect.find('option[value="' + $timeSelect.val()+'"]').next().val();
                     $relateInput.val(date + ' ' + time);
                     }*/
                }else if(_default.type == 1){
                    //如果开始时间有值则重新赋值，如果没值就赋空
                    var startValue = $relateInput.val();
                    if(startValue != ''){
                        var dateStr = startValue.split(' ')[0];
                        var selectTime = startValue.split(' ')[1];
                        var time = '';
                        //如果选择的时间点正好是23点30的话关联的时间需要进行日期的判断调整
                        if(selectTime == '23:30'){
                            //重新获取日期部分构造日期对象
                            var date = getDateByStrDate(dateStr);
                            //将日期加一天
                            date.setDate(date.getDate()+1);
                            //格式化日期
                            dateStr = date.format('yyyy-MM-dd');
                            time = "0:00";
                        }else{
                            //获取30分钟后的时间点拼接到本身input元素中
                            time = $timeSelect.find('option[value="'+ selectTime +'"]').next().val();
                            $timeSelect.val(time);
                        }

                        $dateInput.val(dateStr + ' ' + time);
                    }else{
                        $dateInput.val('');
                    }
                }
	
	            $dateInput.val('');
            }else{
                //如果本来input中不为空的话就按原值算
                var time = value.split(' ')[1];
                $dateInput.val(value);
                $timeSelect.val(time);
            }

            //让时间点input元素和select的选择值统一
            var timeInputValue = $timeSelect.val();
            if(timeInputValue === null || timeInputValue === ''){
            	timeInputValue = '00:00';
            }
            $timeInput.val(timeInputValue);

            if(_default.startDate != false){
                $datePicker.datetimepicker('setStartDate',_default.startDate);
            }

            if(_default.endDate != false){
                $datePicker.datetimepicker('setEndDate',_default.endDate);
            }

            scrollListen({
                picker:$dateInput,
                scrollBox:_default.scrollContainer,
                scrollEle:'.datetimepicker:visible',
                pos:_default.position
            });
        }).off('changeDate').on('changeDate',function(e){
            var value = $dateInput.val().split(' ')[0];
            if(value != ''){
                //时间选择被改变后重新拼接select中的时间点到input元素中
                $dateInput.val(value + " " + $timeSelect.val());
            }

            //如果select改变的时候有关联的时间input元素,就对关联的input元素赋值
            /*if(_default.relateInput != ''){
             var relateValue = $relateInput.val();
             //当作为开始时间的时候且结束时间没有值的时候才初始化联动
             if(_default.type == 0 && relateValue == ''){
             var dateStr = value;
             var time = '';
             //如果选择的时间点正好是23点30的话关联的时间需要进行日期的判断调整
             if($timeSelect.val() == '23:30'){
             //重新获取日期部分构造日期对象
             var date = getDateByStrDate(dateStr);
             //将日期加一天
             date.setDate(date.getDate()+1);
             //格式化日期
             dateStr = date.format('yyyy-MM-dd');
             time = "0:00";
             }else{
             //获取30分钟后的时间点拼接到关联input元素中
             time = $timeSelect.find('option[value="'+$timeSelect.val()+'"]').next().val();
             }

             $relateInput.val(dateStr + ' ' + time);
             }else if(_default.type == 1){
             //以后可能会追加结束时间改变关联到开始的时间
             }
             }*/
        }).off('hide').on('hide',function(e){
            //获取当前时间input的值进行判断
            var value = $dateInput.val().split(' ')[0];
            //隐藏时间点下拉框
            $timeSelect.hide();

            //如果不为空则拼接自定义的时间点
            if(value != ''){
                $dateInput.val(value + " " + $timeInput.val());
            }

            if(_default.scrollContainer != ''){
                //避免选择器未显示的时候滚动报错
                $wrapScrollBox.off('scroll');
            }
        });

        //使input元素点击可以重复弹出日期控件
        $dateInput.off('click').on('click',function(){
            $datePicker.datetimepicker('show');

            //避免其它时间选择器影响到本选择器的显示防止出BUG
            $('.datetimepicker:not([data-id="'+_default.datePicker+'"],.datetimepicker-inline)').hide();
        });
    }

    commonInit();

    return {dateTimePickerBind:dateTimePickerBind};
});

//检测对象是否存在
function checkObjIsExit(obj){
    if(obj === undefined || obj === null || obj === '' || obj.length === 0){
        return false;
    }else{
        return true;
    }
}

//滚动监听
function scrollListen(options){
    var $picker = options.picker;
    var $scrollBox = $(options.scrollBox);

    $scrollBox.on('scroll',function(e){
        var $scrollEle = $(options.scrollEle);
        if(checkObjIsExit($scrollEle)){
            var pickerTop = $picker.offset().top;
            var newTop = pickerTop + 5;

            if(checkObjIsExit(options.pos)){

                if(options.pos === 'bottom'){
                    newTop += $picker.height();
                }else{
                    newTop = (newTop - $scrollEle.height() - $picker.height());
                }
            }else{
                newTop += $picker.height();
            }

            $scrollEle.css('top',newTop + 'px');
        }
    });
}