/*	Resolute.TabPanel (rtype: 'tabs')
	
	Компонент для отображения вкладок формы.
	
	Функциональная нагрузка: 
		- отрисовка вкладок по переданному массиву data: [{code, name, <cls>, <width>}]
		- выделение текущей вкладки классом CSS
		- инициация события выделения вкладки, вызов плагинизируемой функции onTabChange(code)

	Параметры конфигурации:
	{
		data: [ - массив, описывающий вкладки
			{
				code: '<Код вкладки>', - обязательно
				name: '<Наименование (визуализируется)>', - обязательно
				width: <int>, - ширина вкладки, необязательно
				cls: '', - дополнительный CSS-класс вкладки, 
				disabled: <bool>, - базовая блокировка вкладки, необязательно
				hidden: <bool>, - базовая видимость вкладки, необязательно
			}
		]
		cls: '' - дополнительный CSS-класс панели вкладок
		itemCls: 'tabPanel-item' - основной CSS-класс всех вкладок
	}

	Реакция на изменение вкладки может быть описана двумя споcобами:
	1. В функции onTabChange(code) экземпляра объекта класса TabPanel.
		var tabs = new R.TabPanel({
			renderTo: '<id родителя, куда нужно прорисовать поле>',
			data: [{code: '1', name: 'Вкладка 1'}],
			onTabChange: function (code) {
				if(code == '1'){
					// программный код
				}
			}
		});
	2. Обрабатывая событие "tabclick" для компонента Resolute.TabPanel
		var markup = {
			cn: [
				{rtype: 'tabs', ref: 'elTabs', data: [{code: '1', name: 'Вкладка 1'}]},
				{cn:[]}
			]
		}
		var tmp = new Resolute.Markup.Template({markup: markup});
		items = {};
		cmps = {};
		tmp.apply(<target element>, items, cmps);

		cmps['elTabs'].on('tabclick', function (code) {
			if(code == '1'){
				// программный код
			}
		}, scope);


	Сервисные функции компонента:
	getTab(code) - получить элемент вкладки по её коду
	selectTab(code) - переключить на вкладку с указанным кодом (вызов функции onTabChange() и события 'tabclick')
	enableTab(code) / disableTab(code) - сделать доступной/заблокировать вкладку с указанным кодом
	showTab(code) / hideTab(code) - показать/скрыть вкладку с указанным кодом

	CSS-стили описаны в файле resolute4-tabPanel.css
 */
Resolute.TabPanel = Resolute.extend(Resolute.Component, {
	data: [],
	cls: '',
	itemCls: 'tabPanel-item',
	initComponent: function(){
		this.addEvents(
			'tabclick'
		);

		if(!this.data){
			this.data = [];
		}

		// По умолчанию текущая вкладка - первая в списке
		this.selected = R.xp(this.data, '0.code');

		// Может быть передан параметр selected у одной из вкладок
		var selected = findIn(this.data, 'selected', true);
		if(selected){
			this.selected = R.xp(selected, 'code');
		}

		// Макет
		this.cls = 'tabPanel ' + (this.cls || '');
		this.getMarkup();
		
		Resolute.TabPanel.superclass.initComponent.call(this);
	},
	getMarkup: function(){
		// Формирование разметки макета по массиву this.data
		var tabsM = [];
		R.each(this.data, function(item){
			if(!item.code){
				return;
			}

			// Опциональный CSS для вкладки
			var cls = this.itemCls;
			if(item.cls){
				cls+= ' ' + item.cls;
			}

			// Заброкированная вкладка от конфига
			if(item.disabled){
				cls+= ' disabled';
			}

			// Опциональная Ширина вкладки
			var st = '';
			if(item.width){
				if(isNumber(item.width)){
					item.width+='px';
				}
				st = 'width: ' + item.width;
			}

			var itemM = {cls: cls, cn: R.xp(item, 'name', ''), ref: item.code, st: st};
			tabsM.push(itemM);
		}, this);

		// Общая разметка
		this.markup = {cls: this.cls, cn: tabsM};

		return this.markup;
	},
	onRender: function(){
		Resolute.TabPanel.superclass.onRender.call(this);

		// Основной элемент определяем по ID, потому что кодировка "main" может быть занята одной из вкладок
		this.el = R.get(this.id);

		// Слушаем клик
		this.mon(this.getEl('wrap'), 'click', this.onClick, this);

		// Скрытые от конфига вкладки
		R.each(this.data, function(item){
			if(item.hidden){
				this.hideTab(item.code)
			}
		}, this);

		// Выделение текущей вкладки
		this.selectTab(this.selected);
	},
	onClick:function(event, dom){
		// Клик на один из элементов-вкладок
		var el = R.get(dom);
		if(!el || !el.hasClass || !el.hasClass(this.itemCls)){
			return;
		}

		// Получение (поиск) кода элемента вкладки
		var tabCode = null;
		R.each(this.elements, function(item, code){
			if(item.dom == dom){
				tabCode = code;
			}
		}, this);

		// Изменение вкладки не происходит по клику на текущую вкладку
		if(!tabCode || tabCode == this.selected){
			return;
		}

		// Изменение вкладки не происходит, если она заблокирована
		if(el.hasClass('disabled')){
			return;
		}

		// Инициация события изменения вкладки
		this.selectTab(tabCode);
	},
	getTab: function(code){
		// Получить элемент вкладки по её коду
		if(!code){
			return null;
		}

		return this.getEl(code);
	},
	selectTab: function(code){
		// выделение указанной вкладки в качестве текущей
		if(!code){
			code = this.selected;
		}
		if(!code){
			return;
		}

		var tabEl = this.getTab(code);
		if(!tabEl){
			return;
		}

		R.each(this.elements, function(el){
			if(el && el.removeClass){
				el.removeClass('selected');
			}
		}, this);
		tabEl.addClass('selected');

		this.selected = code;

		this.onTabChange(this.selected);
		this.fireEvent('tabclick', this.selected, this);
	},
	enableTab: function(code){
		// Разблокировать вкладку с указанным кодом
		var tabEl = this.getTab(code);
		if(tabEl) {
			tabEl.removeClass('disabled');
		}
	},
	disableTab: function(code){
		// Блокировать вкладку с указанным кодом
		var tabEl = this.getTab(code);
		if(tabEl) {
			tabEl.addClass('disabled');
		}
	},
	hideTab: function(code){
		// Скрыть вкладку
		var tabEl = this.getTab(code);
		if(tabEl) {
			tabEl.hide();
		}
	},
	showTab: function(code){
		// Показать вкладку
		var tabEl = this.getTab(code);
		if(tabEl) {
			tabEl.show();
		}
	},
	onTabChange: Resolute.emptyFn
});

Resolute.reg('tabs', Resolute.TabPanel);