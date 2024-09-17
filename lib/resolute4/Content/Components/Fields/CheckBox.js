/**
	Resolute.Forms.CheckBox
	Поле CheckBox (переключатель TRUE/FALSE) формы.

	var check = new R.Forms.CheckBox({renderTo: 'ext-comp-1012', boxLabel: 'Чекбокс', boxIcon: true})

	Инициализация вне контекста:  
	var field = new R.Forms.CheckBox({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		mode: 'slider'/'checkmark'/'v' - тип визуализации (см. ниже) по умолчанию  = 'slider', 
		boxLabel: 'текст, выводимый справа от переключателя',
		value: 'значение по умолчанию',
		boxIcon: true/false - наличие иконки, по умолчанию это help.png,
		boxIconImg: 'help.png' - название файла для иконки, в наборе assets/resources/images/icons/fatcow/16x16/,
		disabled: true/false,
		hidden: true/false
	});

	CheckBox имеет три типа визуализации (сmode: 'slider'/'checkmark'/'v'):
	  - slider - основной, переключатель
	  - checkmark - галочка в квадрате
	  - v - галочка без квадрата

	CSS Стили элемента описаны в resolute4-form-checkbox.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.CheckBox = Resolute.extend(Resolute.Forms.Field, {
	mode: 'slider',
	boxLabel: '',
	boxIcon: false,
	boxIconImg: 'help',
	tooltipEl:'boxLabel',
	values:[true,false],	// Значения для включенного состояния и выключенного (по-умолчанию истина/ложь)
	initComponent: function(){
		if(!this.boxLabel || !isString(this.boxLabel)){
			this.boxLabel = '&nbsp;';
		}

		// используемый шаблон поля
		var box = 'ball';
		if(this.mode == 'checkmark'){
			box = 'box';
		}
		if(this.mode == 'v'){
			this.mode = 'checkmark';
			box = 'boxempty';
		}
		if(this.mode == 'default'){
			this.mode = 'default';
			box = 'box';
		}
		this.markup = {
			cls: 'r-checkbox unselectable '+this.mode,
			a:{tabindex:'0'},	// Для возможности фокуса на элементе при переходе по форме клавишой tab (стиль элемента с фокусом описан в css)
			cn: [
				{cls:'r-check-' + box, ref: 'check', cn:{cls:'r-check-' + this.mode}},
				{cls:'r-boxlabel',ref:'boxLabel',cn:[{t:'span',cn:this.boxLabel}]}
			]
		};

		// иконка
		if(this.boxIcon){
			this.markup.cn[1].cn.push({
				cls: 'r-boxIcon',
				ref: 'boxIcon',
				cn: Resolute.jsml.icon(this.boxIconImg)
			});
		}
		
		this.cls += ' checkbox';

		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.CheckBox.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'click','change'
		);
	},
	onRender: function(){
		Resolute.Forms.CheckBox.superclass.onRender.call(this);

		// назначение функции на клик
		if(this.getEl()){
			this.mon(this.getEl(), {
				click:this.onSliderClick,
				keypress:this.onKeypress,
				scope:this
			});
		}
	},
	onSliderClick:function(event,el){
		if(this.disabled) return;
		this.clicked = true;
		Resolute.get(el).up('.r-checkbox').addClass('clicked');
		this.toggle(event,el);
	},
	onFocus:function(){
		if(this.clicked){
			this.getEl('main').addClass('clicked');
			this.clicked = false;
		}
		Resolute.Forms.CheckBox.superclass.onFocus.call(this);
	},
	onBlur:function(){
		Resolute.Forms.CheckBox.superclass.onBlur.call(this);
		this.getEl('main').removeClass('clicked');
		this.clicked = false;
	},
	postBlur: function(){
		// переопределение родительской функции, чтобы дважды не срабатывало событие CHANGE
	},
	onKeypress:function(event){
		if(this.disabled) return;
		// При фокусе на элемент нажатия на пробел и ввод переключат чекбокс
		if(Resolute.Event.isKey(event,['space','enter'])){
			this.toggle();
		}
	},
	toggle: function(e, el){
		// переключение чекбокса с текущего состояния на противоположное
		if(this.disabled){
			return;
		}
		// игнор клика на элемент иконки
		if(el && Resolute.get(el).up('.r-boxIcon')){
			return;
		}

		if(this.value){
			this.value = false;
		}else{
			this.value = true;
		}

		this.setValue(this.value);
		this.fireEvent('change',this);
	},
	updateCheck: function(){
		// Обновление состояния переключателя от текущего значения
		var checkEl = this.getEl('check');
		var el = this.getEl('main');
		if(!el || !checkEl || ! this.rendered){
			return;
		}

		if(this.value){
			el.addClass('checked');
		}else{
			el.removeClass('checked');
		}
	},
	setValue: function(v){
		// установка значения
		this.value = this.values[1];
		if(v){
			this.value = this.values[0];
		}
		
		// Обновление состояния переключателя
		this.updateCheck();

		this.onSetValue();
	},
	getValue: function(){
		// получение значения
		return this.value || this.values[1];
	},
	setBoxLabel: function(text){
		// установка (изменение) текста boxlabel
		if(!text || !isString(text)){
			text = '';
		}

		var boxLabelEl = this.getEl('boxLabel');
		if(!boxLabelEl.exists()){
			return;
		}
		this.boxLabel = text;
		boxLabelEl.query('span').update(text);
	},
	setBoxIconFn: function(fn){
		// установка функции на клик по иконке
		if(!fn || !isFunction(fn)){
			fn = null;
		}

		if(this.hasEl('boxIcon')){
			this.mon(this.getEl('boxIcon'), 'click', fn, this);
		}
	}
});
Resolute.reg('checkbox', Resolute.Forms.CheckBox);