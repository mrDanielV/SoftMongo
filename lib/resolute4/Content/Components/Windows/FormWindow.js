/**	Resolute.FormWindow
	Класс всплывающего окна для работы с формой данных

	Пример инициации экземпляра класса:
	var formWindow = new Resolute.FormWindow({
		title: 'Заголовок',
		width: 600,
		tabs: [
			{code: '1', name: 'Вкладка 1', width: 150, cls: 'test'},
			{code: '2', name: 'Вкладка 2'}
		],
		metaform:{
			items:[
				<разметка формы>

				при наличии вкладок, необходимо обозначить принадлежность блоков первого уровня коду нужной вкладки:
				{
					place: 'main',
					cn: [<разметка блока>]
				}
			]
		},
		afterRender: function(){
			// На инициацию окна
			// Назначить данные форме: this.setData(data);
		},
		onFieldChange: function(fld){
			// Обработка изменений значений полей метаформы
		},
		onSubmit: function(){
			// Сохранение
			// получить данные: this.getData();
		}
		... <прочие функции обработки событий формы>
	});

	Список функций для обработки событий экземпляра объекта класса см. ниже по коду: <функция>: R.emptyFn
	Компонент поддерживает и события параллельно с предопределенными функциями для обработки событий.

	Основные опции конфигурации компонента
		readOnly: true/false - по умолчанию = false, блокировка формы от изменения
		data: {} - по умолчанию = null, объект данных для формы
		buttons: [{code, name}] - массив кнопок окна, по умолчанию = набору Сохранить (submit), Закрыть (close)
		callback: функция, вызываемая на SUBMIT формы окна
		scope: окружение фукнции callback
		closeOnSubmit: true/false - по умолчанию = true, закрыть окно на SUBMIT
		autoValidate: true/false - по умолчанию = true, валидировать форму на SUBMIT
		invalidText: 'Проверьте корректность заполнения полей формы' - текст ошибки валидации формы
		cls: '' - по умолчанию не указано, дополнительный CSS-класс, применяемый к окну

	Класс обеспечивает набор сервисных функций для работы с полями формы:
	- getFields() - получение объектов всех полей формы
	- getField(nameOrQuery) - получение объекта поля по его имени (name) или по запросу, например: getField({path: 'content.number'})
	- getFieldV(nameOrQuery, path) - получение значения поля с указанным nameOrQuery, при указании path - будет возвращено значение по пути внутри объекта значения поля

	Гибкую работу с объектом данных формы обеспечивает:
	- this.data - экземпляр Resolute.Data.Observable.
	- this.form - экземпляр Resolute.Form.
	См. описания этих классов.

	Для работы с вкладками формы класс Resolute.FormWindow содержит функции:
	- setTab(code) - программно установить указанную (code) вкладку в качестве текущей
	- hideTab(code) - скрыть вкладку
	- showTab(code) - показать вкладку
	- enableTab(code) - сделать вкладку доступной
	- disableTab(code) - заблокировать вкладку

	Функционал вкладок формы обеспечивается внутренними объектами:
	- this.tabPanel - экземпляр класса Resolute.TabPanel
	- this.cards - Resolute.Layouts.Card. 
	См. описания этих классов.

	CSS-стили описаны в файле resolute4-entity.css
 */
