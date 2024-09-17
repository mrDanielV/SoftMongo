// Библиотека утилитарных JS-функций softMongo
SM.fn = {
	sizeFormat: function(size){
		// Форматирование размера файла в байт/Кб/Мг из байтов
		if(!size || !isNumber(size)){
			return '0 ' + SM.lang('sizes.B', 'байт');
		}

		var sizeE = SM.lang('sizes.B', 'байт');
		if(size > 999){
			size = size/1024;
			sizeE = SM.lang('sizes.KB', 'Кб');
		}
		if(size > 999){
			size = size/1024;
			sizeE = SM.lang('sizes.MB', 'Мб');
		}
		if(size > 999){
			size = size/1024;
			sizeE = SM.lang('sizes.GB', 'Гб');
		}
		size = Math.round(size*100)/100;

		return size + ' ' + sizeE;
	},
	preparePath: function(path){
		// Строковая предподготовка пути узла в объекте
		path = path.split('"').join('');
		path = path.split('\'').join('');
		path = path.split(' ').join('');

		return path;
	},
	toJSON: function(text){
		// "мягкое" преобразование строки в JSON
		var fnc = `{return ` + text + `}`; // функция для провокации синтаксической ошибки

		try {
			// провоцируем ошибку, если она есть в JSON
			var res = new Function(fnc);

			// выполняем преобразование в объект
			text = (new Function("return " + text))();
			
			return text;
		} catch (e) {
			return null;
		}
	},
	htmlJSON: function(obj){
		// строка (отформатированная) для HTML от объекта
		if(!isObject(obj)){
			return '';
		}
		
		html = JSON.stringify(obj, null, '\t');
		html = html.split('\n').join('<br>');
		html = html.split('\t').join('&nbsp;&nbsp;&nbsp;');

		return html;
	},
	copyBuffer: function(text){
		// Копирование в буфер через создание временного элемента
		var tmp = document.createElement('textarea'),
			focus = document.activeElement;
		
		tmp.value = text;
		document.body.appendChild(tmp);
		tmp.select();
		
		try { 
			document.execCommand('copy');
		}catch(err) {
			return false;
		}
		
		document.body.removeChild(tmp);
		focus.focus();

		return true;
	},
	toUTC: function(date) {
		// Приведение объекта Даты/Времени из локализованного значения в UTC
		if(!date || !(date instanceof Date)){
			return date;
		}
		return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	}
}

// Запрос к серверному классу выполнения операция SM.php
// Расширение Resolute.request
SM.request = function(operation, data, onSuccess, scope, noWait, onFailure){
	if(!operation){
		return;
	}
	if(!data){
		data = {};
	}
	if(!scope){
		scope = this;
	}

	// Операция
	data.operation = operation;

	// Текущие БД и коллекция по умолчанию
	if(!R.xp(data, 'dbase') && SM.data.dbase){
		data.dbase = SM.data.dbase;
	}
	if(!R.xp(data, 'collection') && SM.data.collection){
		data.collection = SM.data.collection;
	}


	if(!noWait) var w = R.Msg.wait();
	R.request({
		url: 'operations/',
		params: {
			operation: 'SM.get',
			data: R.encode(data)
		},
		onSuccess: function(r){
			if(w) w.close();

			if(r.msg){
				R.Msg.alert(r.msg);
			}

			if(onSuccess && isFunction(onSuccess)){
				onSuccess.call(scope, r);
			}
		},
		onFailure: function(r){
			if(w) w.close();
			R.Msg.alert(r.msg);

			if(onFailure && isFunction(onFailure)){
				onFailure.call(scope, r);
			}
		},
		scope: scope
	});
};