/**
	Resolute.Forms.List
	Поле List (переключатель) формы.

	var list = new R.Forms.List({renderTo: 'ext-comp-1012', data: [{code: true, name: 'Да'}, {code: false, name: 'Нет'}], value: true})

	Инициализация вне контекста:  
	var list = new R.Forms.List({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		data: [<массив объектов: {code, name}>],
		value: 'значение по умолчанию' - может быть указан как объект (один из массива this.data), так и значение CODE объекта,
		valueField/codeField: '<параметр-идентификатор объекта в массиве>' - по умолчанию = 'code',
		displayField: '<параметр объекта в массиве, который используется для визуализации значения>' - по умолчанию = 'name',
		disabled: true/false,
		hidden: true/false
	});

	специфические функции:
	- disableItem (<код или индекс переключателя>) - блокировка одного из значений переключателя
	- setData (<массив данных>) - полное переопределение (назначение) массива данных и отрисовка элемента по ним

	CSS Стили элемента описаны в resolute4-form-list.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.List = Resolute.extend(Resolute.Forms.Field, {
	data: [],
	valueField: 'code', // можно использовать codeField
	displayField: 'name',
	direction:'horizontal',	// Направление отрисовки списка (horizontal - горизонтально; vertical - вертикально)
	initComponent: function(){
		if(this.codeField){
			this.valueField = this.codeField;
		}
		if(this.cls != Resolute.Forms.List.superclass.cls){
			this.cls = Resolute.Forms.List.superclass.cls + ' '+ this.cls;
		};
		// используемый шаблон поля
		this.markup = {
			cls: 'r-list unselectable',
			ref:'main',
			a:{'tabindex':'0'},
			cn: []
		};
		
		this.cls += ' list';
		
		if(this.direction == 'vertical'){
			this.markup.cls += ' vertical';
		};
		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.List.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'click','change'
		);

		if(!this.data || !isArray(this.data) || isEmpty(this.data)){
			this.data = [];
		}
	},
	setDirection:function(dir){
		// Сменить направление отрисовки списка
		if(!dir || dir == 'horizontal'){
			this.direction = 'horizontal';
			this.getEl().removeClass('vertical');
		} else if(dir == 'vertical'){
			this.direction = 'vertical';
			if(!this.getEl().hasClass('vertical')) this.getEl().addClass('vertical');
		}
	},
	onRender: function(){
		// отрисовка (применение this.data)
		this.setData(this.data);

		Resolute.Forms.List.superclass.onRender.call(this);

		// назначение функции на нажатие клавиши - для обеспечения переключения значений пробелом при переходах по табу
		if(this.getEl()){
			this.mon(this.getEl(), {
				keypress: this.onKeypress,
				click:this.onClick,
				resize:this.onResize,
				scope: this
			});
		}
	},
	onResize:function(el,rect){
		return;
		// Если мало места для горизонтального списка, то меняем его на вертикальный
		if(this.direction == 'horizontal'){
			var itemsWidth = Resolute.select('.item',this.getEl()).aggWidth();
			var containerWidth = this.getEl('field').getWidth();
			if(Math.round(itemsWidth)>Math.round(containerWidth)){
				this.switchedItemsWidth = Math.round(itemsWidth);
				this.setDirection('vertical');
			}
		} else {
			if(!this.switchedItemsWidth) return;
			var containerWidth = this.getEl('field').getWidth();
			if(Math.round(containerWidth) >= this.switchedItemsWidth){
				this.setDirection('horizontal');
				this.switchedItemsWidth = 0;
			}
		}
	},
	update: function(data){
		// динамическая отрисовка переключателей элемента на основе массива данных
		if(isDefined(data) && isArray(data)){
			this.data = data;
		}

		// Основной контейнер
		var mainEl = this.getEl();

		// Очистить основной контейнер
		mainEl.setHtml('');
		this.items = {};

		// Заполнить в цикле новыми элементами-переключателями
		R.each(this.data, function(item){
			var name = R.xp(item, this.displayField);
			var code = R.xp(item, this.valueField);
			// инициализация ребенка
			var markup = {cn: name};
			if(this.itemTpl){
				// Проверить на разные типы!
				markup = Resolute.clone(this.itemTpl);
			};
			if(!markup.cls) markup.cls = 'item';
			if(!markup.data) markup.data = {code: code};
			if(this.tooltipFromData){
				if(!markup.attr) markup.attr = {};
				markup.attr.tooltip = R.xp(item,this.tooltipFromData);
			};
			var obs = [];
			Resolute.jsml.apply(mainEl,markup,item,obs);
		}, this);
	},
	onClick:function(event,el){
		var itemEl = Resolute.get(el).up('.item');
		if(!itemEl) return;
		if(itemEl.hasClass('active') || itemEl.disabled) return;
		var value = findIn(this.data, this.valueField, itemEl.data('code'));
		if(!R.equal(value, this.value)){
			// установка значения
			this.setValue(value); 
			// Именно тут происходит реальное событие "изменение", но только если предыдущее значение отличается от нового
			this.fireEvent('change', this, value, this.previousValue);
		}
	},
	onKeypress:function(event){
		// При фокусе на элемент нажатия на пробел и ввод переключат чекбокс
		if(Resolute.Event.isKey(event, ['space','enter'])){
			event.preventDefault();
			this.toggle();
		}
	},
	toggle: function(){
		// включение "следующего" значения (по кругу: пустое-первое-второе-...-последнее-первое)
		var index = 0;

		if(this.value && !isEmpty(this.data)){
			var code = R.xp(this.value, this.valueField);
			var i = indexIn(this.data, this.valueField, code);
			if(isInteger(i)){
				index = i + 1;
				if(index >= this.data.length){
					index = 0;
				}
			}
		}

		var v = this.data[index];
		this.setValue(v);
	},
	updateValue: function(){
		// выделение активного переключателя по текущему значению поля

		// убрать активность со всех элементов
		R.select('.active', this.getEl()).removeClass('active');

		// Если значения нет, то на этом и остановимся
		if(!this.value || !isObject(this.value)){
			return;
		}

		// получить новый активный элемент
		var code = R.xp(this.value, this.valueField);
		var activeEl = R.select('.item', this.getEl(),{code:code});
		
		// назначить активным
		if(activeEl){
			activeEl.addClass('active');
		}

		this.validate();
	},
	getItem: function(codeOrIndex){
		// получение элемента одного из переключателей по коду или индексу
		if(!this.items || isEmpty(this.items) || !isDefined(codeOrIndex)){
			return null;
		}

		var item = null;

		// по коду
		var code = codeOrIndex + '';
		var item = R.xp(this.items, code);

		// по ключу
		var index = codeOrIndex;
		if(!item && isInteger(index)){
			var i = 0;
			for (code in this.items){
				if(i == index){
					item = this.items[code];
				}
				i++;
			}
		}

		return item;
	},
	disableItem: function(codeOrIndex){
		// блокировка одного из переключателей элемента
		var itemEl = this.getItem(codeOrIndex);
		if(!itemEl){
			return;
		}

		itemEl.disabled = true;
		if(!itemEl.hasClass('resolute-disabled')){
			itemEl.addClass('resolute-disabled');
		}
	},
	setData: function(data){
		// установка массива данных и перерисовка элемента
		if(!data || !isArray(data) || isEmpty(data)){
			return;
		}

		this.data = data;
		this.update();
	},
	setValue: function(v){
		// установка значения
		Resolute.Forms.List.superclass.setValue.call(this, v);

		// если this.value - не массив (скалярная величина), считаем, что это код в объекте-значении
		if(isScalar(this.value)){
			this.value = findIn(this.data, this.valueField, this.value);
		}

		if(!isDefined(this.value) || !this.value){
			this.value = null;
		}

		// отрисовка текущего значения
		this.updateValue();

		this.onSetValue();
	}
});
Resolute.reg('list', Resolute.Forms.List);