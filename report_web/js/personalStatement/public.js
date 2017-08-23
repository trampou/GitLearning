define(['JQuery'],function($){
	var public={
		url:"",
		userId:null,
		companyId:null,
		lastTime:null,
		ajax:function(token,option){
			var rep='token='+token+'&rep='+JSON.stringify(option.rep).substring(7,JSON.stringify(option.rep).length-1);
			var fn=arguments[arguments.length-1];
			$.ajax({
				type:	option.type   ||  "post",
				url:	this.url+"/worksheet/report.json",
				async:  option.async  ||  true,
				data:   rep,
				dataType:option.dataType||"json",
				error:function(status){
					fn();
				},
				success:option.success||function(result){
					console.log(result);
					if(result.code==1&&result.message=="成功"){
						fn(result);
					}else{
						fn();
					}
				}
			});
		},
		numFormat:function(str,Symbol){
			if( this.isString(str) ){
				y=str.split("");
				var arr=[];
				var flag=0;
				Symbol=Symbol||",";
				while(y.length!=0){
					arr.unshift(y.pop());
					flag+=1;
					if(flag==3){
						flag=0;
						if(y.length==0)
						break;
						arr.unshift(Symbol);
					};
				}
				return arr.join("");
			}
			console.log("numFormat:is not String");
		},
		isString:function(str){
			return Object.prototype.toString.call(str)== "[object String]";
		},
		timeFormat:function(month){
			return month.toString().length==2 ? month.toString():"0"+month;
		},
		
	}
	return public;
})