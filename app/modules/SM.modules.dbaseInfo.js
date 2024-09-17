// Модуль статистической информации о БД - список коллекций, занимаемая память и т.п.
SM.modules.dbaseInfo = {
	initmarkup: {
		cls: 'p-20',
		cn: [
			{cls: 'sm_m_title', cn: '{title}'},
			{cls: 'flex mb-15', cn: []},
			{cls: 'sm_dbaseInfo_pref', cn: []},
			{cls: 'sm_dbaseInfo_cols', cn: []}
		]
	},
	init: function(){
		this.analize();

		SM.modules.dbase.unsetCollection();

		this.markup = R.clone(this.initmarkup);
		this.render();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(SM, 'view.items.right');
		if(!this.body){
			return;
		}

		// Заголовок
		this.markup.cn[0].cn = SM.lang('dbaseInfo.title', 'БД') + ': ' + SM.data.dbase;

		// Меню
		this.markup.cn[1].cn = [
			{cls: 'sm_menu_item', ref: 'createCollection', cn:[
				{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/table_add.png'}},
				{cls: 'sm_menu_item_name', cn: SM.lang('dbaseInfo.menu.create', 'Создать новую коллекцию')}
			]},
			{cls: 'sm_menu_item', ref: 'import', cn:[
				{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/table_import.png'}},
				{cls: 'sm_menu_item_name', cn: SM.lang('dbaseInfo.menu.import', 'Импорт данных')}
			]},
			{cls: 'sm_menu_item', ref: 'export', cn:[
				{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/table_export.png'}},
				{cls: 'sm_menu_item_name', cn: SM.lang('dbaseInfo.menu.export', 'Экспорт данных')}
			]}
		];

		// Суммарная информация
		var summaryM = [
			{cls: 'sm_dbaseInfo_summary', cn: [
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.001', 'Размер БД на диске')},
					{cls: 'sm_dbaseInfo_summary_value', cn: SM.fn.sizeFormat(this.summary.size)}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.002', 'Количество коллекций')},
					{cls: 'sm_dbaseInfo_summary_value', cn: this.summary.ncol + ''}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.003', 'Количество объектов')},
					{cls: 'sm_dbaseInfo_summary_value', cn: this.summary.nobj + ''}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.004', 'Рамер данных')},
					{cls: 'sm_dbaseInfo_summary_value', cn: SM.fn.sizeFormat(this.summary.dataSize)}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.005', 'Размер на диске')},
					{cls: 'sm_dbaseInfo_summary_value', cn: SM.fn.sizeFormat(this.summary.storageSize)}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.006', 'Средний размер объекта')},
					{cls: 'sm_dbaseInfo_summary_value', cn: SM.fn.sizeFormat(this.summary.avgObjSize)}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.007', 'Количество индексов')},
					{cls: 'sm_dbaseInfo_summary_value', cn: this.summary.nindexes + ''}
				]},
				{cls: 'sm_dbaseInfo_summary_line', cn: [
					{cls: 'sm_dbaseInfo_summary_title', cn: SM.lang('dbaseInfo.summary.008', 'Размер индексов')},
					{cls: 'sm_dbaseInfo_summary_value', cn: SM.fn.sizeFormat(this.summary.indexesSize)}
				]}
			]}
		];
		this.markup.cn[2].cn = summaryM;

		// Таблица коллекций
		var colsMarkup = [
			{cls: 'sm_dbaseInfo_cols_th', cn: [
				{cls: 'sm_dbaseInfo_cols_td td1', cn: SM.lang('dbaseInfo.colsList.th.001', 'Коллекция')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.002', 'N записей')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.003', 'Размер данных')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.004', 'Размер на диске')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.005', 'Средний размер объекта')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.006', 'N индексов')},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.lang('dbaseInfo.colsList.th.007', 'Размер индексов')}
			]}
		];
		
		R.each(SM.data.collections, function(col){
			var ref = col.name.split('.').join('-');
			colsMarkup.push({cls: 'sm_dbaseInfo_cols_tr', cn: [
				{cls: 'sm_dbaseInfo_cols_td td1 sm_blue_textb href', cn: col.name, ref: ref, data: {collection: col.name}},
				{cls: 'sm_dbaseInfo_cols_td', cn: col.count+'' || '0'},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.fn.sizeFormat(col.size)},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.fn.sizeFormat(col.storageSize)},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.fn.sizeFormat(col.avgObjSize)},
				{cls: 'sm_dbaseInfo_cols_td', cn: col.nindexes+'' || '0'},
				{cls: 'sm_dbaseInfo_cols_td', cn: SM.fn.sizeFormat(col.totalIndexSize)}
			]});
		}, this);
		
		var cols = [
			{cls: 'sm_dbaseInfo_cols_show sm_blue_textb href', cn: SM.lang('dbaseInfo.colsList.expand', 'Список коллекций (показать)'), ref: 'colsList'},
			{cls: 'sm_dbaseInfo_cols_tbl', cn: colsMarkup, ref: 'table', st:'display: none;'},
		];
		this.markup.cn[3].cn = cols;

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		// Вешаем прослушивание кликов
		this.setLinks();
	},
	setLinks: function(){
		// вешаем клики: скрыть-показать список коллекций, выбор коллекции
		var container = R.xp(SM, 'view.items.right');
		if(!container){
			return;
		}

		R.each(this.items, function(el, code){
			if(code == 'colsList'){
				el.on('click', this.toggleList, this);
				return;
			}
			if(code == 'createCollection'){
				el.on('click', this.createCollectionWin, this);
				return;
			}
			if(code == 'import'){
				el.on('click', this.onImport, this);
				return;
			}
			if(code == 'export'){
				el.on('click', this.onExport, this);
				return;
			}
			if(inArray(code, ['table'])){
				return;	
			}

			var itemData = el.data();
			if(R.xp(itemData, 'collection')){
				el.on('click', function(){
					SM.modules.dbase.setCollection(itemData.collection);
				});
			}
		}, this);
	},
	analize: function(){
		// расчет суммарных величин по списку коллекций (статистика по коллекциям)
		this.summary = {
			ncol: 0,			// количество коллекций
			nobj: 0,			// количество объектов
			size: 0, 			// Размер БД
			dataSize: 0,		// Рамер данных
			nindexes: 0,		// Количество индексов
			avgObjSize: 0,		// Средний размер объекта
			storageSize: 0,		// Размер хранилища
			indexesSize: 0		// Размер индексов
		};

		R.each(SM.data.collections, function(col){
			this.summary.ncol++;
			this.summary.nobj+= R.xp(col, 'count', 0);
			this.summary.dataSize+= R.xp(col, 'size', 0);
			this.summary.nindexes+= R.xp(col, 'nindexes', 0);
			this.summary.storageSize+= R.xp(col, 'storageSize', 0);
			this.summary.indexesSize+= R.xp(col, 'totalIndexSize', 0);
		}, this);

		this.summary.avgObjSize = this.summary.dataSize / this.summary.nobj;

		var dbase = findIn(SM.data.dbases, 'name', SM.data.dbase);
		this.summary.size = R.xp(dbase, 'sizeOnDisk');
	},
	toggleList: function(){
		// скрыть/показать таблицу коллекций
		var tableEl = R.xp(this.items, 'table');
		var colsListEl = R.xp(this.items, 'colsList');
		

		if(R.xp(tableEl, 'dom.style.display') == 'none'){
			tableEl.show();
			colsListEl.setHtml(SM.lang('dbaseInfo.colsList.collaps', 'Список коллекций (скрыть)'));
		}else{
			tableEl.hide();
			colsListEl.setHtml(SM.lang('dbaseInfo.colsList.expand', 'Список коллекций (показать)'));
		}
	},
	createCollectionWin: function(){
		// Окно создания новой коллекции
		var parent = this;

		this.createWindow = new Resolute.Window({
			width: 480,
			title: SM.lang('collectionCreate.title', 'Создание новой коллекции'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:[
				{
					cls: 'form',
					cn: [
						{
							rtype: 'textfield',
							ref: 'name'
						}
					]
				}
			],
			buttons:[
				{code: 'create', name: SM.lang('create', 'Создать')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onButtonClick: function(btn) {
				var nameFld = R.xp(this.components, 'name');
				if(btn == 'create'){
					var data = {
						name: nameFld.getValue()
					};
					this.close();
					parent.createCollection(data);
				}
			}
		});
	},
	createCollection: function(data){
		// Создание коллекции
		SM.request('createCollection', {name: R.xp(data, 'name')}, function(r){
			var msg = SM.lang('collectionCreate.done', 'Коллекция <b>{0}</b> создана...');
			msg = msg.format(R.xp(data, 'name'));
			R.Notices.alert(msg);
			SM.modules.dbase.init(SM.data.dbase);
		}, this);
	},
	onImport: function(){
		// Импорт записей
		SM.modules.import.init();
	},
	onExport: function(){
		// Экспорт записей
		SM.modules.export.init();
	}
};
