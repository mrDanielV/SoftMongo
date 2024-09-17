Resolute.namespace('Resolute.Grid');
Resolute.Grid.renderers = {
	list:{},
	getList:function(){
		// Получить простой список всех рендереров, зарегистрированных в фреймворке
		var res = [];
		Resolute.each(Resolute.Grid.renderers.list,function(fn,code){
			res.push({
				code:code,
				name:fn.desc||code
			})
		});
		return res;
	},
	apply:function(code,options){
		var res = Resolute.jsml.gizmo.init(options.markup||{}),
			r = Resolute.Grid.renderers.get(code);
		var val = (Resolute.isDefined(options.value))?options.value:'&nbsp;';
		if(options && options.path && options.data) val = options.data.get(options.path);
		if(!r){
			if(options && options.markup) markup.cn = val;
			return val;
		};
		res.cn(
			r(val,res,(options && options.data)?options.data:null,(options && options.params)?options.params:{})
		);
		if(options && options.raw){
			return res.markup.cn;
		} else return res.get();
	},
	get:function(code){
		return (Resolute.Grid.renderers.list[code])?Resolute.Grid.renderers.list[code]:null;
	},
	reg:function(code,fn,desc){
		Resolute.Grid.renderers.list[code] = fn;
		if(desc){
			Resolute.Grid.renderers.list[code].desc = desc;
		}
	}
};
Resolute.renderer = Resolute.Grid.renderers.reg;
Resolute.renderer.apply = Resolute.Grid.renderers.apply;
Resolute.renderer.value = function(code,value,params){
	return Resolute.renderer.apply(code,{value:value,raw:true,params:params});
};


// Коллекция дефолтных рендереров

Resolute.renderer('right',function(value,markup,data,params){
	markup.st({alignItems:'right'});
	return value;
},'Текст по правому краю');

Resolute.renderer('left',function(value,markup,data,params){
	markup.st({alignItems:'left'});
	return value;
},'Текст по левому краю');

Resolute.renderer('center',function(value,markup,data,params){
	markup.st({alignItems:'center'});
	return value;
},'Текст по центру');

Resolute.renderer('centerVertical',function(value,markup,data,params){
	markup.st({alignItems:'center'});
	return value;
},'Текст по центру по вертикали');

Resolute.renderer('blueText',function(value,markup,data,params){
	markup.st('color:#6e74c6;');
	return value;
},'Синий текст');

Resolute.renderer('greyText',function(value,markup,data,params){
	markup.st('color:#999;');
	return value;
},'Серый текст');

Resolute.renderer('blueTextBold',function(value,markup,data,params){
	markup.st('color:#6e74c6;font-weight:bold;');
	return value;
},'Синий текст (жирный)');

Resolute.renderer('bool',function(value,markup,data,params){
	if(!Resolute.isBoolean(value)) return value;
	return (value===true)?((R.isArray(params))?params[0]:'Да'):((R.isArray(params))?params[1]:'Нет');
},'Булево значение');

Resolute.renderer('money',function(value,markup,data,params){
	markup.st('align-items: end;');
	var f = new Intl.NumberFormat(params.locale||false,{
		style: 'currency',
		currency: params.currency||'RUB'
	});
	return f.format(value);
},'Денежный формат');

Resolute.renderer('percent', function(value,markup,data,params){
	markup.st('align-items: end;');
	if(!isNaN(parseFloat(value))) {
		return value + '%';
	}
	return value;
},'Процент');

Resolute.renderer('date', function(value,markup,data,params){
	// Дата, Дата-время
	// Value -> string, timestamp, {value: timestamp, tz: int}
	// params.showTime = true/false -> показать время
	// params.TZ = true/false -> показать в часовом поясе браузера
	if(isString(value)) {
		return value;
	}
	if(value === null) {
		return '';
	}

	var tz = (new Date()).getTimezoneOffset();
	var tzU = (new Date()).getTimezoneOffset();

	if(isObject(value)) {
		tz = R.xp(value, 'tz', tz);
		value = R.xp(value, 'value');
	}

	var date = new Date(value);

	// Приведение к таймзоне клиента
	if(R.xp(params, 'TZ')){
		date.setTime(date.getTime() + tz*60000); // В UTC
		date.setTime(date.getTime() - tzU*60000); // В таймзону клиента
	}

	var valueString = date.toLocaleDateString();
	if(R.xp(params, 'showTime')){
		valueString+= ' ' + date.toLocaleTimeString();
	}
	
	return valueString;
},'Дата');

Resolute.renderer('datetime', function(value,markup,data,params){
	if(!isEmpty(params)) {
		params = {};
	}
	params['showTime'] = true;
	
	return Resolute.renderer.value('date', value, params);
},'Дата-время');