/**
	Resolute.Forms.DateField
	Поле для выбора даты

	Компонент принимает дату в виде строки ('01.01.1999' или 'now'), таймстемпа или объекта Date
	ВАЖНО! Возвращает значение в виде объекта {value: <timestamp>, tz:<таймзона, смещение в минутах от ЮТС>}
	 - например, для Москвы tz = -180

	Таймзоны, принцип:
	Дата хранит в себе таймзону и может выводиться:
	1. С одним и тем же временем независимо от таймзоны текущего клиента (useTimezone: false)
	2. Менять время в зависимости от таймзоны клиента
	Например:
	 - Дата создана в МСК (-3 часа UTC) как 01.01.2022 10:00:00
	 - Если открыть договор в Ташкенте (-5 часов UTC), то
	 	-- при useTimezone: false поле покажет 01.01.2022 10:00:00
	 	-- при useTimezone: true поле покажет 01.01.2022 12:00:00
	При этом таймстемп значения даты меняться не будет! Меняется только строковое представление даты

	ВАЖНО!
	Даты, привязанные ко времени суток (dayTime = 'begin'/'end') априоре не могут быть привязаны к таймзоне клиента
	То есть, если задано dayTime = 'begin'/'end', то параметр useTimezone - не используется! (= false)

	Мин/Макс значения для проинициализированного объекта поля крайне рекомендуется задавать через функции setMinValue/setMaxValue

	Инициализация вне контекста:  
	var field = new R.Forms.DateField({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		value: 'значение по умолчанию',
		dayTime: 'begin'/'end'/null - приводить ли к началу/концу дня, по умолчанию = 'begin'
		showTime: true/false - показывать ли время
		useTimezone: true/false - если TRUE, будет показано время с учетом таймзоны клиента, если FALSE - время в постоянной таймзоне (заданной при создании даты и хранимой в tz)
		mandatory: true/false,
		readOnly: true/false,
		disabled: true/false,
		hidden: true/false,
		minValue: <минимально допустимое значение поля>,
		maxValue: <максимально допустимое значение поля>,
		прочие параметры - см. по коду
	});

	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', mandatory: true})
	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', dayTime: null, mandatory: true, showTime:true})
	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', dayTime: 'begin', showTime:true})
	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', dayTime: 'end', showTime:true})
	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', dayTime: null, showTime:true, value: {value: 1659616357814, tz:-180}})
	var datefield = new R.Forms.DateField({renderTo: 'ext-comp-1012', minValue: 'today', maxValue: Date.create().addDays(10).getTime(), showTime:true})
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.DateField = Resolute.extend(Resolute.Forms.TextField, {
	showTime: false,
	useTimezone: false,
	dayTime: 'begin',
	minValue: new Date(1900, 0, 1),
	maxValue: new Date(2500, 11, 31),
	errors: {
		minValue: 'Дата не может быть ранее {0}',
		maxValue: 'Дата не может быть позже {0}',
		invalidDate: 'Некорректное значение даты'
	},
	dateElementsPosition:{
		day: [0,2],
		month: [3,5],
		year: [6,10],
		hour: [11,13],
		minute: [14,16],
		second: [17,19]
	},
	initComponent: function(){
		// Совмещение ошибок
		this.errors = R.apply(Resolute.Forms.DateField.superclass.errors, this.errors);

		// Маска ввода
		this.mask = '00.00.0000';
		if(this.showTime){
			this.mask = '00.00.0000 00:00:00';
		}

		// Пикер
		this.buttons = [
			{code:'clear',icon:'mi-clear',hidden:true},
			{code:'pick',icon:'mi-event'}
		];
		this.picker = null;
		
		this.cls += ' date';
		
		Resolute.Forms.DateField.superclass.initComponent.call(this);
		
		// Слушаем нажатия кнопок
		this.on('buttonclick', function(btn){
			if(btn.code == 'pick'){
				this.showPicker();
			}
		},this);

		// Инициализация основных параметров данных
		this.tz = (new Date()).getTimezoneOffset(); // таймзона даты по умолчанию
		this.offset = (new Date()).getTimezoneOffset(); // таймзона клиента
		this.offsetU = this.offset - this.tz; // Разница между таймзонами даты и клиента (обновление)

		// Отключаем зависимость от таймзоны клиента для даты
		// Даты, привязанные к времени суток априоре не зависят от таймзоны клиента
		if(this.dayTime){
			this.useTimezone = false;
		}

		// Установка мин-макс ограничений
		this.setMinValue(this.minValue);
		this.setMaxValue(this.maxValue);
	},
	onRender: function(){
		this.mon(this.getEl(), 'keydown', this.onKeyDown, this);
		Resolute.Forms.DateField.superclass.onRender.call(this);
	},
	onKeyDown:function(event){
		// Функционал "прокрутки" элементов даты по нажатию кнопок вверх и вниз
		this.rotateDatePart(event);
	},
	postBlur: function(){
		// При потере фокуса всегда делаем установку текущего значения, потому что его надо преобразовать из строки в объект Date
		this.setValue(this.getText());

		Resolute.Forms.DateField.superclass.postBlur.call(this);
	},
	setMinValue: function(minValue){
		// Установка минимального значения
		this.setMinMaxValue(minValue, 'min');
	},
	setMaxValue: function(maxValue){
		// Установка максимального значения
		this.setMinMaxValue(maxValue, 'max');
	},
	setMinMaxValue: function(minMaxValue, type){
		// Установка мин-макс ограничений
		if(!type){
			type = 'min';
		}

		if(!minMaxValue && type == 'min'){
			this.minValue = this._getDate('01.01.1900');
		}
		if(!minMaxValue && type == 'max'){
			this.maxValue = this._getDate('31.12.2500');
		}

		if(!(minMaxValue instanceof Date)){
			minMaxValue = this._getDate(minMaxValue);
		}

		// Если у самого поля есть заданная привязка к части суток, то и для ограничения должна быть применена та же привязка
		this.setDayOffset(minMaxValue);

		if(type == 'min'){
			this.minValue = minMaxValue;
		}
		if(type == 'max'){
			this.maxValue = minMaxValue;
		}
	},
	prepareValue: function(v){
		// Преобразование строки или таймстемпа в объект Date
		if(!isString(v) && !isNumber(v)){
			return null;
		}

		var date = this._getDate(v);
		if(!this._isValid(date)){
			return null;
		}
		this._updateOffset(date);

		return date;
	},
	setDayOffset: function(date){
		// перемещение даты в конец-начало дня
		if(!isDefined(date)){
			date = this.value;
		}
		if(!this.dayTime || !date || !(date instanceof Date)){
			return;
		}

		// Отключаем зависимость от таймзоны клиента для даты
		// Даты, привязанные к времени суток априоре не зависят от таймзоны клиента
		this.useTimezone = false;

		// Поскольку все модификаторы работают только в таймзоне текущего клиента, 
		// сдвигаем время на разницу между таймзоной клиента и таймзоной даты
		this._addMinutes(date, this.offsetU);

		// К началу дня
		if(this.dayTime == 'begin'){
			this._beginningOfDay(date);
		}
		// К концу дня
		else if(this.dayTime == 'end'){
			this._endOfDay(date);
		}

		// После модификации сдвигаем время из таймзоны клиента в таймзону даты
		this._addMinutes(date, -this.offsetU);
	},
	setValueString: function(text){
		// установка строки - в том числе неполной! (используется при заполнении по маске)
		if(!isString(text)){
			return;
		}

		// Установка текста в поле
		if(this.rendered){
			this.getEl().dom.value = text;
		}

		// Если введена полная дата (по формату), то назначаем и VALUE элемента
		var goodL = 10;
		if(this.mask){
			goodL = this.mask.length;
		}
		if(text.length === goodL){
			this.setValue(text);
		}
	},
	setValue:function(v){
		var inputV = v;

		// NOW
		if(v && isString(v) && v == 'now'){
			v = new Date();
		}

		// Если на входе объект {value, tz} (основное представление) - сохраняем tz и далее обрабатываем только value
		if(isObject(v)){
			this.tz = R.xp(v, 'tz');
			v = R.xp(v, 'value');
		}

		// Разница между таймзонами даты и клиента (обновление)
		this.offsetU = this.offset - this.tz;

		// Если на входе не объект Date, то значение нужно преобразовать и обработать
		if((v || v === 0) && !(v instanceof Date)){
			v = this.prepareValue(v);
		}

		this.value = v;
		if(!(this.value instanceof Date)){
			this.value = null;
		}

		// Начало/Конец дня
		this.setDayOffset();

		if(!this.rendered){
			return;
		}

		// Получение и установка строки даты
		var valueString = this.getValueString();
		this.getEl().dom.value = valueString;
		
		if(!this.value || this.value == ''){
			this.hideButton('clear');
		} else {
			this.showButton('clear');
		}

		this.onSetValue();
	},
	getValueString: function(dateObject){
		// Получение строки даты от текущего значения
		if(!isDefined(dateObject)){
			dateObject = this.value;
		}
		if(!dateObject || !(dateObject instanceof Date)){
			return '';
		}

		// Клонируем значение - дальнейшее никак не должно повлиять на само значение
		var date = new Date(dateObject.getTime());

		// Если Дата должна отображаться одинаково в любом часовом поясе, приводим её к UTC, потом к поясу дату
		var tz = this.tz;
		
		// Если Дата должна отображаться в зависимости от часового пояса, приводим её к UTC, потом к поясу клиента
		if(this.useTimezone){
			tz = date.getTimezoneOffset();
		}

		// Приводим дату к поясу UTC, потом к нужному
		this._fromUTC(date);
		this._addMinutes(date, -tz);
		
		// Формирование строки от Date
		valueString = date.toLocaleDateString();
		if(this.showTime){
			valueString+= ' ' + date.toLocaleTimeString();
		}

		return valueString;
	},
	getDate:function(){
		// Возврат текущего значения в виде обхекта Date
		// При пустом теукущем значении - текущая дата
		if(!this.value || !(this.value instanceof Date)){
			return new Date();
		}

		return this.value;
	},
	getValue:function(){
		// Возврат текущего значения в виде timestamp
		if(!this.value || !(this.value instanceof Date)){
			return null;
		}

		// Формируем значение-объект
		var value = {
			value: this.value.getTime(),
			tz: this.tz
		};

		return value;
	},
	rotateDatePart: function(event){
		// Функционал "прокрутки" элементов даты по нажатию кнопок вверх и вниз (влево и вправо - переход по элементам даты
		if(!event || !R.Event.isKey(event,['down','up','left','right'])){
			return;
		}
		event.preventDefault();
		
		var dateElement = null,
			selectionStart = this.getEl().dom.selectionStart,
			selectionEnd = this.getEl().dom.selectionEnd,
			v = this.getValue(),
			shift = 1;
		
		if(!v) return;
		
		if(!this.isValid()) return;
		
		// Если нажат shift, сдвигаем элемент даты на +-10
		if(event.shiftKey){
			shift = 10; 
		}
		
		dateElement = this.getDatePart();

		if(dateElement == null) return;
		
		// Переход влево вправо по элементам даты
		if((selectionEnd-selectionStart)>1 && R.Event.isKey(event,['left','right'])){
			var elms = ['day','month','year','hour','minute','second'],
				ind = 0;

			if(!this.showTime){
				elms = ['day','month','year'];
			}

			if(R.Event.isKey(event,'left')) ind = -1;
			if(R.Event.isKey(event,'right')) ind = 1;
			var nextElem = elms.indexOf(dateElement)+ind;
			nextElem = nextElem.bounds(0,elms.length-1);
			dateElement = elms[nextElem];
		}
		
		var method = 'add' + dateElement.upperFirst() + 's';
		if(!v[method]) return;
		
		if(R.Event.isKey(event,'down')){
			this.setValue(v[method](-1 * shift));
		}
		if(R.Event.isKey(event,'up')){
			this.setValue(v[method](1 * shift));
		}
		
		// выделим текущий изменяемый элемент даты
		this.getEl().dom.selectionStart = this.dateElementsPosition[dateElement][0];
		this.getEl().dom.selectionEnd = this.dateElementsPosition[dateElement][1];
	},
	getDatePart:function(){
		var dateElement = null;
		var caretPos = this.getEl().dom.selectionStart;
		
		R.each(this.dateElementsPosition, function(value, key){
			if(caretPos.between(value[0], value[1])){
				dateElement = key;
			}
		});
		
		return dateElement;
	},
	onDatePick:function(date){
		// Клик на дату в пикере

		// Очистим ссылку на экземпляр пикера (на этот момент он уже скрыт и уничтожен, но тут остается недоэкземпляр, который мы и удаляем)
		this.picker = null;
		
		// Установка значения и вызов Блура для корректной логики обработки изменения значения
		this.setValue(date);
		this.onBlur();
	},
	showPicker:function(){
		// Вызов пикера по клику на иконку
		delete this.picker;

		// Инициализация пикера
		this.picker = Resolute.Pickers.show('Date',{
			alignTo:this.getEl('field'), // Выравнивание по данному элементу (input) 
			offsets:[0,-1],	// Сдвиг выравнивания в пикселях (x,y)
			value: this.value,	// Текущее значение (если null то в пикере будет использоваться текущая дата)
			maxValue:this.maxValue,	// Границы возможного выбора дат
			minValue:this.minValue,
			callback:this.onDatePick,	// Функция, которая будет вызвана при выборе даты (пикер сам закроется)
			onHide:function(){ // Функция, которая будет вызвана при закрытии пикера
				this.listHidden = true;
				this.noFocusing = true;
				this.getEl('main').dom.focus();
				delete this.picker;
			},
			scope:this
		});

		// Вызов получения фокуса для корректной логики "перед изменением поля"
		this.onFocus();
	},
	hidePicker:function(){
		this.picker.hide();
		this.picker = null;
	},
	getTZ: function(){
		// получение таймзоны текущей даты
		return this.tz;
	},
	setTZ: function(tz){
		// назначение таймзоны текущей даты
		if(!isNumber(tz)){
			return;
		}
		if(tz < -720 || tz > 720){
			return;	
		}
		this.tz = tz;

		// Разница между таймзонами даты и клиента
		this.offsetU = this.offset - this.tz;
	},
	isValid:function(){
		// Валидация поля

		// Базовая валидация - у компонента-предка (Field)
		var baseValid = Resolute.Forms.TextField.superclass.isValid.call(this);
		if(!baseValid){
			return baseValid;
		}

		if(!this.value || !(this.value instanceof Date)){
			return true;
		}

		// проверка корректности даты самой по себе
		var dateStr = this.getText();
		var dateFromStr = this._getDate(dateStr);
		if(dateStr && !this._isValid(dateFromStr)){
			this.errorCode = 'invalidDate';
			return false;
		}

		// Проверка на мин.дату
		if(this.minValue && (this.minValue instanceof Date)){
			if(this.value.getTime() < this.minValue.getTime()){
				this.errorCode = 'minValue';
				this.errorsList.minValue = this.getErrorTmp('minValue').format(this.getValueString(this.minValue));
				return false;
			}
		}

		// Проверка на макс.дату
		if(this.maxValue && (this.maxValue instanceof Date)){
			if(this.value.getTime() > this.maxValue.getTime()){
				this.errorCode = 'maxValue';
				this.errorsList.maxValue = this.getErrorTmp('maxValue').format(this.getValueString(this.maxValue));
				return false;
			}
		}

		return true;
	},
	_getDate: function(v){
		// получение экземпляра объекта JS Date
		if(v instanceof Date){
			return v;
		}

		if(!isDefined(v)){
			v = null;
		}

		if(v === null || isNumber(v)){
			return new Date(v);
		}

		if(v == 'now') {
			return new Date();
		}

		// Для RU-формата даты с точками - переформатирование в формат Y/m/d h:m:i
		if(isString(v) && v.indexOf('.')){
			var datetime = v.split(' ');
			var date = datetime[0];

			date = this._tryDate(date);

			date = date.split('.').reverse().join('/');
			if(datetime[1]){
				date = date + ' ' + datetime[1];
			}

			return new Date(date);
		}

		return new Date(v);
	},
	_updateOffset: function(date){
		// Обновление текущего смещения по таймзоне от текущей или переданной даты
		// приходится делать это, потому что с 1981 года в РФ была смена летнего/зимнево времени и тайзона в эти годы = GMT+0400 (240 минут)
		if(!(date instanceof Date)){
			return;
		}

		this.offset = date.getTimezoneOffset();
		this.setTZ(this.offset);
	},
	_isValid: function(date){
		// валидация экземпляра объекта JS Date
		if(!(date instanceof Date)){
			return false;
		}
		return !isNaN(date.getTime());
	},
	_addMinutes: function(date, units){
		// добавление заданного числа минут к дате
		if(!(date instanceof Date)){
			return date;
		}
		if(!isDefined(units) || !isNumber(units)){
			units = 0;
		}
		date.setTime(date.getTime() + units*60000);
		
		return date;
	},
	_fromUTC: function(date){
		// преобразование даты из UTC в текущая таймзону
		if(!(date instanceof Date)){
			return date;
		}
		
		this._addMinutes(date, date.getTimezoneOffset());

		return date;
	},
	_beginningOfDay: function(date){
		// Приведение Даты к началу дня
		if(!(date instanceof Date)){
			return date;
		}

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		return date;
	},
	_endOfDay: function(date){
		// Приведение Даты к концу дня
		if(!(date instanceof Date)){
			return date;
		}

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		return date;
	},
	_tryDate: function(date){
		// дополнение строковой даты формата дд.мм.гггг текущими месяцем-годом, если они не указаны
		if(!date || !isString(date)){
			return date;
		}

		var parts = date.split('.');
		if(isEmpty(parts) || (R.xp(parts, '1') && R.xp(parts, '2'))){
			return date;
		}

		if(!parts[1]){
			parts[1] = (new Date).getMonth();
		}
		if(!parts[2]){
			parts[2] = (new Date).getFullYear();
		}

		date = parts.join('.');
		return date;
	}
});
Resolute.reg('datefield', Resolute.Forms.DateField);