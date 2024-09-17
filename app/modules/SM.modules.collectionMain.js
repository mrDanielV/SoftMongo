// Основной модуль коллекции: окружение, управление разделами работы с коллекцией
SM.modules.collectionMain = {
	initmarkup: {
		cls: 'sm_collection_main',
		cn: []
	},
	menu: [
		{code: 'view', name: SM.lang('collectionMain.menu.view', 'Просмотр записей'), module: 'view'},
		{code: 'insert', name: SM.lang('collectionMain.menu.insert', 'Добавить запись')},
		{code: 'indexes', name: SM.lang('collectionMain.menu.indexes', 'Индексы'), module: 'indexes'},
		{code: 'aggregate', name: SM.lang('collectionMain.menu.aggregate', 'Агрегация'), module: 'aggregate'},
		{code: 'import', name: SM.lang('collectionMain.menu.import', 'Импорт')},
		{code: 'export', name: SM.lang('collectionMain.menu.export', 'Экспорт')},
		{code: 'clear', name: SM.lang('collectionMain.menu.clear', 'Очистить коллекцию')},
		{code: 'drop', name: SM.lang('collectionMain.menu.drop', 'Удалить коллекцию')}
	],
	init: function(code){
		this.markup = R.clone(this.initmarkup);
		SM.data.collection = code;

		this.render();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(SM, 'view.items.right');
		if(!this.body){
			return;
		}

		// Заголовок
		this.markup.cn.push({cls: 'sm_m_title', cn: SM.lang('collectionMain.collection', 'Коллекция') + ': ' + SM.data.collection});

		// Меню
		var menuMarkup = {
			cls: 'sm_collection_main_menu', cn: []
		};
		R.each(this.menu, function(item){
			var m = {cls: 'sm_col_menu_item', ref:item.code, cn:[], data: {menu: item}};
			m.cn.push({cls: 'sm_col_menu_item_name', cn: item.name});

			menuMarkup.cn.push(m); 
		}, this);
		this.markup.cn.push(menuMarkup);


		// Область для модулей меню
		var mainMarkup = {cls: 'sm_collection_main_content', ref: 'content'};
		this.markup.cn.push(mainMarkup);

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		// Вешаем прослушивание кликов
		this.setLinks();

		// Установка текущего модуля - просмотр/запросы
		this.setModule('view');
	},
	setLinks: function(){
		// события на элементы
		R.each(this.items, function(el, code){
			var itemData = el.data();

			// Элементы меню
			var menuItem = R.xp(itemData, 'menu');
			if(menuItem){
				el.on('click', function(){
					// Вызов модуля пункта меню
					if(R.xp(menuItem, 'module')){
						this.setModule(menuItem.code);
					}
					// Вызов действий на нажатие
					else{
						this.onAction(menuItem.code);
					}
				}, this);
			}
		}, this);
	},
	setCurrent: function(code){
		// установка (CSS) текущего раздела
		if(!code || !this.items) return;
		var menuItem = findIn(this.menu, 'code', code);
		if(!menuItem) return;

		var menuEl = R.xp(this.items, menuItem.code);
		if(!menuEl) return;

		if(this.current){
			var prevEl = R.xp(this.items, this.current);
			if(prevEl){
				prevEl.removeClass('sm_menu_current');
			}
		}

		this.current = code;
		menuEl.addClass('sm_menu_current');
	},
	setModule: function(code){
		// Установка модуля
		var menuItem = findIn(this.menu, 'code', code);
		var content = R.xp(this.items, 'content');
		if(!content || !R.xp(menuItem, 'module') || !SM.modules.collection[menuItem.module]){
			return;
		}

		content.setHtml('');
		SM.modules.collection[menuItem.module].init(this);

		this.setCurrent(menuItem.code);
	},
	onAction: function(code){
		// обработка "действий" меню
		if(code == 'insert'){
			SM.modules.collection.upsert.init();
		}
		else if(code == 'import'){
			this.onImport();
		}
		else if(code == 'export'){
			this.onExport();
		}
		else if(code == 'clear'){
			this.onClear();
		}
		else if(code == 'drop'){
			this.onDrop();
		}
	},
	onImport: function(){
		// Импорт записей
		SM.modules.import.init();
	},
	onExport: function(){
		// Вызов модуля экспорта с передачей текущей коллекции и запроса
		var data = {
			collection: SM.data.collection,
			query: SM.modules.collection.view.getCurrentQuery(true)
		};

		SM.modules.export.init(data);
	},
	onClear: function(){
		// удаление всех записей коллекции - конфирм
		R.Msg.ask(SM.lang('collectionMain.alerts.001', 'Удалить все записи в коллекции?'), function(){
			var msg = '<b style="color:red">'+ SM.lang('collectionMain.alerts.002', 'ВСЕ ЗАПИСИ в коллекции БУДУТ УДАЛЕНЫ?') + '</b>';
			msg+= '<br>' + SM.lang('collectionMain.alerts.003', 'Вы уверены, что желаете именно этого?');
			R.Msg.ask(msg, this.clear, this);
		}, this);
	},
	clear: function(){
		// удаление всех записей коллекции
		request = {
			dbase: SM.data.dbase,
			collection: SM.data.collection,
			type: {code: 'remove'},
			query: []
		};

		SM.modules.collection.view.querySend(request, this.afterClear, this);
	},
	afterClear: function(){
		SM.modules.collection.view.clear();
		SM.modules.dbase.updateCollectionsList();
	},
	onDrop: function(){
		// удаление коллекции - конфирм
		R.Msg.ask(SM.lang('collectionMain.alerts.004', 'Удалить коллекцию?'), function(){
			var msg = '<b style="color:red">' + SM.lang('collectionMain.alerts.005', 'КОЛЛЕКЦИЯ {0} БУДЕТ УДАЛЕНА?') + '</b>';
			msg = msg.format(SM.data.collection);
			msg+= '<br>' + SM.lang('collectionMain.alerts.003', 'Вы уверены, что желаете именно этого?');

			R.Msg.ask(msg, this.drop, this);
		}, this);
	},
	drop: function(){
		// Удаление коллекции
		SM.request('dropCollection', {}, function(r){
			var msg = SM.lang('collectionMain.alerts.006', 'Коллекция <b>{0}</b> удалена...');
			msg = msg.format(SM.data.collection);

			R.Notices.alert(msg);
			SM.modules.dbase.init(SM.data.dbase);
		}, this);
	}
};
