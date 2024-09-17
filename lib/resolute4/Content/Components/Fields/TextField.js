/**
	Resolute.Forms.TextField
	Текстовое поле формы.

	var tfield = new R.Forms.TextField({renderTo: 'ext-comp-1012', value: '', mandatory: true, emptyText: 'Введите значение', vtype: 'charsEN', postprocess: 'trim'})

	Инициализация вне контекста:  
	var field = new R.Forms.TextField({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		vtype: '<имя одного из типов валидации "на лету" из библиотеки R.vtypes>',
		postprocess: 'trim' / ['trim', 'upperCaseFirst'],
		value: 'значение по умолчанию',
		showClearButton: true / false - показывать ли автоматически иконку-кнопку удаления значения (по умолчанию = true),
		emptyText: 'Серый текст для пустого поля',
		mask: '<маска ввода (например 000-000) обеспечит автоформатирование при вводе>',
		maskEls: {
			digits: [<массив символов, которыми в маске указываются цифры>, по умолчанию - '0','#'>],
			letters: [<массив символов, которыми в маске указываются НЕ цифры>, по умолчанию - 'X'>],
			common: [<массив символов, которыми в маске указываются любые символы>, по умолчанию - '*'>]
		},
		mandatory: true/false,
		readOnly: true/false,
		disabled: true/false,
		hidden: true/false,
		minLength: <минимально допустимая длинна значения поля>,
		maxLength: <максимально допустимая длинна значения поля>,
		password: true/false, // поле для ввода пароля (type = password), вводимые символы скрываются маской
		прочие параметры - см. по коду
	});

	Компонент обеспечивает:
	- прорисовку элемента поля 
	- базовый функционал назначения и получения значения поля - дополняется и переопределяется в потомках
	- базовый функционал валидации поля - в потомках следует расширять его по необходимости, 
		назначая и обрабатывая список возможных ошибок в this.errors = {code: <текст ошибки>}
	- основные события для компонента:
		- focus - получение фокуса, никак не обрабатывается, создано для расширения в потомках
		- blur - потеря фокуса, базово обрабатывается валидацией если this.validateOnBlur = true + проверка на изменения поля
		- change - изменение значения поля, событие происходит на потерю фокуса (blur) в this.onBlur

	Примеры маскированного поля:
	var masked = new R.Forms.TextField({renderTo: 'ext-comp-1012', value: '', mask: 'R00077-0000000'}) // номер полиса страхования
	var masked = new R.Forms.TextField({renderTo: 'ext-comp-1012', value: '', mask: '000-000'}) // Код подразделения ДУЛ
	var masked = new R.Forms.TextField({renderTo: 'ext-comp-1012', value: '', mask: '+7 (000) 000-00-00'}) // Телефон
	var masked = new R.Forms.TextField({renderTo: 'ext-comp-1012', value: '', mask: '0000 0000 0000 0000'}) // Номер карты
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.TextField = Resolute.extend(Resolute.Forms.Field, {
	minLength: 0,
	maxLength: 0,
	showClearButton: true,
	errors: {
		mandatory: 'Обязательно для заполнения',
		minLength: 'Значение поля не может быть короче {0} символов',
		maxLength: 'Значение поля не может быть длиннее {0} символов',
		mask: 'Значение не соответствует формату {0}'
	},
	initComponent: function(){
		if(!this.buttons && this.showClearButton){
			this.buttons = [{code:'clear',icon:'mi-clear',hidden:true}];
		}

		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.TextField.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'keydown',
			'keyup',
			'keypress'
		);

		// Инициализация маски, если она есть
		if(this.mask && isString(this.mask)){
			this.setMask();
		}
	},
	doFocus:function(){
		if(this.el.inFocus()){
			return;
		}
		this.selectText();
		this.getEl('main').focus();
	},
	setMask: function(cfg){
		// Установка (инициализация) маски для ввода значения, например: для 123-123 маской будет ###-###
		this.prevMask = this.mask;
		this.changeMask = false;

		if(isDefined(cfg)){
			// переустановка маски от переданного конфига
			// конфиг может быть строкой (маска), либо объектом вида {mask, maskEls}
			// для сброса маски передать NULL или FALSE
			if(isString(cfg)){
				this.mask = cfg;
			}
			else if(isObject(cfg)){
				this.mask = cfg.mask;
				this.maskEls = cfg.maskEls;
			}
			else if(cfg === null || cfg === false){
				this.mask = null;
			}
		}

		// Изменилась ли маска
		if(this.mask != this.prevMask){
			this.changeMask = true;
		}
		// Сброс маски
		if(!this.mask){
			this.maskEls = null;
			this.maskConsts = null;
			this.maskSpecials = null;
			this.maskPrefix = null;
			this.setEmptyText('');
			this.setMaxLength(0);
			this.setMinLength(0);
			return;
		}

		// Убираем VTYPE, если он есть - фильтрация символов и проверка значения только по маске
		this.setVtype(null);

		// Спец. символы синтаксиса маски
		if(!this.maskEls || !isObject(this.maskEls)){
			this.maskEls = {
				digits: ['0','#'],
				letters: ['X'],
				common: ['*']
			};
		}
		if(!this.maskEls['digits']){
			this.maskEls['digits'] = ['0','#'];
		}
		if(!this.maskEls['letters']){
			this.maskEls['letters'] = ['X'];
		}
		if(!this.maskEls['common']){
			this.maskEls['common'] = ['*'];
		}

		// выделение всех спецсимволов формата маски
		this.maskSpecials = this.maskEls['digits'].concat(this.maskEls['letters'].concat(this.maskEls['common']));

		// Выделение из маски всех "констант" и выделение "префикса" (строки из констант в начале маски)
		this.maskConsts = [];
		this.maskPrefix = '';
		var maskL = this.mask.length;
		var endPre = false;
		for (var i = 0; i < maskL; i++) {
			var mi = this.mask[i];
			if(!inArray(this.maskSpecials, mi)){
				this.maskConsts[i] = mi;
			}else{
				endPre = true;
			}

			if(!endPre){
				this.maskPrefix+= mi;
			}
		}

		// Если не задан иной emptyText, то использовать маску в качестве теста для пустого значения
		if(!this.emptyText){
			this.setEmptyText(this.mask);
		}

		// Назначение minLength / maxLength поля от формата маски
		var maskL = this.mask.length;
		if(!this.minLength || this.changeMask){
			this.setMinLength(maskL);
		}
		if(!this.maxLength || this.maxLength>1000 || this.changeMask){
			this.setMaxLength(maskL);
		}
	},
	onRender: function(){
		Resolute.Forms.TextField.superclass.onRender.call(this);
		
		// Установка мин/макс длинны значения
		// Если нужно будет сразу при инциализации не нужно выделять-показывать ошибку, сделать: this.setMinLength(this.minLength, true);
		this.setMinLength(this.minLength, true);
		this.setMaxLength(this.maxLength, true);

		// Установка VTYPE
		this.setVtype();

		// назначение функции на нажатие клавиши для валидации на лету
		if(this.getEl()){
			this.mon(this.getEl(), 'keydown', this.beforeKey, this);
			this.mon(this.getEl(), 'keypress', this.filterKeys, this);
			this.mon(this.getEl(), 'keyup', this.afterKey, this);
		}
		
		if(this.password){
			this.getEl().setAttribute('type','password');
		}

		if(this.emptyText){
			this.setEmptyText(this.emptyText);
		}
		if(Resolute.isString(this.mask)){
			this.setEmptyText(this.mask);
		}
		if(Resolute.isObject(this.mask) && this.mask.mask){
			this.setEmptyText(this.mask.mask);
		}
		
		// установка обработчика для маски
		if(this.getEl()){
			this.mon(this.getEl(), 'keypress', this.processMaskOnKey, this);
			this.mon(this.getEl(), 'keyup', this.processMaskFormat, this);
		}

		// формат по маске, если она есть
		this.processMaskFormat();
	},
	setValue: function(v){
		// установка значения поля
		if(!R.isDefined(v)){
			v = '';
		}

		Resolute.Forms.TextField.superclass.setValue.call(this, v);

		// Применение значения
		this.value = v;
		this.setText();

		// формат по маске, если она есть (осторожно, возможно зацикливание setValue - processMaskFormat - setValue - ...)
		this.processMaskFormat();

		this.toggleClear();
		this.onSetValue();
	},
	getValue: function(){
		// Получение фактического текущего значения поля
		if(!this.rendered){
			return this.value;
		}

		// Назначаем в значение фактический текст поля
		this.value = this.getEl().dom.value;
		return this.value;
	},
	setText: function(){
		// Функция для физического применения значения к DOM-элементу поля
		// Выделено в функцию для возможного переопределения, если нужно будет предварительно обработать значение перед применением
		var text = this.value || '';
		if(!this.rendered) return;
		this.getEl().dom.value = text;
	},
	getText: function(){
		// получение текста в DOM-элементе поля
		if(!this.rendered) return '';
		return this.el.dom.value;
	},
	setMinLength: function(n, silent){
		// Установка минимальной длинны значения поля
		if(!R.isDefined(n)){
			n = this.minLength;
		}
		this.minLength = n;

		if(!R.isNumber(this.minLength) || !this.minLength || this.minLength<0){
			this.minLength = 0;
		}

		if(this.maxLength && this.minLength > this.maxLength){
			this.setMaxLength(this.minLength);
		}

		// установка на уровне DOM
		if(this.rendered){
			this.getEl().dom.minLength = this.minLength?this.minLength:0;
		}

		// Обновление текста ошибки
		this.errorsList.minLength = this.getErrorTmp('minLength').format(this.minLength);

		if(!silent){
			this.validate();
		}
	},
	setMaxLength: function(n, silent){
		// Установка максимальной длинны значения поля
		if(!R.isDefined(n)){
			n = this.maxLength;
		}
		this.maxLength = n;

		if(!this.maxLength){
			this.maxLength = 9999999999999999;
		}

		if(!R.isNumber(this.maxLength) || !this.maxLength || this.maxLength<0){
			this.maxLength = 0;
		}

		if(this.minLength && this.minLength > this.maxLength){
			this.setMinLength(this.maxLength);
		}

		// установка на уровне DOM
		if(this.rendered){
			this.getEl().dom.maxLength = this.maxLength?this.maxLength:9999999999999999;
		}

		// Обновление текста ошибки
		this.errorsList.maxLength = this.getErrorTmp('maxLength').format(this.maxLength);

		if(!silent){
			this.validate();
		}
	},
	setVtype: function(vtype){
		// Установка VTYPE (R.vtypes) на поле, если аргумент не передан, установка текущего this.vtype
		if(!R.isDefined(vtype)){
			vtype = this.vtype;
		}
		this.vtype = vtype;

		// Сброс VTYPE
		if(!this.vtype){
			this.maskRe = null;
			this.funcRe = null;
			this.textRe = '';
			return;
		}

		// установка маски ввода
		if(R.vtypes[vtype + 'Mask']){
			this.maskRe = R.vtypes[vtype + 'Mask'];
		}else{
			this.maskRe = null;
		}

		// установка функции валидации значения
		if(R.vtypes[vtype] && R.isFunction(R.vtypes[vtype])){
			this.funcRe = R.vtypes[vtype];
		}else{
			this.funcRe = null;
		}

		// установка текста ошибки валидации значения
		if(R.vtypes[vtype + 'Text']){
			this.textRe = R.vtypes[vtype + 'Text'];
		}else{
			this.textRe = '';
		}
	},
	setEmptyText: function(text){
		// Установка Текста для Пустого поля (если поле пустое)
		this.emptyText = text || null;
		if(this.emptyText == ''){
			this.emptyText = null;
		};
		if(this.rendered){
			if(this.emptyText){
				this.getEl().setAttribute('placeholder',this.emptyText);
			} else {
				this.getEl().removeAttribute('placeholder');
			}
		}
	},
	beforeKey: function(e){
		// На нажатие клавиши
		// пустая функция для переопределения в потомках
	},
	filterKeys: function(e){
		// Фильтрация вводимых значений по VTYPE (this.maskRe)
		// Почти полный копи-паст из EXTа
		if(e.ctrlKey){
			return;
		}
		var k = e.getKey();
		
		var cc = String.fromCharCode(e.getCharCode());
		if(e.isSpecialKey() && !cc){
			return;
		}

		if(this.maskRe && !this.maskRe.test(cc)){
			e.stopEvent();
		}

		// максимальная длинна значения
		var value = this.getText();
		if(value && this.maxLength && R.isNumber(this.maxLength) && value.length > this.maxLength){
			e.stopEvent();
		}

		if(this.onKey) this.onKey(e, cc);
	},
	onKey: function(){
		// На ввод символа, после filterKeys()
		// пустая функция для переопределения в потомках
	},
	afterKey: function(){
		// После ввода символа
		this.fireEvent('keyup', this);

		// показать / скрыть иконку удаления значения
		this.toggleClear();
	},
	processMaskOnKey: function(e){
		if(!this.mask){
			return;
		}
		if(e.ctrlKey){
			return;
		}
		var k = e.getKey();

		// Если есть префикс по маске и поле пустое, то установить префикс
		this.setMaskPrefix();

		// Введенный символ
		var ch = String.fromCharCode(e.getCharCode());
		if(!ch){
			return;
		}
		
		// Разрешаем любые символы в попытке обеспечить более мягкое требования к заполнению поля
		// Если запретить спецсимволы, то вводить значение его можно только от начала и до конца
		// А исправлять только удалив с конца до места исправления
		/*if(e.isSpecialKey() && !ch){
			return;
		}*/
		

		// индекс вводимого символа в строке-значении поля
		var v = this.getValue();
		if(!v || !isString(v)){
			v = '';
		}
		var index = this.getSelectionStart();
		if(!index) {
			index = v.length;
		}

		// Валидация вводимого символа по маске
		var res = this.tryMaskByChar(ch, index);
		if(!res){
			e.stopEvent();
		}
	},
	tryMaskByChar: function (ch, i){
		// анализ символа на маску ввода по индексу символа
		// сугубо приватная функция
		if(!ch || !isDefined(i) || !this.mask){
			return;
		}
		var res = false;

		// если индекс за пределами маски - сразу отказ
		if(i >= this.mask.length){
			return res;
		}

		// получим символ в маске, соответствующий индексу и следующий символ маски
		var maskCh = this.mask[i];

		// ожидается цифра
		if(inArray(this.maskEls['digits'], maskCh)){
			if(/^[0-9]$/.test(ch)){
				res = true;
			}
		}
		// ожидается буква (не цифра)
		else if(inArray(this.maskEls['letters'], maskCh)){
			if(!/^[0-9]$/.test(ch)){
				res = true;
			}
		}
		// ожидается любой символ
		else if(inArray(this.maskEls['common'], maskCh)){
			res = true;
		}
		// ожидается константа
		else if(ch === maskCh){ // this.maskConsts[i] == ch
			res = true;
		}

		return res;
	},
	processMaskFormat: function(e){
		// приведение строки (значения поля) к формату маски - добавление разделителей
		if(!this.mask || (e && e.getKey() === 8)){
			return;
		}

		var v = this.getText();
		if(!v){
			return;
		}

		// Текущая позиция в тексте - если текст исправляется где-то в середине, пока не пытаемся автоматически применить маску
		var pos = this.getSelectionStart();
		var vl = v.length;
		if(vl != pos) {
			return;
		}
		
		var maskL = this.mask.length;
		var newV = []; // будущее новое значение
		var index = 0; // индекс анализируемого символа в сроке
		var endV = false; // строка значения достигла конца
		var end = false; // конец обработки маски - наступает, если к значению добавлены все разделители после конца значения

		for (var i = 0; i < maskL; i++) {
			if(!isDefined(v[index])){
				endV = true; // строка закончилась
			}
			
			// текущий символ строки
			var vi = v[index];

			// проверка конца обработки
			if(endV && !this.maskConsts[i] && !end){
				end = true; // строка + постфикс из констант закончился
			}
			if(end){
				continue;
			}

			// если i-тый символ маски - константа, а i-тый символ значения - нет, то добавляем к результату константу
			if(this.maskConsts[i] && vi != this.maskConsts[i]){
				newV.push(this.maskConsts[i]);
			}
			else{
				if(!endV){
					newV.push(vi);
				}
				index++;
			}
		}

		// соединяем результат
		var newValue = newV.join('');

		// Если ничего не изменилось - на выход
		if(newValue === v && newValue === this.value) {
			return;
		}

		// Обновление значения
		if(this.setValueString){
			this.setValueString(newValue);	
		}else{
			this.setValue(newValue);
		}
	},
	setMaskPrefix: function(){
		// Если есть префикс по маске и поле пустое, то установить префикс
		if(this.mask && this.maskPrefix && !this.getValue()){
			if(this.rendered){
				this.getEl().dom.value = this.maskPrefix;
			}
		}
	},
	unsetMaskPrefix: function(){
		// Убрать префикс по маске, если в поле есть только он
		if(this.mask && this.maskPrefix && this.getValue() == this.maskPrefix){
			if(this.rendered){
				this.getEl().dom.value = '';
			}
		}
	},
	preFocus: function(){
		// перед получением фокуса
		Resolute.Forms.TextField.superclass.preFocus.call(this);
		// Если есть префикс по маске и поле пустое, то установить префикс
		this.setMaskPrefix();
	},
	postBlur: function(){
		// Убрать префикс по маске, если в поле есть только он
		this.unsetMaskPrefix();

		Resolute.Forms.TextField.superclass.postBlur.call(this);

		// формат по маске, если она есть
		this.processMaskFormat();
		
		var value = this.getValue();
		if(!value || value == ''){
			this.hideButton('clear');
		} else {
			this.showButton('clear');
		}
	},
	selectText: function(start, end){
		// Полный копи-паст из Ext.TextField (кроме закомментированого)
		// В FireFox не работает, если вручную не установлен фокус.
		// В Chrome работает
		var v = this.getValue();
		if(!v) return;
		var doFocus = false;
		if(v.length > 0){
			start = start === undefined ? 0 : start;
			end = end === undefined ? v.length : end;
			var d = this.getEl().dom;
			if(d.setSelectionRange){
				d.setSelectionRange(start, end);
			}else if(d.createTextRange){
				var range = d.createTextRange();
				range.moveStart('character', start);
				range.moveEnd('character', end-v.length);
				range.select();
			}
			doFocus = true; // Ext.isGecko || Ext.isOpera
		}else{
			doFocus = true;
		}
		if(doFocus){
			this.focus();
		}
	},
	getSelectionStart: function() {
		// Получение позиции курсора в тексте
		if(!this.rendered || !this.el || !this.el.dom) {
			return 0;
		}
		return this.el.dom.selectionStart;
	},
	setSelectionStart: function(pos) {
		// Назначение позиции курсора в тексте
		if(!this.rendered || !this.el || !this.el.dom) {
			return;
		}
		this.el.dom.selectionStart = this.el.dom.selectionEnd = pos;
	},
	maskValidate: function(){
		// валидация значения поля по маске
		if(!this.mask){
			return true;
		}

		var v = this.getValue();
		if(!v || !isString(v)){
			return true;
		}

		var l = v.length;
		var valid = true;
		for (var i = 0; i < l; i++) {
			if(!this.tryMaskByChar(v[i], i)){
				valid = false;
			}
		}

		return valid;
	},
	isValid: function(){
		// Валидация значения поля. не воздействует на поле, только возвращает TRUE/FALSE
		// Служит составной частью для Resolute.Forms.Field.validate()
		
		// Обновление текущего значения поля
		this.getValue();

		// Базовая валидация - у компонента-предка (Field)
		var baseValid = Resolute.Forms.TextField.superclass.isValid.call(this);
		if(!baseValid){
			return baseValid;
		}

		// Получение значения для валидации
		var value = this.value;
		if(!value || R.isEmpty(value) || !R.isDefined(value) || !R.isString(value)){
			value = '';
		}

		// Собственная валидация TextField - минимальная длинна значения
		if(value && this.minLength && R.isNumber(this.minLength) && value.length < this.minLength){
			this.errorCode = 'minLength';
			this.errorsList.minLength = this.getErrorTmp('minLength').format(this.minLength);
			return false;
		}

		// Собственная валидация TextField - максимальная длинна значения
		if(value && this.maxLength && R.isNumber(this.maxLength) && value.length > this.maxLength){
			this.errorCode = 'maxLength';
			this.errorsList.maxLength = this.getErrorTmp('maxLength').format(this.maxLength);
			return false;
		}

		// Валидация по VTYPE
		if(value && this.vtype && this.funcRe && !this.funcRe(value, this)){
			this.setError(this.textRe, true);
			return false;
		}

		// Валидация по маске
		if(!this.maskValidate()){
			this.errorCode = 'mask';
			this.errorsList.mask = this.getErrorTmp('mask').format(this.mask);
			return false;
		}

		return true;
	}
});
Resolute.reg('textfield', Resolute.Forms.TextField);