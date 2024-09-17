// Является ли значение массивом
var isArray = function(v){
	return toString.apply(v) === '[object Array]';
};

// Является ли значение объектом Дата (Date())
var isDate = function(v){
	return toString.apply(v) === '[object Date]';
};

// Является ли значение объектом
var isObject = function(v){
	return !!v && Object.prototype.toString.call(v) === '[object Object]';
};

// Является ли значение функцией
var isFunction = function(v){
	return toString.apply(v) === '[object Function]';
};

// Является ли значение числом
var isNumber = function(v){
	return typeof v === 'number' && isFinite(v);
};

// Является ли значение строкой
var isString = function(v){
	return typeof v === 'string';
};

// Является ли значение булевым
var isBoolean = function(v){
	return typeof v === 'boolean';
};

// Является ли значение целочисленным
var isInteger = function(n){
	return Number(n) === n && n % 1 === 0;
};

// Является ли значение дробным
var isFloat = function(n){
	return Number(n) === n && n % 1 !== 0;
};

// Определено ли значение
var isDefined = function(v){
	return typeof v !== 'undefined';
};

// Является ли значение скалярной величиной
var isScalar = function(v){
	return isString(v) || isNumber(v) || isBoolean(v);
};

// Пусто ли значение
var isEmpty = function(v, allowBlank){
	return v === null || v === undefined || ((isArray(v) && !v.length)) || (isObject(v) && !Object.keys(v).length) || (!allowBlank ? v === '':false);
};

// Проверка наличия значения в массиве
var inArray = function(value, array, index){
	if(toString.apply(array) !== '[object Array]'){
		if(toString.apply(value) === '[object Array]'){
			var temp = value;
			value = array;
			array = temp;
		}else{
			return false;
		}
	}

	for (var i = 0; i < array.length; i++) {
		if(array[i] === value){
			if(index){
				return i;
			}else{
				return true;
			}
		}
	}

	return false;
};

// Поиск и возврат элемента в массиве объектов по пути-значению
// returnMode - тип возврата результата: 'item', 'index', 'list'
var findIn = function(array, path, value, returnMode){
	if(isEmpty(array)){
		return false;
	}
	if(!isDefined(returnMode)){
		returnMode = 'item';
	}


	var ret = false;
	if(returnMode == 'index'){
		ret = null;
	}
	else if(returnMode == 'list'){
		ret = [];
	}

	R.each(array, function(item, i){
		if(R.xp(item, path) == value){
			if(returnMode == 'index'){
				ret = i;
			}
			else if(returnMode == 'list'){
				ret.push(array[i]);
			}
			else{
				ret = array[i];	
			}
		}
	});

	return ret;
};

// Поиск и возврат всех элементов в массиве объектов, которые удовлетворяют условию по пути-значению
var filterIn = function(array, path, value){
	return findIn(array, path, value, 'list');
};

// Поиск и возврат индекса элемента в массиве объектов по пути-значению
var indexIn = function(array, path, value){
	return findIn(array, path, value, 'index');
};

// Заполнение строки (или числа) символами до заданной длинны
/* По умолчанию symbol = ' ', mode = 'left'
	Примеры: 
	strpad(123) = '123'
	strpad(123, 5) = '  123'
	strpad(123, 5, '0') = '00123'
	strpad(123, 5, '0', 'right') = '12300'
 */
var strpad = function(value, length, symbol, mode){
	if(!isDefined(value) || (!isNumber(value) && !isString(value))){
		return value;
	}
	value = value + '';
	if(!isDefined(length) || isEmpty(length) || !isInteger(length) || !length){
		return value;
	}
	if(!isDefined(symbol) || !isScalar(symbol)){
		symbol = ' ';
	}
	symbol = symbol + '';

	var pad = symbol.repeat(length - value.length);

	if(mode == 'right'){
		return value + pad;
	}
	return pad + value;
};

// Округление числа
var round = function(value, dec, mode){
	if(!isDefined(value) || !isNumber(value)){
		return value;
	}
	if(!isDefined(dec) || !isNumber(dec) || !dec){
		dec = 0;
	}
	if(mode == 'ceil'){
		return Math.ceil(value * Math.pow(10, dec)) / Math.pow(10, dec);
	}
	else if(mode == 'floor'){
		return Math.floor(value * Math.pow(10, dec)) / Math.pow(10, dec);
	}
	return Math.round(value * Math.pow(10, dec)) / Math.pow(10, dec);
}

// Округление числа вверх
var ceil = function(value, dec){
	return round(value, dec, 'ceil');
}

// Округление числа вниз
var floor = function(value, dec){
	return round(value, dec, 'floor');
}
