/**
	Resolute.Forms.Field
	Базовый компонент полей формы. По умолчанию, текстовое поле.
	Служит расширяемой основой для всех RTYPE.

	Инициализация вне контекста:  
	var field = new R.Forms.Field({
		renderTo: '<id родителя, куда нужно прорисовать поле>', 
		mandatory: true/false,
		html: {шаблон (Resolute.Markup.Template)},
		label: null/'метка поля', 
		labelPosition: 'top', - Расположение лейбла поля (left - слева, top - сверху, right - справа), по умолчанию = top
		labelWidth: 180, - Ширина лейбла (число - пиксели), по умолчанию = 180
		readOnly: true/false,
		disabled: true/false,
		hidden: true/false,
		postprocess: 'trim' / ['trim', 'upperCaseFirst'],
		value: null, - значение поля при инициалиации
		def: mixed, - значение поля по умолчанию (применяется при значении поля = null, если def !== null)
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
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.Field = Resolute.extend(Resolute.Component, {
	wrap:true,
	isFormField: true,
	allowBlank: true,
	label: null,
	labelPosition: 'top',	// Расположение лейбла поля (left - слева, top - сверху, right - справа)
	labelWidth: 180,		// Ширина лейбла (число - пиксели)
	focusClass:'focused',
	cssClasses:{
		invalid:'invalid',
		disabled:'disabled'
	},
	resizeEl:'field',
	errors: {
		default:'Ошибка заполнения поля',
		mandatory: 'Обязательно для заполнения'
	},
	errorsList: null,
	cls:'field-wrap',
	errorTarget:'below',	// Где выводить сообщение об ошибке: below - внизу поля, tooltip - в виде тултипа при наведении на поле
	validateOnBlur: true,
	clearConfirm: null,
	def: null,
	initComponent: function(){
		// Базовая разметка поля
		this.fieldMarkup = {t:'input', ref:'main'};
		if(this.markup){
			this.fieldMarkup = Resolute.clone(this.markup);
		}
		if(!this.fieldMarkup.ref) this.fieldMarkup.ref = 'main';

		// Класс CSS field-wrap должен быть всегда, если используется CSS Резолюта
		if(!this.cls){
			this.cls = 'field-wrap';
		} 
		else{
			this.cls += ' field-wrap';
		}
		
		// Формирование разметки
		this.markup = [];

		// Метка поля
		if(this.label){
			this.markup.push({t:'label',cls:(this.mandatory)?'mandatory':'',ref:'label',cn:this.label});
			this.cls += ' label-'+(this.labelPosition||'left');
			if(this.labelPosition != 'top') this.cls += ' cols-'+this.labelWidth;
		} else {
			this.cls += ' nolabel';
		}

		// Поле (основной элемент)
		this.markup.push({
			cls: 'field',
			ref: 'field',
			st: this.style,
			cn:[
				this.fieldMarkup,
				((this.buttons)?{cls:'buttons',ref:'buttons'}:null)
			]
		});	
		
		// helpText
		this.markup.push({
			cls: 'helptext',
			ref: 'helpText',
			cn: this.helpText
		});

		// Доступные события
		this.addEvents(
			'focus',
			'blur',
			'change',
			'setvalue',
			'buttonclick',
			'clear'
		);

		Resolute.Forms.Field.superclass.initComponent.call(this);

		// Обязательность
		if(this.mandatory || this.allowBlank === false){
			this.mandatory = true;
			this.allowBlank = false;
			this.cls += ' mandatory';
		}

		// Клонируем объект ошибок валидации, чтобы не затирать шаблоны. 
		this.errorsList = R.clone(this.errors);
		
		this.invalidText = null;
		this.originalValue = this.getValue();
		this.previousValue = this.getValue();
	},
	getErrorMsg:function(type){
		// Получение текста ошибки по типу
		var error = '';
		if(this.errorsList.default) error = this.errorsList.default;
		if(this.errorsList[type]) error = this.errorsList[type];
		return error;
	},
	getErrorTmp:function(type){
		// Получение шаблона текста ошибки по типу
		var error = '';
		if(this.errors.default) error = this.errors.default;
		if(this.errors[type]) error = this.errors[type];
		return error;
	},
	getCssClass:function(type){
		return (this.cssClasses[type])?this.cssClasses[type]:null;
	},
	getName: function(){
		return this.name || this.id || '';
	},
	getNamespace:function(){
		return this.namespace || null;
	},
	getNs:function(){
		return this.getNamespace();
	},
	getPath:function(){
		// Получить путь к полю
		var p = [];
		var ns = this.getNamespace();
		if(ns) p.push(ns);
		var n = this.getName();
		if(n) p.push(n);
		return (p.length>0)?p.join('.'):null;
	},
	onRender:function(){
		if(!this.rendered){
			return;
		}

		Resolute.Forms.Field.superclass.onRender.call(this);

		if(this.tabIndex !== undefined){
			this.getEl().dom.setAttribute('tabIndex', this.tabIndex);
		}

		if(this.readOnly){
			this.setReadOnly(true);
		}

		this.initEvents();

		if(this.hidden){
			this.hide();
		}
		if(this.tooltip){
			this.setTooltip(this.tooltip);
		}

		// Отрисовка кнопок
		this.initButtons();
		
		// Отрисовка иконки
		if(this.icon){
			this.setIcon(this.icon);
			var iconEl = this.getEl('icon');
			if(iconEl.exists()){
				// При клике на лэйбл - фокусируем на основном элементе компонента
				this.mon(iconEl,'click',this.doFocus,this);
			}
		}
		
		// При клике на лэйбл - фокусируем на основном элементе компонента
		var labelEl = this.getEl('label');
		if(labelEl.exists()){
			this.mon(labelEl,'click',function(){
				if(this.doFocus) this.doFocus();
				this.getEl('main').dom.focus();
			},this);
		}

		// Установка значения по умолчанию
		if((!isDefined(this.value) || this.value === null || this.value === '') && this.def !== null) {
			this.value = this.def;
		}
		this.setValue(this.value);

		this.mon(this.getEl(), 'change', this.postprocessing, this);

		// Для использования в потомках
		this.onAfterRender();
	},
	onAfterRender: R.emptyFn,
	initEvents: function(){
		if(!this.getEl() || !this.getEl().on){
			return;
		};
		this.getEl().on('focus', this.onFocus, this);
		this.getEl().on('blur', this.onBlur, this);
	},
	setReadOnly: function(readOnly){
		if(this.rendered){
			this.getEl().dom.readOnly = readOnly;
		}
		this.readOnly = readOnly;
	},
	preFocus: function(){
		// перед получением фокуса
		// пустая функция для переопределения в потомках
	},
	onFocus: function(){
		// получение фокуса
		this.preFocus();
		if(this.focusClass){
			this.getEl('wrap').addClass(this.focusClass);
		}
		if(!this.hasFocus){
			this.hasFocus = true;
			this.startValue = this.getValue();
			this.fireEvent('focus', this);
		}
	},
	beforeBlur: function(){
		// перед потерей фокуса
		// пустая функция для переопределения в потомках
	},
	onBlur: function(){
		// потеря фокуса
		// определение фактического изменения значения поля и генерация события "change"
		this.beforeBlur();
		if(this.focusClass){
			this.getEl('wrap').removeClass(this.focusClass);
		}
		this.hasFocus = false;

		this.fireEvent('blur', this);
		this.postBlur();
	},
	postBlur: function(){
		// после потери фокуса
		this.clearInvalid();

		var v = this.getValue();
		if(!R.equal(v, this.startValue)){
			this.setValue(v);
			this.fireEvent('change', this, v, this.startValue);
		}
		
		if(this.validateOnBlur){
			this.validate();
		}
	},
	postprocessing: function(){
		// Обработка значения поля (при изменении) механизмом постпроцессов (Resolute.postprocess)
		if(!this.postprocess){
			return;
		}
		this.setValue(R.getPP(this.postprocess, this.getValue()));
	},
	show: function(){
		Resolute.Forms.Field.superclass.show.call(this);
	},
	hide: function(){
		this.clearInvalid();
		Resolute.Forms.Field.superclass.hide.call(this);
	},
	onDisable: function(){
		this.clearInvalid();
	},
	setValue: function(v){
		this.previousValue = this.value;
		if(!R.isDefined(v)){
			v = null;
		}
		this.value = v;

		// Вызов обработки окончания действия установки значения
		// В потомках следует повторять этот вызов в конце функции setValue(), если после/вместо родительского setValue() происходит изменение текущего значения
		this.onSetValue();
	},
	onSetValue: function(){
		// Значение по умолчанию, если оно задано и текущее значение отсутствует
		if((this.value === null || this.value === '') && this.def !== null) {
			this.setValue(R.clone(this.def));
		}

		// Событие "установка значения" (установка может быть как программной, так и интерфейской)
		this.fireEvent('setvalue', this, this.value);
	},
	getValue: function(v){
		// Базовая функция получения значения - переопределяется у потомков
		return this.value;
	},
	isDirty: function() {
		if(this.disabled || !this.rendered) {
			return false;
		}
		if(!R.equal(this.getValue(), this.originalValue)){
			return true;
		}
		return false;
	},
	reset: function(){
		// сброс всех изменений значения поля
		this.setValue(this.originalValue);
		this.clearInvalid();
	},
	clear: function(){
		// удаление значения поля
		// При наличии this.clearConfirm (true/'Текст') через подтверждение
		if(this.clearConfirm){
			if(!isString(this.clearConfirm)){
				this.clearConfirm = 'Удалить значение поля?';
			}
			R.Msg.ask(this.clearConfirm, this.clearValue, this);
			return;
		}
		
		this.clearValue();
	},
	clearValue: function(silent){
		// удаление значения поля фактическое
		// silent - анти-флаг инициации события изменения поля
		if(!silent) this.onFocus();
		this.previousValue = this.value;
		this.setValue(null);
		if(!silent) this.onBlur();

		this.fireEvent('clear', this);
	},
	toggleClear: function(){
		// показать / скрыть иконку удаления значения от его наличия
		if(!this.rendered || this.disabled) return;
		
		if(this.getValue()){
			this.showButton('clear');
		}else{
			this.hideButton('clear');
		}
	},
	createErrorEl: function(){
		// создание DIVа под элементом поля для вывода в нём текста ошибки
		if(this.errorEl){
			return this.errorEl;
		}
		this.getEl();
		if(!this.rendered){
			return null;
		}

		this.errorEl = this.getEl('field').after({cls:'error'});
		this.getEl('wrap').addClass(this.getCssClass('invalid'));
		return this.errorEl;
	},
	markInvalid: function(msg){
		// Отметить поле как содержащее ошибку, текст ошибки можно передать
		if(!this.rendered){
			return;
		}
		this.getEl();
		if(!this.rendered){
			return;
		}

		msg = msg || this.invalidText;

		// основной параметр, содержащий текущее состояние валидации и текст ошибки для поля
		this.invalidText = msg; 

		this.getEl('wrap').removeClass(this.getCssClass('invalid')).addClass(this.getCssClass('invalid'));

		if(msg){
			if(this.errorTarget == 'below'){
				if(!this.errorEl){
					this.createErrorEl();
				}
				if(this.errorEl){
					this.errorEl.show();
					this.errorEl.update(msg);
				}
			} else if(this.errorTarget == 'tooltip'){
				this.getEl().setAttribute('data-tooltip',msg).setAttribute('data-tooltip-cls','error');
			}
		}
	},
	clearInvalid: function(){
		// сброс ошибки валидации поля - и логический, и визуальный
		this.invalidText = null;
		if(!this.rendered){
			return;
		}
		this.getEl();
		if(!this.rendered){
			return;
		}

		this.getEl('wrap').removeClass(this.getCssClass('invalid'))

		if(this.errorTarget == 'below'){
			if(this.errorEl){
				this.errorEl.hide();
			}
		} else if(this.errorTarget == 'tooltip'){
			this.getEl().removeAttribute('data-tooltip').removeAttribute('data-tooltip-cls');
		}
	},
	isValid: function(){
		// Проверка валидности поля без действия на невалидность, только проверка и возврат TRUE/FALSE
		// Базовая валидация только на обязательность заполнения от allowBlank / mandatory
		// Полноценная валидация должна переопределяться в потомках
		if(this.hidden) return true;
		this.errorCode = null;
		if(!this.allowBlank && !this.getValue()){
			this.errorCode = 'mandatory';
			return false;
		}
		return true;
	},
	validate: function(silent){
		// Вызов проверки валидности поля и установка инвалидности (отображение ошибки) при необходимости
		if(!silent){
			this.clearInvalid();
		}

		if(this.isValid() && !this.invalidText){
			return true;
		}

		if(!this.invalidText){
			this.invalidText = this.getErrorMsg(this.errorCode);
		}

		if(!silent){
			this.markInvalid(this.invalidText);
		}

		return false;
	},
	setError: function(errorText, silent){
		// установка произвольной ошибки для поля, алиас this.markInvalid()
		// вызов с пустым параметром - снимает ошибку (алиас this.clearInvalid())
		if(!R.isDefined(errorText) || !errorText){
			this.clearInvalid();
			return;
		}
		
		if(silent){
			this.invalidText = errorText;
			return;
		}
		
		this.markInvalid(errorText);
	},
	getError: function(){
		// возврат текущей ошибки (текст), если поле невалидно
		this.validate(true);
		return this.invalidText;
	},
	setAllowBlank: function(val, silent){
		// Назначение необязательности поля
		if(!R.isDefined(val)){
			val = true;
		}
		this.allowBlank = val;
		this.mandatory = !val;
		if(!silent){
			this.validate();
		};
		if(this.setMandatoryStyle) this.setMandatoryStyle();
	},
	setMandatory: function(val, silent){
		// Назначение обязательности поля
		if(!R.isDefined(val)){
			val = true;
		}
		this.mandatory = val;
		this.allowBlank = !val;
		if(!silent){
			this.validate();
		};
		if(this.setMandatoryStyle) this.setMandatoryStyle();
	},
	changeAllowBlank: function(val, silent){
		// Изменение необязательности поля - алиас setAllowBlank для преемственности от EXT.JS
		if(!R.isDefined(val)){
			val = !this.allowBlank;
		}
		this.setAllowBlank(val, silent);

		if(!silent){
			this.validate();
		}
	},
	setMandatoryStyle: function(){
		// Назначение/удаление стиля обязательности от значения this.mandatory
		if(!this.getEl('wrap')) return;
		
		if(this.mandatory && !this.getEl('wrap').hasClass('mandatory')) {
			this.getEl('wrap').addClass('mandatory');
		} else if(!this.mandatory) {
			this.getEl('wrap').removeClass('mandatory');
		}
	},
	onButtonClick:function(btn){
		if(this.isDisabled()) return;

		if(btn.code == 'clear'){
			this.clear();
		}
		
		this.fireEvent('buttonclick', btn, this);
	},
	isButtonHidden:function(btn){
		var b = this.getButton(btn);
		if(!b) return true;
		if(b.el){
			return b.el.hasClass('resolute-hidden');
		};
		return true;
	},
	showButton:function(btn){
		var b = this.getButton(btn);
		if(!b) return;
		if(b.el){
			b.el.show();
		}
	},
	hideButton:function(btn){
		var b = this.getButton(btn);
		if(!b) return;
		if(b.el){
			b.el.hide();
		}
	},
	getButton:function(btn){
		var c = btn;
		var res = null;
		if(Resolute.isObject(btn) && btn.code) c = btn.code;
		Resolute.each(this.buttons, function(button, index){
			if(button.code == c){
				res = button;
			}
		},this);
		return res;
	},
	removeButton:function(btn){
		this.hideButton(btn);
	},
	addButton:function(btn,index){
		if(btn.icon){
			var btnMarkup = {cls:'button has-icon',cn:Resolute.jsml.icon(btn.icon)};
		} else {
			var btnMarkup = {cls:'button text',cn:btn.text};
		}

		var isNew = (index>=0);
		var ind = (isNew)?this.buttons.length:index;
		var btnEl = this.getEl('buttons').append(btnMarkup,true);
		btnEl.data('index',ind);
		
		if(btn.cls){
			btnEl.addClass(btn.cls);
		}
		
		if(btn.icon && btn.iconCls){
			btnEl.child('.icon').addClass(btn.iconCls);
		}
		
		this.mon(btnEl,'click',function(event,el){
			var ind = btnEl.data('index');
			if(!ind) return;
			this.onButtonClick(this.buttons[ind]);
		}, this);
		
		if(isNew){
			this.buttons[ind] = btn;
		}
		
		this.buttons[ind].el = btnEl;
		
		if(btn.hidden){
			this.buttons[ind].el.hide();
		}
		
		if(btn.tooltip){
			this.buttons[ind].el.setAttribute('data-tooltip',btn.tooltip);
		}
	},
	initButtons:function(){
		if(!this.buttons) return;
		//var parent = this.getEl().parent('.field');
		//if(parent) parent.addClass('trigger');
		//this.addEl('buttons',this.getEl().after({cls:'buttons'}));
		Resolute.each(this.buttons,function(btn,index){
			this.addButton(btn,index);
		},this);
	},
	setHelpText: function(helpText){
		// установка содержимого для heltText - текст под полем
		if(!R.xp(this, 'elements.helpText')){
			return;
		}

		this.getEl('helpText').setHtml(helpText);
		this.helpText = helpText;
	},
	setIcon:function(icon){
		// Установка иконки поля
		if(!icon){
			this.unsetIcon();
			return this;
		};
		this.unsetIcon();
		this.icon = icon;
		var markup = null;
		
		if(Resolute.isString(icon)){
			// По умолчанию строка с кодом иконки Material Icons https://fonts.google.com/icons?selected=Material+Icons
			// например setIcon('qr_code_2')
			markup = Resolute.CSS.snippets.get('materialicon',this.icon);
		} else if(Resolute.isObject(icon)){
			// в объекте указывается пакет иконок и код иконки
			// pack: 'fat-cow'
			// icon: 'user'
			// TODO
		}

		if(markup){
			this.addEl('icon',this.getEl('main').before(markup));
			this.getEl('wrap').addClass('has-icon');
		}
		
		return this;
	},
	unsetIcon:function(){
		// Убрать иконку поля
		var iconEl = this.getEl('icon');
		if(iconEl.exists()){
			this.mun(iconEl,'click',this.doFocus,this);
			this.removeEl('icon');
		};
		delete this.icon;
	}
});