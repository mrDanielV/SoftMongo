/**
	Библиотека функций обработки строковых значений для обеспечения field.postprocess = []:
	обработки значения поля после ввода значения
	Рекомендуемая форма обращения:
	Resolute.pp(postprocessName, value);
		или
	Resolute.getPP(postprocessName, value)

	Список:
	 - trim - Убрать пробелы в начале и конце строки
	 - capitalise - Первые Буквы Слов Прописные
	 - upperCase - ВСЕ БУКВЫ ПРОПИСНЫЕ
	 - upperCaseFirst - Первая буква прописная
	 - SSN - SSN номер
	 - cyrillize - Перевод в кирилицу СХОжиХ пО НАпиСАНию бУКВ
	 - clean - Очистка строки от ненужных символов
 */
Resolute.postprocess = function(p,v){
	return Resolute.postprocess.get(p,v)
};

// Регистрация функции постпроцесса (для краткости)
// code - уникальный код постпроцесса
// fn - функция для обработки значения (либо тут описание)
// desc - описание постпроцесса (либо тут функция)
Resolute.postprocess.reg = function(code,fn,desc){
	if(R.isObject(code)){
		Resolute.postprocess.reg(code.code,code.fn,code.desc);
		return true;
	};
	var fnn = fn;
	var dsc = desc;
	if(R.isString(fn) && R.isFunction(desc)){
		fnn = desc;
		dsc = fn;
	};
	Resolute.postprocess[code] = fnn;
	if(dsc) Resolute.postprocess[code+'Name'] = dsc;
};

// Список всех поспроцессов (в виде массива с code и name)
Resolute.postprocess.list = function(){
	var res = [];
	for(var key in Resolute.postprocess){
		if(Resolute.postprocess.hasOwnProperty(key)){
			if(!['list','reg','get'].present(key) && R.isFunction(Resolute.postprocess[key])){
				res.push({
					code:key,
					name:Resolute.postprocess[key+'Name']||key
				});
			}
		}
	};
	return res;
};

Resolute.postprocess.reg('trim','Убрать пробелы в начале и конце строки',function(v){
	return v.trim();
});

Resolute.postprocess.reg('capitalise','Первые Буквы Слов Прописные',function(v){
	return v.upperFirstByWords();
});

Resolute.postprocess.reg('upperCase','ВСЕ БУКВЫ ПРОПИСНЫЕ',function(v){
	return v.toUpperCase();
});

Resolute.postprocess.reg('upperCaseFirst','Первая буква прописная',function(v){
	return v.substring(0,1).toUpperCase()+v.substring(1,v.length);
});

Resolute.postprocess.reg('SSN',function(v){
	if(v[3] === '-'){
		return v;
	}
	return v.substring(0,3)+'-'+v.substring(3,5)+'-'+v.substring(5,9);
});


Resolute.postprocess.reg('cyrillize','Перевод в кирилицу СХОжиХ пО НАпиСАНию бУКВ',function(v){
	var res = v.replace(/[ABCEHKMOPTXY]/g,function(c){
		var i = ['A','B','C','E','H','K','M','O','P','T','X','Y'].indexOf(c);
		return ['А','В','С','Е','Н','К','М','О','Р','Т','Х','У'][i];
	});
	return res;
});

Resolute.postprocess.reg('clean','Очистка строки от невидимых символов UNICODE и прочих гадостей',function(v){
	// Невидимые символы (нулевой длины):
	var res = v.replace(/[\u200B-\u200D\uFEFF]/g, '');
	// Смайлики:
	res = res.replace(/\p{Emoji}/gu,'');
	// Пробелы в начале и конце:
	res = Resolute.postprocess.get('trim',res);
	// Множественные пробелы (и другие резделители):
	res = res.replace(/\s\s+/g,' ');
	return res;
});

// Функция обработки значения по имени поспроцесса
// postprocess - имя постпроцесса или массив имён постпроцессов
Resolute.postprocess.get = function(postprocess, value){
	if(!R.isString(value)){
		// Если передана не строка, то нет смысла в дальнейшей обработке
		// Возвращаем значение "как есть"
		// Посему убрана проверка на строку в каждой функции постпроцесса
		return value;
	}
	
	if(!postprocess || (!R.isString(postprocess) && !R.isArray(postprocess))){
		return value;
	}

	if(R.isString(postprocess)){
		postprocess = [postprocess];
	}

	R.each(postprocess, function(name){
		if(!Resolute.postprocess[name] || !R.isFunction(Resolute.postprocess[name])){
			return value;
		}
		value = Resolute.postprocess[name](value);
	});

	return value;
}


// Короткие формы
Resolute.pp = Resolute.postprocess;
Resolute.getPP = Resolute.postprocess.get;