Resolute.FormWindow = Resolute.extend(Resolute.Window, {
	readOnly: false,
	data: null,
	titleButtons: [
		{code: 'fullscreen', icon: 'mi-fullscreen', tooltip: 'На весь экран'},
		{code: 'close', icon: 'mi-close', tooltip: 'Закрыть окно'}
	],
	buttons: [
		{code: 'submit', name: 'Сохранить'},
		{code: 'close', name: 'Закрыть'}
	],
	callback: null,
	scope: null,
	closeOnSubmit: true,
	ignoreESC: true,
	autoValidate: true,
	invalidText: 'Проверьте корректность заполнения полей формы',
	cls: '',
	autoShow: true,
	onBeforePrepare: R.emptyFn,
	afterRender: R.emptyFn,
	onBtnClick: R.emptyFn,
	onChangeTab: R.emptyFn,
	onFieldChange: R.emptyFn,
	onSetData: R.emptyFn,
	beforeSetData: R.emptyFn,
	prepareData: R.emptyFn,
	onSubmit: R.emptyFn,
	initComponent:function(){
		// Доступные события
		this.addEvents(
			'prepare',
			'render',
			'getdata',
			'beforesetdata',
			'setdata',
			'buttonclick',
			'changetab',
			'change'
		);

		// К обязательным CSS-классам объекта можно добавить опциональный
		this.cls = 'r-entity-form form ' + (this.cls || '');

		// Плагинизация initComponent() для потомков
		this.onBeforePrepare();
		this.fireEvent('prepare', this);

		// Макет содержимого окна описывается в this.metaform.items экземпляра объекта класса
		var items = R.clone(R.xp(this, 'metaform.items'));

		// Наличие вкладок
		var tabsMarkup = null;
		if(this.tabs && isArray(this.tabs) && !isEmpty(this.tabs)){
			// Компонент вкладок-переключателей
			tabsMarkup = {rtype: 'tabs', ref: 'entityTabs', data: this.tabs, cls: this.tabsCls};
			this.cls+= 'has-tabs';

			// Разделение макета на панели вкладок (card layout)
			items = this.setCards();
		}

		// Конечный макет разметки
		this.markup = {
			cn: [
				tabsMarkup,
				{
					rtype: 'form',
					cls: this.cls,
					ref: 'entityForm',
					data: this.data || null,
					cn: items
				}
			]
		};

		Resolute.FormWindow.superclass.initComponent.call(this);
	},
	setCards: function(){
		// Переформирование конфигурации макета в card layout - разделение на панели вкладок
		// В качестве кодировки вкладок используется параметр "place" элементов 1-го уровня макета
		var items = R.xp(this, 'metaform.items');
		if(!items || isEmpty(items)){
			return items;
		}

		// Разделение основного макета на панели
		var cardItems = [];
		R.each(this.tabs, function(tab){
			var tabCode = R.xp(tab, 'code');
			var tabItems = filterIn(items, 'place', tabCode);
			if(!isEmpty(tabItems)){
				cardItems.push({
					code: tabCode,
					type: 'entity-card',
					rtype: 'container',
					items: tabItems
				});
			}
		}, this);

		// макет card
		var cards = {
			rtype: 'container',
			layout: 'card',
			ref: 'entityCards',
			items: cardItems
		};

		items = [cards];
		return items;
	},
	onAfterRender:function(){
		// Получение проинициированных основных составных объектов окна
		this.tabPanel = this.getCmp('entityTabs');
		this.form = this.getCmp('entityForm');
		this.cards = this.getCmp('entityCards');

		// Обработка события изменения вкладки
		if(this.tabPanel){
			this.tabPanel.on('tabclick', this.setTab, this);
		}

		// При наличии вкладок делаем минимальную высоту равную максимальной вкладке
		this.setMinHeightByTabs();

		// Получить все поля формы - инициализация this.fields
		this.getFields();

		// Слушать изменение полей формы
		this.form.on('change', this.onChange, this);

		// Инициализация данных как Resolute.Data.Observable формы
		if(!this.data) {
			this.data = this.form.data;
		}
		else if(isObject(this.data)){
			this.setData(R.clone(this.data));
		}

		// Только на чтение (от опции this.readOnly)
		if(this.readOnly) {
			this.setReadOnly(true, true);
		}

		// Плагинизация рендерера для потомков
		this.form.on('render', function(){
			this.afterRender();
			this.fireEvent('render', this);
		}, this);
	},
	onButtonClick:function(code, btnEl){
		// Обработка кликов кнопок
		// Закрыть (close) - стандартная, обрабатывается в Resolute.Window
		// Сохранить (submit) - обрабатывается тут
		// Прочие - плагинизированы в экземпляр класса в функцию onBtnClick

		// Сохранение entity
		if(code == 'submit'){
			this.submit();
		}

		// Плагинизация для потомков
		this.onBtnClick(code);
		this.fireEvent('buttonclick', code, this);
	},
	setTab: function(code){
		// Изменение текущей вкладки (при их наличии)
		if(!code || !this.cards){
			return;
		}

		this.cards.setActiveItem(code);

		// Плагинизация изменения вкладки для потомков
		this.onChangeTab(code);
		this.fireEvent('changetab', code, this);
	},
	hideTab: function(code){
		// Скрыть вкладку с указанным кодом
		if(!this.tabPanel) return;
		this.tabPanel.hideTab(code);
	},
	showTab: function(code){
		// Показать вкладку с указанным кодом
		if(!this.tabPanel) return;
		this.tabPanel.showTab(code);
	},
	enableTab: function(code){
		// Сделать доступной вкладку с указанным кодом
		if(!this.tabPanel) return;
		this.tabPanel.enableTab(code);
	},
	disableTab: function(code){
		// Сделать недоступной вкладку с указанным кодом
		if(!this.tabPanel) return;
		this.tabPanel.disableTab(code);
	},
	setReadOnly: function(state, disableFields){
		// Установка формы только на чтение (просмотр), без возможности изменения/сохранения
		// Актуально только при наличии this.entity или хотя бы кнопки Сохранить (save)
		if(!isDefined(state)){
			state = true;
		}

		// Скрыть/показать кнопку Сохранить
		if(state){
			this.hideButton('save');
		}else{
			this.showButton('save');
		}

		// Блокировка полей
		if(!state){
			this.enableFields();
		}
		if(state && disableFields) {
			this.disableFields();
		}

		this.readOnly = state;
	},
	unsetReadOnly: function(){
		// Отмена режима "только на чтение" формы
		this.setReadOnly(false);
	},
	disableFields: function(){
		// Заблокировать все поля от изменений
		this.form.disableFields();
	},
	enableFields: function(){
		// Разблокировать все поля
		this.form.enableFields();
	},
	getFields: function(){
		// Получение всех полей формы
		if(!this.rendered){
			return;
		}

		this.fields = this.getCmps({isFormField:true});

		return this.fields;
	},
	getField: function(nameOrQuery){
		// получение объекта поля по его имени или запросу
		return this.form.findField(nameOrQuery);
	},
	getFieldV: function(nameOrQuery, path){
		// получение значения поля: nameOrQuery - имя или запрос для поиска поля, path - путь внутри значения поля
		return this.form.getFieldV(nameOrQuery, path);
	},
	getData: function(){
		// Получение данных формы в виде объекта JSON
		// Плагинизация для дополнения данных сверх автоматически формируемого формой
		// В prepareData() надо работать с this.data через this.data.set()/get() и т.п.
		this.prepareData();
		this.fireEvent('getdata', this);

		return this.form.getData();
	},
	setData: function(data){
		// Применение данных к полям формы

		// Плагинизация установки данных до применения к форме
		this.beforeSetData(data);
		this.fireEvent('beforesetdata', this);

		// Применение данных к форме
		this.form.setData(data);
		this.data = this.form.data;
		
		// Плагинизация установки данных после применения к форме
		this.onSetData();
		this.fireEvent('setdata', this);
	},
	onChange: function(fld) {
		// На изменение значений полей
		if(this.silentFields){
			return;
		}

		// Плагинизация изменения значения полей для потомков
		this.onFieldChange(fld);
		this.fireEvent('change', fld, this);
	},
	submit: function(){
		// Сохранение данных формы:
		// - возвращение текущего объекта данных в коллбэк функцию, если она есть (this.callback)
		// - событие и кастомизация сохранения в this.on('submit') / this.onSubmit()

		// Базовая валиадция формы
		if(this.autoValidate && !this.validate()){
			return;
		}

		// Если в модуле-расширении описан beforeSave, вызываем его.
		// Возврат FALSE приостановит процесс
		if(this.beforeSave && isFunction(this.beforeSave)) {
			if(this.beforeSave() === false) {
				return;
			}
		}

		// Возврат данных, если есть функция callback
		if(this.callback && isFunction(this.callback)){
			this.callback.call(this.scope || this, this.getData(), this);
		}

		// Закрыть окно
		if(this.closeOnSubmit) {
			this.close();
		}

		this.onSubmit();
		this.fireEvent('submit', this);
	},
	validate: function(silent){
		// Валидация полей формы
		// Реализовано без использования this.form для работы с вкладками
		if(isEmpty(this.fields)){
			return true;
		}

		// Убрать прошлое состояние валидности
		this.clearInvalid();

		// Валидируем поля
		var valid = true;
		var invalidTabs = [];
		R.each(this.fields, function(fld){
			if(fld.validate && !fld.validate()){
				valid = false;

				// Получение кодов вкладок, на которых есть невалидные поля
				var tabCode = this.getFieldTab(fld);
				if(tabCode && !inArray(tabCode, invalidTabs)){
					invalidTabs.push(tabCode);
				}
			}
		}, this);

		// Отмечаем невалидные вкладки
		if(!isEmpty(invalidTabs)){
			R.each(invalidTabs, function(tabCode){
				var tab = this.tabPanel.getTab(tabCode);
				if(tab && !tab.hasClass('invalid')) {
					tab.addClass('invalid');
				}
			}, this);
		}

		if(!valid && !silent){
			R.Msg.alert(this.invalidText);
		}

		return valid;
	},
	isValid: function(){
		// алиас к validate() - тут нет необходимости в разделении валидации и реакции на инвалидность формы
		return this.validate();
	},
	clearInvalid: function() {
		// Убрать отметки об ошибках со всех полей и вкладок формы
		if(isEmpty(this.fields)){
			return;
		}

		R.each(this.fields, function(fld){
			if(fld.clearInvalid){
				fld.clearInvalid();
				
				var tabCode = this.getFieldTab(fld);
				if(tabCode){
					this.tabPanel.getTab(tabCode).removeClass('invalid');
				}
			}
		}, this);
	},
	getFieldTab: function(fld){
		// Получить вкладку (код) на которой расположено поле
		if(!this.tabPanel || !fld || !fld.parent){
			return;
		}

		var tabCode = null;

		R.each(this.tabs, function(tab){
			var code = R.xp(tab, 'code');
			var cardEl = this.cards.getItem(code);
			if(cardEl){
				var fldEl = cardEl.query('#' + fld.id);

				if(fldEl){
					tabCode = code;
				}
			}
		}, this);

		return tabCode;
	},
	setMinHeightByTabs: function(){
		// При наличии вкладок установить минимальную высоту равную максимальной вкладке
		if(!this.cards || !this.tabs || isEmpty(this.tabs) || this.isFullScreen){
			return;
		}
		
		var selected = R.xp(this.tabPanel, 'selected');
		var sizeEl = this.form.getEl();
		var max = sizeEl.getHeight();

		R.each(this.tabs, function(tab){
			var tabCode = R.xp(tab, 'code');
			this.cards.setActiveItem(tabCode);
			var h = sizeEl.getHeight();
			if(h > max){
				max = h;
			}
		}, this);

		sizeEl.setStyle('min-height', max + 'px')
		this.cards.setActiveItem(selected);
	}
});