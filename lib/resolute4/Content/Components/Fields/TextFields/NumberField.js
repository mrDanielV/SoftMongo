/**
	Resolute.Forms.NumberField
	Числовое поле формы.

	var nfield = new R.Forms.NumberField({renderTo: 'ext-comp-1012', value: 100, mandatory: true, minValue:5, maxValue: 10000000, type: 'money'})
	var nfield = new R.Forms.NumberField({renderTo: 'ext-comp-1012', value: 100, mandatory: true, minValue:5, maxValue: 10000000, separate: true})

	Инициализация вне контекста:  
	var field = new R.Forms.NumberField({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		value: <number - значение по умолчанию>,
		minValue: <float - минимально допустимое значение>,
		maxValue: <float - максимально допустимое значение>,
		mandatory: true/false,
		dec/decimal/decimalPrecision: <int - количество знаков после запятой>,
		separate: true/false - pазделение на разряды-тысячи через пробел,
		type: 'тип числа' - money, moneyNoCent, k (коэф), int (целое), percent (целое, 0-100), year (от 1900 до 2100),
		прочие параметры - см. по коду + см. TextField
	});

	Компонент является расширением Resolute.Forms.TextField и обеспечивает:
	- Фильтрацию ввода в элемент поля для числового значения
	- Ограничения для числа и его разрядности
	- Форматирование значения
	Поле возвращает значение типа число (integer/float)

	Примеры:
	var number = new R.Forms.NumberField({renderTo: 'ext-comp-1012'}) // число, два знака после запятой, без ограничений, без форматирования
	var money = new R.Forms.NumberField({renderTo: 'ext-comp-1012', mandatory: true, type: 'money'}) // обязательное денежное (100 000,00) поле
	var separate = new R.Forms.NumberField({renderTo: 'ext-comp-1012', separate: true, dec: 0}) // разделенное целое (100 000)
	var coef = new R.Forms.NumberField({renderTo: 'ext-comp-1012', type: 'k'}) // дробное с 15 знаками (макс) после запятой (0.0000567)
 */
Resolute.ns('Resolute.Forms');

