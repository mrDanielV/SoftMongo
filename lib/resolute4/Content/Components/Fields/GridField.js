/**
	Resolute.Forms.GridField
	Поле отображения таблицы данных и работы с записями таблицы

	Основные опции конфигурации поля
		title: 'Заголовок поля' - строка, применяется независимо от label поля
		mode: 'grid' / 'list' - режим работы грида, по умолчанию = 'grid'
		laconic: true/false - включение лаконичной визуализации меню действий, по умолчанию = false
		height: 180 - высота ТАБЛИЦЫ поля в px. Общая высота всего поля не конфигурируется, по умолчанию = 180. Если задано null - принимает высоту по количеству записей.
		buttons: [] - массив кнопок управления записями таблицы, по умолчанию = полному набору предустановленных кнопок
		addButtons: [] - массив дополнительных (к предустановленным) кнопок
		dblClick: 'edit' - код кнопки действия на двойной клик по строке таблицы, по умолчанию = 'edit' (редактировать запись)
		data: [] - массив данных, заполняющих таблицу, опция доступна только для режима работы "список" (mode = 'list')
		columns: [] - массив, описывающий конфигурацию колонок
		module: 'code', - модуль редактирования записи, где code = Коду модуля Resolute.module[code] системы
		metaform: {}/[], - объект метаформы ({title: '', items: []}) или массив элементов items метаформы
		cfg: {}, – свободный объект параметров, передаваемый в модуль редактирования записи
		deleteConfirm: 'Удалить запись?' - текст диалогового окна подтверждения удаления записи, если задано пустое значение, удаление происходит без подтверждения
		selectable: true/false - выделение строки таблицы при клике на неё, по умолчанию = true
		sortBy: null/{} - сортировка записей таблицы, по умолчанию отключена (используется сортировка по индексу добавления записи), формат определения сотировки: {path: 1/-1, ...}
		maxCount: 5 - максимально допустимое количество записей в таблице, по умолчанию отключено
		maxError: '' - сообщение об ошибке при достижении максимально допустимого количества записей
		unique: true|false/'path'/['path1', 'path2', ...] - конфигурация контроля уникальности значения в таблице
		uniqueError: '' - сообщение об ошибке контроля уникальности значений в таблице, по умолчанию = "Дублирование записей недопустимо". 
		uniqueAddError: '' - сообщение об ошибке контроля уникальности значений в таблице при попытке сохранения ошибочной записи, если не задано отдельно от uniqueError, используется uniqueError

	Режимы работы поля (mode)
		Предусмотрено два режима, которые определяют поведение таблицы и формат возвращаемого полем значения:
		- grid		Таблица, режим по умолчанию, предполагает значение поля = массиву объектов. 
					При наличии возможности редактирования записей, должен обладать формой создания/изменения записи строки (см. ниже)
		- list		Выбор из списка. Предполагает наличие параметра data (массив объектов строк для выбора),
					Значение в этом случае = объекту выбранной строки. Не может иметь форму создания/изменения записи.

	Кнопки/Меню управления гридом
		Управление гридом может быть организованно кнопками на панели под заголовком (мо умолчанию) 
			или через меню действий, вызываемым кликом по иконке "..."
		По умолчанию грид имеет набор кнопок defaultButtons
		Чтобы отключить наличие действий совсем, нужно определить buttons = null / false / []
		Чтобы разместить действия в меню, нужно определить параметр laconic = true

		К набору действий по-умолчанию можно добавить кастомные действия, указав их в массиве addButtons
		В этом случае для обработки действия, для экземпляра компонента нужно назначить обработчик события "buttonclick"
			var GridField = new Resolute.Forms.GridField({...});
			GridField.on('buttonclick', function(cmp, btnCode){console.log('Click on ' + btnCode)});

		Формат описания действия (кнопки):
			{
				code: '',	// код действия
				name: '',	// Метка кнопки/пункта меню
				icon: '',	// код иконки material-icons
				row: true/false,	// действие доступно только при наличии выделенной строки 
				tooltip: ''			// всплывающая подсказка к действию
			}

		Доступна короткая форма перечисления набора кнопок (только из списка, доступных по умолчанию):
			buttons: ['add', 'edit', ...]

		Все действия, доступные по умолчанию (defaultButtons) обрабатываются в классе Resolute.Forms.GridField

		ВНИМАНИЕ! Кнопки вверх/вниз недоступны, если назначена сортировка грида (this.sortBy)

	Форма редактирования записи
		GridField поддерживает два варианта определения формы редактирования записи:
		1. module: 'code', - где code = Коду модуля Resolute.module[code] системы
		2. metaform: {}/[], - объект метаформы ({title: '', items: []}) или массив элементов items метаформы

		Пример конфигурации с использованием модуля системы
			{
				rtype: 'gridfield',
				title: 'Заголовок',
				name: 'content.list',
				columns: [
					'number',
					{name:'Наименование', path:'name', renderer:['blueTextBold'], width:250},
					{name:'Стоимость', path:'cost', renderer: {code:'money', params:{currency:'RUB'}}, width:180}
				],
				buttons: ['add', 'delete', 'edit'],
				height: 200,
				module: 'editItem',
				allowBlank: false
			}

		Пример с использованием метаформы
			{
				rtype: 'gridfield',
				title: 'Заголовок',
				name: 'content.laconic',
				buttons: ['add', 'delete', 'edit', 'copy'],
				columns: [
					'number',
					{name:'Наименование', path:'name', renderer:['blueTextBold'], width:250},
					{name:'Стоимость', path:'cost', renderer: {code:'money', params:{currency:'RUB'}}, width:180}
				],
				metaform: {
					title: 'Единица товара',
					items: [
						{
							rtype: 'textfield',
							label: 'Наименование',
							name: 'name',
							minLength: 8,
							maxLength: 8,
							mandatory: true
						},{
							rtype: 'numberfield',
							label: 'Стоимость',
							name: 'cost',
							type: 'money',
							allowBlank: false
						}
					]
				}
			}

		События формы, если она задана метаформой:
			Поддерживаются следующие события для окна метаформы:
			onWinPrepare - до отрисовки окна,
			onWinRender - после отрисовки окна,
			onWinFieldChange - на изменение поля формы окна, принимает аргумент = компоненту поля,
			onWinPrepareData - на сбор данных с формы,
			onWinBeforeSave - перед сохранением, при возврате FALSE процесс "сохранения" (применения данных к полю GridField) прекращается,

		Пример использования функций-событий окна:
			var gridF = <компонент поля GridField>;
			gridF.onWinRender = function(){console.log('onWinRender', this)};
			gridF.onWinFieldChange = function(fld){console.log('onWinFieldChange', fld, this)};
			gridF.onWinBeforeSave = function(){
				console.log('onWinBeforeSave', this);
				return true;
			};

			this - для всех функций-событий  - экземпляр окна
			this.parent - компонент поля GridField (gridF)

	Конфигурация колонок
		Формат объекта, описывающего колонку:
			'number', // Колонка с нумератором строк
			{ 
				name: 'Заголовок',
				path: 'путь в объекте данных',
				renderer: '' / ['', '', {}, ...] - строка или массив рендереров
				width: 100 - ширина колонки в px
			}

		Рендереры
			каждый (или единственный) рендерер может быть строкой (код рендерера) или объектом вида:
			{ code: 'код рендерера', params: { param1: 'v1', param2: 'v2', ... } }

			см. Content/Components/Grid/Renderers.js
			Полный список доступных рендереров: Resolute.Grid.renderers.getList()
	
	Основные сервисные функции
		setButtons(buttons) - установка и прорисовка кнопок, buttons - массив объектов конфигурации кнопок
		getButton(code) - получение инициированного объекта компонента кнопки по коду кнопки
		hideButton(code) / showButton(code) - показать/скрыть кнопку по её коду
		disableButton(code) / enableButton(code) - доступность кнопки по её коду
		hideButtons() / showButtons() - показать/скрыть все кнопки
		getData() / setData() - получить / установить данные грида целиком
		updateRow(value) - обновить запись, value - объект записи, идентификация записи осуществляется по CODE в объекте записи
		deleteRow(value) - удалить строку таблицы, value - объект записи, идентификация записи осуществляется по CODE в объекте записи 
	
	CSS Стили элемента описаны в resolute4-form-gridfield.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.GridField = Resolute.extend(Resolute.Forms.Field, {
	title: '',
	mode: 'grid', // grid/list - Режим работы поля, определяет тип данных this.value: grid - массив строк, list - объект выбранной строки
	laconic: false,
	height: 180,
	defaultButtons: [
		{code: 'add', name: 'Добавить', icon: 'add_circle_outline'},
		{code: 'edit', name: 'Изменить', icon: 'edit', row: true},
		{code: 'copy', name: 'Копировать', icon: 'content_copy', row: true},
		{code: 'delete', name: 'Удалить', icon: 'remove_circle_outline', row: true},
		{code: 'up', name: {cls: 'material-icons size-13', cn: 'arrow_upward'}, row: true, tooltip: 'Переместить запись выше'},
		{code: 'down', name: {cls: 'material-icons size-13', cn: 'arrow_downward'}, row: true, tooltip: 'Переместить запись ниже'}
	],
	addButtons: [],
	dblClick: 'edit',
	data: [],
	columns: ['number'],
	deleteConfirm: 'Удалить запись?',
	selectable: true,
	sortBy: null,
	maxCount: null,
	maxError: '',
	unique: null, // true/'path'/['path1', 'path2', ...] - параметры контроля уникальности записей
	uniqueError: '',
	uniqueAddError: '',
	errors: {
		maxCount: 'Максимально допустимое количество записей: {0}',
		unique: 'Дублирование записей недопустимо'
	},
	onWinPrepare: R.emptyFn,
	onWinRender: R.emptyFn,
	onWinFieldChange: R.emptyFn,
	onWinPrepareData: R.emptyFn,
	onWinBeforeSave: R.emptyFn,
	initComponent: function(){
		// Совмещение ошибок
		this.errors = R.apply(Resolute.Forms.NumberField.superclass.errors, this.errors);
		this.errors.maxCount = this.maxError || this.errors.maxCount;
		this.errors.unique = this.uniqueError || this.errors.unique;

		// Инициализация событий
		this.addEvents(
			'click',
			'change',
			'buttonclick',
			'edit',
			'delete',
			'copy',
			'move'
		);

		// Подготовка кнопок
		this.prepareButtons();

		// Конфигурация грида
		var gridCfg = {
			rtype:'grid',
			ref: 'grid',
			data: this.data,
			columns: this.columns || [],
			unselectable: !this.selectable,
			height: this.height
		};
		if(this.sortBy) {
			gridCfg.sortBy = this.sortBy;
		}

		// используемый шаблон поля
		this.markup = { cls: 'r-gridfield', ref: 'main',
			cn: [
				{cls: 'fgrid-top', ref: 'top', cn: [
					{cn: 'more_horiz', cls: 'material-icons actions-menu', ref: 'actionsmenu'},
					{cn: this.title || '', ref: 'title', cls: 'fgrid-title'}
				]},
				{
					cls: 'fgrid-panel',
					ref: 'panel',
					cn: 'panel'
				},
				{cls: 'fgrid-gridcnt', ref: 'gridcnt', cn: [ gridCfg ]}
			]
		};
		this.cls += ' gridfield';

		if(this.laconic) {
			this.cls += ' laconic';			
		}

		// Подавляем this.height - этот параметр уже был отнесён к высоте грида
		this.height = null;

		// Текст конфирма удаления записи должен быть строкой
		if(this.deleteConfirm && !isString(this.deleteConfirm)) {
			this.deleteConfirm = 'Удалить запись?';
		}

		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.GridField.superclass.initComponent.call(this);
	},
	onRender: function(){
		// Получение компонента грида
		this.grid = R.xp(this.components, 'grid');
		this.setGridListeners();

		// Родительский Рендер - важно вызвать после получения this.grid
		Resolute.Forms.GridField.superclass.onRender.call(this);

		// Отрисовка кнопок
		this.setButtons(this.btns);

		// Меню действий
		this.setActionsMenu();
	},
	setGridListeners: function(){
		// Прослушивание событий грида
		if(!this.grid) {
			return;
		}

		this.grid.on('select', this.onRowSelect, this);
		this.grid.on('unselect', this.onRowUnselect, this);
		this.grid.on('render', this.syncButtons, this);
		this.grid.on('rowdblclick', this.onGridDblClick, this);
	},
	onRowSelect: function(){
		// На выделение строки грида
		this.syncButtons();

		// Событие CHANGE поля для mode = 'list'
		if(this.mode == 'list'){
			this.fireEvent('change', this, this.getValue());
		}
	},
	onRowUnselect: function(){
		// На снятие выделения строки грида
		this.syncButtons();

		// Событие CHANGE поля для mode = 'list'
		if(this.mode == 'list'){
			this.fireEvent('change', this, this.getValue());
		}
	},
	onGridDblClick: function(grid, rowIndex){
		// Вызов действия, назначенный на двойное нажатие на строку грида
		// По умолчанию это изменение записи
		if(!this.dblClick) {
			return;
		}

		var action = findIn(this.buttons, 'code', this.dblClick);
		if(action) {
			this.onAction(action.code, rowIndex);
		}
	},
	prepareButtons: function(){
		// подготовка кнопок: применение defaultButtons, если не определены пользовательские,
		// разбор заданного this.buttons, если его элементы заданы кодами
		// добавление addButtons, если они есть, 
		// гашение this.buttons для Resolute.Forms.Field
		if(!isDefined(this.buttons)) {
			this.buttons = this.defaultButtons;
		}

		// разбор заданного this.buttons, если его элементы заданы кодами
		R.each(this.buttons, function(btn, i){
			if(isString(btn)) {
				var defbnt = findIn(this.defaultButtons, 'code', btn);
				if(defbnt) {
					this.buttons[i] = defbnt;
				}
			}
		}, this);

		// Добавление кнопок к набору по умолчанию
		if(!isEmpty(this.addButtons)) {
			R.each(this.addButtons, function(btn){
				if(btn.code && !findIn(this.buttons, 'code', btn.code)) {
					this.buttons.push(btn);
				}
			}, this);
		}

		// Гашение this.buttons для Resolute.Forms.Field
		this.btns = R.clone(this.buttons);
		this.buttons = null;
	},
	setButtons: function(buttons) {
		// Отрисовка кнопок по конфигу-массиву [{code, name, icon}]
		if(!isDefined(buttons)) {
			buttons = this.buttons;
		}
		this.buttons = buttons;

		var panel = R.xp(this.elements, 'panel');
		if(!panel) {
			return;
		}

		panel.show();
		panel.setHtml('');

		if(isEmpty(buttons)) {
			panel.hide();

			// Скрыть блок заголовка, если нет заголовка и кнопок
			if(!this.title) {
				this.getEl('top').hide();
			}

			return;
		}

		// Отрисовка кнопок
		var btns = {cls: 'buttons-panel flex', cn: [], ref: 'toppanel'};
		R.each(buttons, function(btn){
			var b = {
				rtype: 'button',
				label: btn.name,
				ref: 'buttons.' + btn.code,
				code: btn.code,
				icon: btn.icon,
				tooltip: btn.tooltip
			};

			btns.cn.push(b);
		}, this);

		var tmp = R.render(btns, panel);

		// Сохраняем панель и кнопки в элементы и компоненты GridField
		this.elements = R.apply(this.elements, tmp.refs);
		this.components = R.apply(this.components, tmp.cmps);

		// Обработка кликов
		var btns = R.xp(this.components, 'buttons');
		R.each(btns, function(btn){
			if(btn.code) btn.on('click', function(){this.onAction(btn.code)}, this);
		}, this);

		// Логика видимости кнопок
		this.syncButtons();
	},
	syncButtons: function(){
		// логика поведения (доступности, видимости) кнопок от свойства row и т.п.
		var selected = this.grid.getSelection();

		R.each(this.buttons, function(btn){
			var code = R.xp(btn, 'code');
			var row = R.xp(btn, 'row');

			if(row) {
				if(selected) {
					this.showButton(code);
				}else {
					this.hideButton(code);
				}
			}

			// Кнопки вверх/вниз недоступны, если назначена сортировка грида (this.sortBy)
			if(this.sortBy && inArray(code, ['up', 'down'])) {
				this.hideButton(code);
			}
		}, this);
	},
	setActionsMenu: function(){
		// формирование всплывающего меню действий
		var menuEl = R.xp(this.elements, 'actionsmenu');
		if(!menuEl || isEmpty(this.buttons)) {
			return;
		}

		menuEl.on('click', function(){
			// Скрыть все существующие
			R.Pickers.hide();

			var menus = [];
			R.each(this.buttons, function(btn){
				if(btn.hidden || btn.disabled) {
					return;
				}

				var b = R.clone(btn);
				if(b.icon && !b.icon.has('mi-')) {
					b.icon = 'mi-' + b.icon;
				}

				menus.push(b);
			}, this);

			// Инициализация меню
			this.actionMenu = R.Pickers.show('Menu', {
				//propagationParentClick: true,
				alignTo: menuEl,
				//offsets: [12, -5],
				items: menus,
				callback: this.onActionMenu,
				scope:this
			});
		}, this);
	},
	onActionMenu: function(action) {
		// Нажатие на пункт всплывающего меню действий
		var code = R.xp(action, 'code');
		this.onAction(code);
	},
	onAction: function(code, rowIndex) {
		// Обработка стандартных действий (кнопок)
		if(!this.grid) {
			return;
		}

		// Валидация доступности кнопки
		var btn = findIn(this.buttons, 'code', code);
		if(!btn || btn.hidden || btn.disabled) {
			return;
		}

		// получим данные текущей строки грида
		var rec = this.grid.getSelection();
		if(!rec && isDefined(rowIndex)) {
			var row = this.grid.data.getByIndex(rowIndex);
			rec = this.grid.data.getData(R.xp(row, 'code'));
		}

		// наличие текущей строки для соотв. типов операций
		if(btn.row && !rec) {
			R.Msg.alert('Не указана строка для выполнения операции');
			return;
		}

		// Добавление/Изменение
		if(code == 'add' || code == 'edit') {
			this.onEdit(code, rec);
		}

		// Удаление
		if(code == 'delete') {
			this.onDelete(rec);
		}

		// Копирование
		if(code == 'copy') {
			this.onCopy(rec);
		}

		// Перемещение записи вверх/вниз
		if(code == 'up' || code == 'down') {
			this.onMove(code, rec);
		}

		// Событие на выполнение действия
		this.fireEvent('buttonclick', this, code, rec);
	},
	onEdit: function(action, row, params) {
		// Добавление/Изменение записи грида - вызов модуля или обработка метаформы
		if(!action || (!this.module && !this.metaform)) {
			return;
		}
		var copy = R.xp (params, 'copy');

		// При добавлении данные текущей строки обнуляем - они не нужны
		if(action == 'add' && !copy) {
			row = null;
		}

		// проверка на максимально допустимое количество записей
		if(action == 'add' && this.maxCount) {
			var value = this.getValue();
			if(isArray(value) && value.length >= this.maxCount) {
				var error = this.getErrorTmp('maxCount').format(this.maxCount);
				if(this.maxError) {
					error = this.maxError.format(value.length);
				}
				R.Msg.alert(error);
				return;
			}
		}

		this.win = null;
		if(this.win && this.win.close){
			this.win.close();
		}

		// Конфигурация модуля
		var winCfg = {
			data: row,
			closeOnSubmit: false,
			cfg: this.cfg || {},
			callback: this.updateRow,
			scope: this,
			readOnly: this.disabled,
			copy: copy,
			parent: this
		};

		// Вызов внешнего модуля
		if(this.module){
			Resolute.runModule(this.module, winCfg, false);
			return;
		}

		// Инициация модуля с заданной метаформой
		if(this.metaform && !isEmpty(this.metaform)){
			if(isArray(this.metaform)) {
				winCfg.metaform = {items: this.metaform};
			}else{
				var metaform = R.clone(this.metaform);
				var items = R.xp(metaform, 'items');
				delete metaform.items;
				winCfg = R.apply(winCfg, metaform);
				winCfg.metaform = {items: items};
			}
			
			// События окна
			if(!winCfg.onBeforePrepare) winCfg.onBeforePrepare = this.onWinPrepare;
			if(!winCfg.afterRender) winCfg.afterRender = this.onWinRender;
			if(!winCfg.prepareData) winCfg.prepareData = this.onWinPrepareData;
			
			this.win = new Resolute.FormWindow(winCfg);
		}

		// События окна со сложным вызовом/возвратом
		if(this.win) {
			var self = this;
			this.win.onFieldChange = function(fld){
				self.onWinFieldChange.call(this, fld);
			};
			this.win.beforeSave = function() {
				return self.onWinBeforeSave.call(this);
			};
		}
	},
	onDelete: function(row) {
		// Удаление, начало процедуры
		if(!row) {
			row = this.grid.getSelection();
			if(!row) return;
		}

		if(this.deleteConfirm) {
			R.Msg.ask(this.deleteConfirm, function() {this.deleteRow(row);}, this);
		}else{ 
			this.deleteRow(row);
		}
	},
	onCopy: function(row) {
		// Копирование строки
		if(!this.grid || !row) {
			return;
		}

		var value = R.clone(row);
		delete value.code;

		this.onEdit('add', value, {copy: true});
	},
	onMove: function(action, row) {
		// Перемещение записи вверх/вниз
		if(!action || !row || !this.grid || this.sortBy) {
			return;
		}

		var code = R.xp(row, 'code');
		var data = this.getData();

		var rowData = this.grid.data.findOne({code: code});
		var index = R.xp(rowData, '_rowIndex');
		if(!rowData || index === null) {
			return;
		}

		if(action == 'up' && index == 0) {
			return;
		}
		if(action == 'down' && index == (data.length - 1)) {
			return;
		}

		var newIndex = index - 1;
		if(action == 'down'){
			newIndex = index + 1;
		}

		var newData = R.clone(data);
		newData.splice(index, 1);
		newData.splice(newIndex, 0, row);

		this.setData(newData);
		this.grid.setSelection(code);

		this.fireEvent('move', this, row, action);
	},
	updateRow: function(value, win) {
		// обновление / добавление значения строки грида
		if(!this.grid || !value) {
			return;
		}
		var row = this.grid.getSelection();

		if(!this.uniqued(value)) {
			var msg = this.uniqueAddError;
			if(!msg){
				msg = this.uniqueError || this.getErrorTmp('unique');
			}
			R.Msg.alert(msg);
			return;
		}

		if(win && win.close) {
			win.close();
		}

		this.grid.data.save(value);
		this.grid.refresh();

		// События edit и copy
		this.fireEvent('edit', this, value);
		if(R.xp(win, 'copy')) {
			// Для copy передаются новое значение и то, с которого была сделана копия
			this.fireEvent('copy', this, value, row);
		}

		// Событие CHANGE поля для mode = 'grid' 
		this.fireEvent('change', this, value);

		this.validate();
	},
	deleteRow: function(value) {
		// Удаление, окончание процедуры
		if(!this.grid || !value) {
			return;
		}

		var code = R.xp(value, 'code');

		this.grid.data.remove({code: code});
		this.grid.refresh();

		this.fireEvent('delete', this, value);
		this.fireEvent('change', this, value);

		this.validate();
	},
	getButton: function(code) {
		// получение компонента кнопки
		return R.xp(this.components, 'buttons.' + code);
	},
	setButtonParam: function(code, param, value) {
		// установка параметра param = value для кнопки в this.buttons с кодом = code
		var bntI = findIn(this.buttons, 'code', code, 'index');
		if(bntI || bntI === 0) {
			this.buttons[bntI][param] = value;
		}
	},
	hideButton: function(code) {
		// скрыть кнопку
		var btn = this.getButton(code);
		if(btn) btn.hide();
		this.setButtonParam(code, 'hidden', true);
	},
	showButton: function(code) {
		// показать кнопку
		var btn = this.getButton(code);
		if(btn) btn.show();
		this.setButtonParam(code, 'hidden', false);
	},
	disableButton: function(code) {
		// недоспуность кнопки
		var btn = this.getButton(code);
		if(btn) btn.disable();
		this.setButtonParam(code, 'disabled', true);
	},
	enableButton: function(code) {
		// доступность кнопки
		var btn = this.getButton(code);
		if(btn) btn.enable();
		this.setButtonParam(code, 'disabled', false);
	},
	hideButtons: function(){
		// скрыть все кнопки
		this.getEl('panel').hide();
		this.getEl('actionsmenu').hide();
	},
	showButtons: function(){
		// показать все кнопки
		this.getEl('panel').show();
		this.getEl('actionsmenu').show();
	},
	setValue: function(v) {
		// установка значения
		// Если mode = 'grid', то v -> grid.data
		// Если mode = 'list', то v -> grid.selected
		Resolute.Forms.GridField.superclass.setValue.call(this, v);
		if(!this.grid) {
			return;
		}

		if(this.mode == 'grid') {
			this.setData(v);
		}
		else if (this.mode == 'list') {
			var code = R.xp(v, 'code');
			if(isScalar(v)) {
				code = v;
			}
			this.grid.setSelection(code);
		}
		
		this.onSetValue();
	},
	getValue: function() {
		// получение значения
		// Если mode = 'grid', то v = grid.data
		// Если mode = 'list', то v = grid.selected
		if(!this.grid) {
			return this.value;
		}

		if(this.mode == 'grid') {
			this.value = this.grid.getData();
		}
		else if (this.mode == 'list') {
			this.value = this.grid.getSelection();
		}

		return this.value;
	},
	getData: function() {
		// получение data грида
		if(!this.grid) {
			return [];
		}

		return this.grid.getData();
	},
	setData: function(data) {
		// назначение data грида
		if(!this.grid) {
			return;
		}

		return this.grid.setData(data);
	},
	isValid: function(){
		// Валидация значения поля. не воздействует на поле, только возвращает TRUE/FALSE
		// Служит составной частью для Resolute.Forms.Field.validate()
		if(this.hidden) return true;

		// Текущее значения поля
		var value = this.getValue();

		// Обязательность
		this.errorCode = null;
		if(!this.allowBlank && isEmpty(value)){
			this.errorCode = 'mandatory';
			return false;
		}

		// Максимальное количество записей
		if(this.maxCount && isArray(value) && value.length > this.maxCount) {
			this.errorCode = 'maxCount';
			if(this.maxError) {
				this.errorsList.maxCount = this.maxError.format(this.maxCount);
			}else{
				this.errorsList.maxCount = this.getErrorTmp(this.errorCode).format(this.maxCount);
			}
			return false;
		}

		// Уникальность значений
		if(!this.uniqued()) {
			this.errorCode = 'unique';
			this.errorsList.unique = this.getErrorTmp(this.errorCode);
			return false;
		}

		return true;
	},
	uniqued: function(value) {
		// проверка соблюдения уникальности внутри данных грида и уникальности значения value среди записей грида
		if(!this.unique || !this.grid) return true;

		// Данные грида
		var data = this.getData();
		if(isEmpty(data)) {
			return true;
		}

		// Поиск дубля для переданного value
		if(isDefined(value) && value && R.xp(value, 'code')) {
			// Формируем данные для запроса
			var code = R.xp(value, 'code');
			var query = R.clone(value);
			delete query.code;

			if(isString(this.unique)) {
				this.unique = [this.unique];
			}

			if(isArray(this.unique)) {
				query = {};
				R.each(this.unique, function(path){
					R.put(query, path, R.xp(value, path));
				}, this);
			}

			// Запрос-поиск дубля
			query['code'] = {'$ne': code};
			var double = this.grid.data.findOne(query);
			if(double) {
				return false;
			}
		}
		// Поиск дублей для каждой из записей грида
		else {
			var isDoubled = null;
			R.each(data, function(row){
				if(!this.uniqued(row)) {
					isDoubled = true;
				}
			}, this);

			if(isDoubled) {
				return false;
			}
		}

		return true;
	}
});
Resolute.reg('gridfield', Resolute.Forms.GridField);
