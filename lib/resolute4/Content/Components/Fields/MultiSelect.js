/**
	Resolute.Forms.MultiSelect
	Поле множественного выбора из списка (массива) значений.

	var multiselect = new R.Forms.MultiSelect({renderTo: 'ext-comp-1012', data: [{code: '01', name: 'Значение 1'}, {code: '02', name: 'Значение 2'}], mandatory: true})
	var multiselect = new R.Forms.MultiSelect({renderTo: 'ext-comp-1012', data: [{code: '01', name: 'Значение 1'},{code: '02', name: 'Значение 2'},{code: '03', name: 'Значение 3'},{code: '04', name: 'Значение 4'},{code: '05', name: 'Значение 5'},{code: '06', name: 'Значение 6'},{code: '07', name: 'Значение 7'},{code: '08', name: 'Значение 8'},{code: '09', name: 'Значение 9'},{code: '10', name: 'Значение 10'}]})

	Инициализация вне контекста:  
	var multiselect = new R.Forms.MultiSelect({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		data: [<массив объектов: {code, name}>],
		codeField: '<параметр-идентификатор объекта в массиве>' - по умолчанию = 'code',
		displayField: '<параметр объекта в массиве, который используется для визуализации значения>' - по умолчанию = 'name',
		separator: ', ', - разделитель значений в тексте результата выбора
		confirmClear: '<текст предупреждения-конфирма на удаление значения>' - по умолчанию = отсутствует,
		maxCount: <максимальное количество достуных для выбора вариантов> - по умолчанию = null,
		disabled: true/false,
		hidden: true/false
	});

	CSS Стили элемента описаны в resolute4-form-multiselect.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.MultiSelect = Resolute.extend(Resolute.Forms.Field, {
	title: 'Выберите значения из списка!',
	data: [],
	codeField: 'code',
	displayField: 'name',
	separator: ', ',
	initComponent: function(){
		// используемый шаблон поля
		this.markup = {ref: 'main', cls: 'r-multiselect', a:{tabindex:'0'}};
		this.cls += ' multiselect';

		if(!this.buttons){
			this.buttons = [{code:'clear', icon:'mi-clear', hidden:true}];
		}

		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.MultiSelect.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'click','change'
		);

		if(!this.data || !isArray(this.data) || isEmpty(this.data)){
			this.data = [];
		}
	},
	onRender: function(){
		// отрисовка (применение this.data)
		this.setData(this.data);

		Resolute.Forms.MultiSelect.superclass.onRender.call(this);

		if(this.getEl()){
			this.mon(this.getEl(), {
				keypress: this.onKeypress,
				click:this.onClick,
				scope: this
			});
		}
	},
	onClick:function(e,el){
		// Клик по основной части элемента, вызов окна выбора
		if(this.disabled){
			return;
		}
		this.edit();
	},
	onKeypress: function(e){
		this.onClick(e);
	},
	onButtonClick: function(btn){
		if(btn.code == 'clear'){
			this.clearValue();
		}
	},
	confirmClearValue: function(){
		// окно подтверждения действия при удалении значения
		if(!this.confirmClear){
			return;
		}

		R.Msg.ask(this.confirmClear, this.clear, this);
	},
	clearValue:function(e,el){
		// Удаление текущего значения - начальная функция
		if(this.disabled){
			return;
		}

		if(this.confirmClear){
			this.confirmClearValue();
		}else{
			this.clear();
		}
	},
	updateValue: function(v){
		// установка значения по результатам выбора в окне
		this.setValue(v);
		this.onBlur();
	},
	applyCodes: function(codes){
		// Обновление текущего значения
		// CODES - массив кодов выбранных значений в this.data
		if(!isDefined(codes) || !isArray(codes)){
			codes = [];
		}
		if(isEmpty(this.data)){
			return;
		}

		// Поиск значений в this.data, соответствующих переданным кодам
		var list = [];
		R.each(codes, function(code){
			var item = findIn(this.data, this.codeField, code);
			if(item){
				list.push(item);
			}
		}, this);

		// Установка значения
		var value = null;
		if(!isEmpty(list)){
			value = {name: this.getNameFromList(list), data: list};
		}
		this.updateValue(value);
	},
	getNameFromList: function(list){
		// формирование NAME по массиву выбранных значений
		if(!isDefined(list)){
			list = R.xp(this.value, 'data');
		}

		var names = [];
		R.each(list, function(item){
			var nameI = R.xp(item, this.displayField);
			if(isString(nameI)){
				names.push(nameI);
			}
		}, this);

		var name = names.join(this.separator);

		return name;
	},
	setData: function(data){
		// установка массива данных и перерисовка элемента
		if(!data || !isArray(data) || isEmpty(data)){
			this.data = [];
			this.setValue(null);
			return;
		}

		this.data = data;

		// Если есть текущее значение и оно хотя бы в одном варианте не присутствует в DATA, обнуляем значение
		var currentList = R.xp(this.value, 'data');
		if(currentList && !isEmpty(currentList)){
			var is = true;
			R.each(currentList, function(item){
				var code = R.xp(item, this.codeField);
				var v = findIn(this.data, this.codeField, code);
				if(!v){
					is = false;
				}
			}, this);
			if(!is){
				this.setValue(null);
			}
		}
	},
	setText: function(){
		// установка уже текстового значения в поле формы
		if(!this.rendered || !this.getEl()){
			return;
		}

		var text = R.xp(this.value, this.displayField, '');
		if(!text || !isString(text)){
			text = '';
		}

		this.getEl().setHtml(text);
	},
	setValue: function(v){
		// установка значения
		Resolute.Forms.MultiSelect.superclass.setValue.call(this, v);

		if(!v || isEmpty(R.xp(v, 'data'))){
			v = null;
		}

		this.value = v;
		this.setText();

		// Скрыть/показать иконку удаления
		if(!this.value || this.value == ''){
			this.hideButton('clear');
		} else {
			this.showButton('clear');
		}

		this.onSetValue();
	},
	edit: function(){
		// Показать окно выбора значений
		if(this.win && this.win.close){
			this.win.close();
		}
		this.win = {
			parent: this
		};

		// Маска
		R.getBody().mask({cls:'resolute-modal hidden'}).getMask();
		this.win.mask = Resolute.getBody().getMask();
		this.win.mask.addClass('hidden'); // первоначально скрыто, чтобы потом применить стиль с анимацией для показа

		// Список вариантов значений
		if(!this.data || !isArray(this.data) || isEmpty(this.data)){
			this.data = [];
		}

		// Список вариантов для выбора - чекбоксами
		var list = [];
		var currentList = R.xp(this.value, 'data');
		R.each(this.data, function(item){
			itemValue = false;
			if(findIn(currentList, this.codeField, R.xp(item, this.codeField))){
				itemValue = true;
			}

			list.push({
				rtype: 'checkbox',
				name: R.xp(item, this.codeField),
				boxLabel: R.xp(item, this.displayField),
				mode: 'v',
				value: itemValue
			});
		}, this);

		// Разметка окна
		var markup = {
			cls:'resolute-modal-wrap r-multiselect-modal',
			cn:{
				cls: 'resolute-modal-body',
				cn:[
					{cls:'caption', cn:[{t: 'span', cls: 'title', cn: this.title}]},
					{cls:'r-multiselect-content', cn:[
						{
							cls:'r-multiselect-search field',
							cn:[{
								rtype: 'textfield',
								code: 'searchField',
								emptyText: 'Введите текст для поиска значения'
							}]
						},
						{cls:'r-multiselect-list', cn: list}
					]},
					{cls:'footer', cn:[
						{cls:'button', ref: 'ok', cn: 'Выбрать'},
						{cls:'button', ref: 'close', cn: 'Отмена'}
					]}
				]
			}
		};

		// Инициализация окна
		var tpl = new Resolute.Markup.Template({markup: markup});
		var cmps = {};
		var refsEls = {};
		tpl.apply(this.win.mask, refsEls, cmps);

		// Эффект анимации появления
		this.win.mask.addClass('z-20001');
		this.win.mask.addClass('hidden');
		this.win.mask.removeClass.defer(100, this.win.mask, ['hidden']);

		// Запоминаем в объект окна нужные данные
		this.win.fields = cmps;
		this.win.data = list;

		// Функции окна на изменение полей в окне
		this.win.onChange = function(fld){
			// Фильтрация - скрываем все, которые не удовлетворяют фильтру
			if(fld.code == 'searchField'){
				var filterText = fld.getValue();
				var reg = new RegExp(filterText, "i");

				R.each(this.fields, function(f){
					if(!f || !f.boxLabel){
						return;
					}

					if(!filterText || reg.test(f.boxLabel)){
						f.show();
					}else{
						f.hide();
					}
				}, this);
			}

			// Максималькое количество - если достигнуто, остальные блокируем, иначе разблокируем
			if(fld.rtype == 'checkbox' && this.parent.maxCount > 0){
				this.onMaxCount();
			}
		};

		// Функция проверки достижения максимального значения вариантов для выбора
		this.win.onMaxCount = function(){
			if(!this.parent.maxCount){
				return;
			}

			var codes = this.getCodes();
			var count = codes.length;
			R.each(this.fields, function(f){
				if(f.rtype != 'checkbox'){
					return;
				}

				if(!f.getValue()){
					if(count >= this.parent.maxCount){
						f.disable();
					}else{
						f.enable();
					}
				}
			}, this);
		};

		// Функция закрытия (уничтожения) окна
		this.win.close = function(){
			this.mask.addClass('hidden');
			this.remove.defer(100, this);
		};
		this.win.remove = function(){
			if(this.mask.dom.parentNode){
				this.mask.dom.parentNode.removeChild(this.mask.dom);
			}
			delete parent.win;
		};

		// Функция применения выбранного
		this.win.getCodes = function(){
			var codes = [];
			for(cmpId in cmps){
				var cmp = cmps[cmpId];
				if(cmp && cmp.rtype == 'checkbox' && cmp.getValue()){
					codes.push(cmp.name);
				}
			}
			return codes;
		};
		this.win.apply = function(){
			this.parent.applyCodes(this.getCodes());
			this.close();
		};

		// Вызовы-обработчики для компонентов
		for(cmpId in cmps){
			var cmp = cmps[cmpId];
			if(cmp && cmp.rtype == 'checkbox'){
				cmp.on('change', function(fld){
					this.win.onChange.call(this.win, fld);
				}, this);
			}
			else if(cmp && cmp.code == 'searchField'){
				cmp.on('keyup', function(fld){
					this.win.onChange.call(this.win, fld);
				}, this);
				cmp.on('change', function(fld){
					this.win.onChange.call(this.win, fld);
				}, this);
			}
		}

		// Вызовы-клики для кнопок окна
		this.win.btns = {
			ok: R.xp(refsEls, 'ok'),
			close: R.xp(refsEls, 'close')
		};
		this.win.btns.ok.on('click', this.win.apply, this.win);
		this.win.btns.close.on('click', this.win.close, this.win);

		// Проверка максимального количесва
		this.win.onMaxCount.call(this.win);

		// Вызов получения фокуса для корректной логики "перед изменением поля"
		this.onFocus();
	}
});
Resolute.reg('multiselect', Resolute.Forms.MultiSelect);