Resolute.Forms.NumberField = Resolute.extend(Resolute.Forms.TextField, {
	decimalPrecision: 2, // Количество знаков после запятой
	cutMode: 'round', // cut, up, down - метод округления при приведении к заданному количеству знаков после запятой
	minValue: Number.NEGATIVE_INFINITY,
	maxValue: Number.MAX_VALUE,
	separate: false, // Разделение на разряды-тысячи
	type: null, // Тип, определяющий набор свойств поля: money, moneyNoCent, k (коэф), int (целое), percent (целое, 0-100), year (от 1900 до 2100)
	valueAlign: 'left', // По какому краю поля будет выравнено значение
	errors: {
		minValue: 'Минимально допустимое значение поля {0}',
		maxValue: 'Максимально допустимое значение поля {0}',
		nan: '{0} не является корректным числом'
	},
	initComponent: function(){
		// Совмещение ошибок
		this.errors = R.apply(Resolute.Forms.NumberField.superclass.errors, this.errors);

		this.cls += ' number';
		
		// Вызов initComponent Resolute.Forms.TextField
		Resolute.Forms.NumberField.superclass.initComponent.call(this);

		// Алиасы decimalPrecision
		if(isDefined(this.decimal)){
			this.decimalPrecision = this.decimal;
		}
		if(isDefined(this.dec)){
			this.decimalPrecision = this.dec;
		}

		// Для поддержки allowDecimals тоже используем decimalPrecision
		if(this.allowDecimals === false){
			this.decimalPrecision = 0;	
		}

		// Типы - предустановленные свойства
		this.setType(this.type);
	},
	setType: function(type){
		// Типы - предустановленные свойства
		// Сброс предыдущего типа
		if(type != this.type){
			this.decimalPrecision = 2;
			this.minLength = 0;
			this.maxLength = 256;
			if(this.rendered){
				this.setMinLength();
				this.setMaxLength();
			}
			this.minValue == Number.NEGATIVE_INFINITY;
			this.maxValue == Number.MAX_VALUE;
		}

		// Денежные форматы
		if(type == 'money'){
			this.separate = true;
			this.decimalPrecision = 2;
		}
		else if(type == 'moneyNoCent'){
			this.separate = true;
			this.decimalPrecision = 0;
		}
		

		// Коэффициент
		else if(type == 'k' || type == 'coef' || type == 'coefficient'){
			this.separate = false;
			if(this.decimalPrecision == 2 && !this.dec && !this.decimal){
				this.decimalPrecision = 15;
			}
		}

		// Целое число
		else if(type == 'int' || type == 'integer'){
			this.separate = false;
			this.decimalPrecision = 0;
		}

		// Процент
		else if(type == 'percent'){
			this.separate = false;
			if(this.minValue == Number.NEGATIVE_INFINITY){
				this.minValue = 0;
			}
			if(this.maxValue == Number.MAX_VALUE){
				this.maxValue = 100;
			}
			if(this.decimalPrecision == 2 && !this.dec && !this.decimal){
				this.decimalPrecision = 0;
			}
		}

		// Год
		else if(type == 'year'){
			this.separate = false;
			this.decimalPrecision = 0;
			this.minLength = 4;
			this.maxLength = 4;
			if(this.minValue == Number.NEGATIVE_INFINITY){
				this.minValue = 1900;
			}
			if(this.maxValue == Number.MAX_VALUE){
				this.maxValue = 2100;
			}
		}

		this.type = type;
	},
	onRender: function(){
		// Вызов onRender Resolute.Forms.TextField
		Resolute.Forms.NumberField.superclass.onRender.call(this);
		var el = this.getEl('main');

		// Установка мин/макс значений
		this.setMinValue(this.minValue, true);
		this.setMaxValue(this.maxValue, true);

		// Установка маски ввода ^[0-9\-\,\.]*$/
		this.maskRe = /^[0-9\-\,\.]*$/;

		if(el){
			el.setStyle('text-align',this.valueAlign);
			el.on('focus', this.onSetFocus, this);
		}
	},
	onKey: function(e, cc){
		// фильтрация вводимого на лету: контроль лишних символов
		if(!cc){
			return;
		}

		var value = this.getEl().dom.value;

		// Запрет ввода дробной части, если она запрещена
		if(!this.decimalPrecision && (cc == ',' || cc == '.')){
			e.stopEvent();
		}

		// Ввод только одного разделителя дробной части
		if((cc == ',' || cc == '.') && (value.has(',') || value.has('.'))){
			e.stopEvent();
		}

		// Ввод минуса только один раз
		if(cc == '-' && value.has('-')){
			e.stopEvent();	
		}
	},
	postBlur: function(){
		// На потерю фокуса
		var value = this.getText();

		// Форматирование
		value = this.formatValue(value);
		this.setText(value);

		Resolute.Forms.NumberField.superclass.postBlur.call(this);
	},
	onSetFocus: function(){
		// На получение фокуса
		var value = this.getValue();

		// Сбрасываем формат в число
		value = this.prepareValue(value);
		this.setText(value);
	},
	setText: function(v){
		// назначение текст в элемент: переопределено по сравнению с TextField ради возможности передавать значение в функцию
		var text = this.value;
		var el = this.getEl('main');
		if(isDefined(v)){
			text = v;
		}
	
		if(!el || !el.dom){
			return;
		}

		if(text === null){
			text = '';
		}
		if(!R.isString(text)){
			text = text + '';
		}

		this.getEl('main').dom.value = text;
	},
	prepareValue: function(v){
		// Приведение текста в число
		if(!R.isDefined(v)){
			v = this.value;
		}
		if(!v && v !== 0){
			return null;
		}

		if(!R.isString(v)){
			v = v + '';
		}

		// Удаление пробелов
		v = v.split(' ').join('');

		// Замена запятой на точку для приведения к числу
		v = v.split(',').join('.');
		v = parseFloat(v);

		// Разрядность
		if(isFloat(v)){
			if(this.cutMode == 'cut'){
				va = (v+'').split('.');
				if(va[1]){
					va[1] = va[1].substr(0, this.decimalPrecision);
				}
				v = va.join('.');
				v = parseFloat(v);
			}
			else if(this.cutMode == 'up'){
				v = ceil(v, this.decimalPrecision);
			}
			else if(this.cutMode == 'down'){
				v = floor(v, this.decimalPrecision);
			}
			else{
				v = round(v, this.decimalPrecision);
			}
		}

		if(isNaN(v)){
			v = null;
		}
		
		return v;
	},
	formatValue: function(v){
		// Форматирование числа в текст
		if(!R.isDefined(v)){
			v = this.value;
		}

		if(!v){
			return v;
		}

		// Общее приведение значения к числу
		v = this.prepareValue(v);
		
		// Разделение на разряды по тысячам
		if(this.separate && isNumber(v)){
			v = v.separate();
		}

		if(!R.isString(v)){
			v = v + '';
		}

		v = v.split('.').join(',');

		// Добавление нулей к формату денег
		if(this.type == 'money' && v){
			if(!v.has(',')){
				v = v + ',00';
			}else{
				var da = v.split(',');
				var d = da[1];
				if(d.length == 1){
					v = v + '0';
				}
			}
		}

		return v;
	},
	setValue: function(v){
		// установка значения поля
		v = this.prepareValue(v);
		v = this.formatValue(v);

		Resolute.Forms.NumberField.superclass.setValue.call(this, v);
	},
	getValue: function(){
		// получение значения поля, преобразование в число
		Resolute.Forms.NumberField.superclass.getValue.call(this);

		this.value = this.prepareValue(this.value);

		return this.value;
	},
	setMinValue: function(n, silent){
		// установка минимального значения
		if(!R.isDefined(n)){
			n = this.minValue;
		}
		this.minValue = n;

		if(this.minValue === null){
			this.minValue = Number.NEGATIVE_INFINITY;
		}

		// Обновление текста ошибки
		this.errorsList.minValue = this.getErrorTmp('minValue').format(this.minValue);

		if(!silent){
			this.validate();
		}
	},
	setMaxValue: function(n, silent){
		// установка максимального значения
		if(!R.isDefined(n)){
			n = this.maxValue;
		}
		this.maxValue = n;

		if(this.maxValue === null){
			this.maxValue = Number.MAX_VALUE;
		}

		// Обновление текста ошибки
		this.errorsList.maxValue = this.getErrorTmp('maxValue').format(this.maxValue);

		if(!silent){
			this.validate();
		}
	},
	isValid: function(){
		// Валидация значения поля

		// Обновление текущего значения поля
		this.getValue();

		// Получение значения для валидации
		var value = this.value;

		// Базовая валидация - у компонента-предка (TextField + Field)
		var baseValid = Resolute.Forms.NumberField.superclass.isValid.call(this);
		if(!baseValid){
			return baseValid;
		}

		if(value === null || R.isEmpty(value) || !R.isDefined(value)){
			return true;
		}

		// Проверка на тип значения
		if(value && !R.isNumber(value)){
			this.errorCode = 'nan';
			this.errorsList.nan = this.getErrorTmp('nan').format(value);
		}

		// Проверка Мин значения
		if(this.minValue && R.isNumber(this.minValue) && value < this.minValue){
			this.errorCode = 'minValue';
			this.errorsList.minValue = this.getErrorTmp('minValue').format(this.minValue);
			return false;
		}

		// Проверка Макс значения
		if(this.maxValue && R.isNumber(this.maxValue) && value > this.maxValue){
			this.errorCode = 'maxValue';
			this.errorsList.maxValue = this.getErrorTmp('maxValue').format(this.maxValue);
			return false;
		}

		return true;
	}
});
Resolute.reg('numberfield', Resolute.Forms.NumberField);
