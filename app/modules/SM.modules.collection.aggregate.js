// Модуль аггрегации по коллекции
SM.modules.collection.aggregate = {
	initmarkup: {
		cls: 'sm_collection_aggregate',
		cn: []
	},
	init: function(parent){
		this.markup = R.clone(this.initmarkup);
		this.parent = parent;

		this.pipeline = [];
		this.stages = [];

		this.limit = 10;
		this.skip = 0;

		this.render();
		this.renderList();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(this.parent, 'items.content');
		if(!this.body){
			return;
		}
		this.body.setHtml('');

		// Форма основная
		var formMarkup = this.getFormMarkup();
		this.markup.cn.push(formMarkup);

		// блок для элементов-этапов плана
		this.markup.cn.push({cls: 'sm_aggregate_list', ref: 'aggregate_list'});

		// блок для кнопки выполнить
		this.markup.cn.push({cls: 'sm_aggregate_actions', ref: 'aggregate_actions'});

		// блок для вывода результатов
		this.markup.cn.push({cls: 'sm_aggregate_pagesTop', ref: 'pagesTop'});
		this.markup.cn.push({cls: 'sm_aggregate_results', ref: 'aggregate_results'});
		this.markup.cn.push({cls: 'sm_aggregate_pagesBottom', ref: 'pagesBottom'});

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		// Вешаем прослушивания на элементы
		this.setLinks();
	},
	setLinks: function(){
		// Вешаем прослушивания на элементы
		R.each(this.items, function(el, code){
			var data = el.data();
			if(R.xp(data, 'btn')){
				el.on('click', function(){this.onBtnClick(data.btn)}, this);
			}
		}, this);
	},
	getFormMarkup: function(){
		// Размерка основной (верхней) формы
		var form = {
			cls: 'sm_form',
			cn: [
				{
					cls: '',
					cn: [
						{
							cls: 'sm_b_title',
							cn: SM.lang('aggregate.title', 'План агрегации (Pipeline)')
						},{
							cls: 'sm_form_btn blue',
							cn: SM.lang('aggregate.actions.001', 'Добавить этап'),
							st: 'margin-top: 10px;',
							ref: 'add',
							data: {btn: 'add'}
						},{
							cls: 'sm_form_line mt-10',
							cn: [
								{
									cls: 'sm_form_btn',
									cn: SM.lang('aggregate.actions.002', 'Сохранить план'),
									ref: 'save',
									data: {btn: 'save'}
								},{
									cls: 'sm_form_btn ml-10',
									cn: SM.lang('aggregate.actions.003', 'Загрузить план'),
									ref: 'load',
									data: {btn: 'load'}
								},{
									cls: 'sm_form_btn ml-10',
									cn: SM.lang('aggregate.actions.004', 'Представить в JSON'),
									ref: 'toJSON',
									data: {btn: 'toJSON'}
								},{
									cls: 'sm_form_btn ml-10',
									cn: SM.lang('aggregate.actions.005', 'Загрузить из JSON'),
									ref: 'fromJSON',
									data: {btn: 'fromJSON'}
								}
							]
						},{
							cls: 'flex',
							st: 'display:none',
							ref: 'fileCnt',
							cn: [
								{ rtype: 'fileinput', ref: 'file', exts: ['json'] }
							]
						}
					]
				}
			]
		}

		return form;
	},
	onBtnClick: function(btn){
		// обработка нажатия кнопок
		if(btn == 'add'){
			this.addForm();
		}
		else if(btn == 'save'){
			this.download();
		}
		else if(btn == 'load'){
			this.import();
		}
		else if(btn == 'toJSON'){
			this.viewAsJson();
		}
		else if(btn == 'fromJSON'){
			this.loadFromJson();
		}
	},
	renderList: function(){
		// Отрисовка списка этапов плана агрегации
		var cnt = R.xp(this.items, 'aggregate_list');
		if(!cnt){
			return;
		}

		// очистить родителя
		cnt.setHtml('');

		// Удалить старые объекты этапов
		R.each(this.stages, function(stage, i){
			delete this.stages[i];
		}, this);

		// Отрисовка этапов
		this.stages = [];
		R.each(this.pipeline, function(stage, i){
			stage.id = i;
			if(R.xp(stage, 'enable') === null){
				stage.enable = true;
			}

			var stageCmp = new SM.obj.aggStage(cnt, stage, this);
			this.stages.push(stageCmp);
		}, this);

		// Отрисовка кнопки выполнения
		this.renderActions();
	},
	renderActions: function(){
		// Отрисовка кнопок выполнения запроса агрегации и экспорта результатов
		var cnt = R.xp(this.items, 'aggregate_actions');
		if(!cnt){
			return;
		}

		// очистить родителя
		cnt.setHtml('');

		if(isEmpty(this.pipeline)){
			return;
		}

		// макет
		var markup = {
			cn: [
				{cls: 'flex', cn: [
					{cls: 'sm_menu_item mt-10', ref: 'run', cn: [
						{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/sum.png'}},
						{cls: 'sm_menu_item_name', cn: SM.lang('aggregate.actions.006', 'Выполнить план агрегации')}
					]},
					{cls: 'sm_menu_item mt-10', ref: 'export', cn: [
						{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/table_export.png'}},
						{cls: 'sm_menu_item_name', cn: SM.lang('aggregate.actions.007', 'Экспорт результатов')}
					]}
				]}
			]
		};
		
		// забросить макет в родителя
		var tmp = new Resolute.Markup.Template({markup: markup});
		tmp.apply(cnt, this.items);
		
		var run = R.xp(this.items, 'run');
		if(run){
			run.on('click', this.execute, this);
		}

		var exportBtn = R.xp(this.items, 'export');
		if(exportBtn){
			exportBtn.on('click', this.export, this);
			if(!this.results || isEmpty(this.results)){
				exportBtn.hide();
			}
		}
	},
	addForm: function(){
		// Вызов формы добавления этапа агрегации
		var parent = this;
		var descPath = 'desc.' + SMlang.code || 'ru';

		this.addWindow = new Resolute.Window({
			parent: parent,
			width: 520,
			title: SM.lang('aggregate.form.title', 'Добавление этапа агрегации'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						rtype: 'combobox',
						ref: 'type',
						listCls: 'sm-aggregate-list',
						label: SM.lang('aggregate.form.001', 'Укажите тип операнда для этапа агрегации'),
						clearIcon: null,
						listIcon: null,
						hideClear: true,
						listItemMarkup: '<b>{name}</b><br>{' + descPath + '}',
						textSearch: true,
						data: SM.aggTypes
					},{
						cls: 'mt-15 size-13',
						cn: '&nbsp',
						ref: 'desc'
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('aggregate.form.002', 'Добавить')},
				{code: 'close', name: SM.lang('aggregate.form.003', 'Отмена')}
			],
			onAfterRender: function(){
				var typeFld = R.xp(this.components, 'type');

				if(typeFld){
					typeFld.on('change', this.setDesc, this);
				}
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					var v = this.getType();
					if(!v){
						R.Msg.alert(SM.lang('aggregate.form.004', 'Не выбрано значения для добавления!'));
						return;
					}
					this.parent.addStage(v);
					this.close();
				}
			},
			getType: function(){
				var typeFld = R.xp(this.components, 'type');
				var type = typeFld.getValue();

				return type;
			},
			setDesc: function() {
				var typeFld = R.xp(this.components, 'type');
				var type = typeFld.getValue();
				var descPath = 'desc.' + SMlang.code || 'ru';
				var desc = R.xp(type, descPath);
				var name = R.xp(type, 'name');

				if(!desc){
					desc = '';
				}

				desc = desc + this.parent._getLinkByStageName(name);
	
				var descEl = R.xp(this.elements, 'desc');
				if(descEl){
					descEl.setHtml(desc);
				}
			}
		});
	},
	addStage: function(stage){
		// Добавление этапа к плану агрегации
		if(!stage){
			return;
		}

		this.pipeline.push(stage);
		this.renderList();
	},
	deleteStage: function(index, cmp){
		// удаление этапа агрегации из списка плана
		if(!isDefined(index)){
			return;
		}

		this.pipeline.splice(index, 1);

		this.renderList();
		this.renderActions();
		this.clearResults();
	},
	enableStage: function(index, enable){
		// Изменение активности этапа плана агрегации
		if(!isDefined(index)){
			return;
		}
		if(!isDefined(enable)){
			enable = true;
		}

		this.pipeline[index].enable = enable;
		this.clearResults();
	},
	updatePipeline: function(){
		// Сбор актуальной цепочки этапов агрегации - значения только активных этапов
		this.pipeline = [];
		if(isEmpty(this.stages)){
			return this.pipeline;
		}

		R.each(this.stages, function(stageCmp){
			var stage = stageCmp.getValue() || {};
			if(stage){
				this.pipeline.push(stage);
			}
		}, this);

		return this.pipeline;
	},
	getPipes: function(){
		// Получение актуальной цепочки этапов агрегации в конечном для выполнения формате
		this.updatePipeline();

		var pipes = [];
		R.each(this.pipeline, function(stage){
			if(R.xp(stage, 'enable') === false){
				return;
			}

			var name = R.xp(stage, 'name');
			var value = R.xp(stage, 'value');

			var pipe = {};
			pipe[name] = value;

			pipes.push(pipe);
		}, this);

		return pipes;
	},
	applyPipes: function(pipes){
		// Применение назначенного плана агрегации (загрузка из файла или из JSON)
		if(!isArray(pipes) || isEmpty(pipes)){
			R.Msg.alert(SM.lang('aggregate.alerts.001', 'Попытка применить пустой план агрегации бесславно провалилась...'));
			return;
		}

		var pipeline = [];
		R.each(pipes, function(pipe){
			if(!pipe || !isObject(pipe)){
				return;
			}

			R.each(pipe, function(value, operand){
				// поиск этапа агрегации в списке известных
				var stageItem = R.clone(findIn(SM.aggTypes, 'name', operand));

				// Фиксация этапа из числа известных
				if(stageItem){
					stageItem.value = value;
					pipeline.push(stageItem);
				}
				// Попытка создать неизвестный этап агрегации 
				else{
					var item = {
						name: operand,
						value: value
					};
					pipeline.push(item);
				}
			}, this)
		}, this);

		if(isEmpty(pipeline)){
			R.Msg.alert(SM.lang('aggregate.alerts.002', 'Не удалось сформировать план агрегации...'));
			return;
		}

		this.pipeline = pipeline;
		this.renderList();
	},
	validate: function() {
		// Валидация всех компонентов этапов (SM.obj.aggStage)
		if(isEmpty(this.stages)){
			return false;
		}

		var valid = true;
		R.each(this.stages, function(stageCmp){
			if(stageCmp && !stageCmp.validate()) {
				valid = false;
			}
		}, this);

		return valid;
	},
	execute: function(){
		// Отправка запроса агрегации на сервер
		if(!this.validate()) {
			return null;
		}
		var pipes = this.getPipes();

		if(isEmpty(pipes)){
			R.Msg.alert(SM.lang('aggregate.alerts.003', 'Нет плана агрегации, нечего выполнять'));
			return;
		}

		this.limit = 10;
		this.skip = 0;

		SM.request('aggregate', {pipeline:pipes}, function(r){
			this.results = r.data;
			if(!isArray(this.results)){
				this.results = [this.results];
			}

			if(isEmpty(this.results)){
				R.Msg.alert(SM.lang('aggregate.alerts.004', 'Операция выполнена!'));
			}

			this.setResults();
		}, this);
	},
	setResults: function(){
		// Вывод результатов запроса агрегации
		var cnt = R.xp(this.items, 'aggregate_results');
		if(!cnt){
			return;
		}

		// очистить родителя
		cnt.setHtml('');
		this.records = [];

		// Блоки для вывода страниц
		var exportBtn = R.xp(this.items, 'export');
		var pagesTop = R.xp(this.items, 'pagesTop');
		var pagesBottom = R.xp(this.items, 'pagesBottom');
		pagesTop.setHtml('');
		pagesBottom.setHtml('');

		// Если выводить нечего, на этом - всё
		if(!this.results || isEmpty(this.results)){
			if(exportBtn) exportBtn.hide();
			return;
		}

		// Экспорт
		if(exportBtn) exportBtn.show();

		// Страницы, верх
		var count = this.results.length;
		SM.modules.pages.init(pagesTop, this, {count: count, skip: this.skip, limit: this.limit});

		// Вывод записей
		var menu = [
			{code: 'edit', name: 'JSON'},
			{code: 'expand', name: SM.lang('aggregate.results.001', 'Развернуть!')},
		];
		var n = 0;
		R.each(this.results, function(record, i){
			// Логика страницы
			if(this.skip && i < this.skip){
				return;
			}
			
			n++;
			if(this.limit && n > this.limit){
				return;
			}
			
			var rec = new SM.obj.record(cnt, record, {menu:menu, contextmenu: false, mode: 'view'});
			this.records.push(rec);
		}, this);

		// Страницы, низ
		SM.modules.pages.init(pagesBottom, this, {count: count, skip: this.skip, limit: this.limit});

		// Чистка памяти
		R.garbageCollect();
	},
	query: function(){
		// алиас к setResults для работы страниц результатов
		this.setResults();
	},
	clearResults: function(){
		// сброс вывода результатов
		this.results = [];
		this.setResults();
	},
	download: function(){
		// Сохранение плана агрегации в файл
		if(!this.validate()) {
			return null;
		}
		var pipes = this.getPipes();

		if(isEmpty(pipes)){
			R.Msg.alert(SM.lang('aggregate.alerts.005', 'Нет плана агрегации, нечего сохранять'));
			return;
		}

		var data = {
			dbase: SM.data.dbase,
			collection: SM.data.collection,
			pipeline: pipes
		};
		var params = {
			operation: 'Opers.aggregateSave',
			data: R.encode(data)
		};

		Resolute.download('operations/', params);
	},
	import: function(){
		// Загрузка плана агрегации из файла - выбор файла
		var file = R.xp(this.cmps, 'file');

		file.on('change', this.load, this);

		file.onClick();
	},
	load: function(){
		// Загрузка плана агрегации из файла - запрос на сервер
		var file = R.xp(this.cmps, 'file');

		if(!file.validate()){
			R.Msg.alert(file.invalidText);
			return;
		}

		var params = {
			operation: 'Opers.aggregateLoad',
			file: file.getFile()
		};

		// Отправляем на сервер
		var w = R.Msg.wait(SM.lang('aggregate.alerts.006', 'Импорт плана агрегации...'));
		R.request({
			url: 'operations/',
			params: params,
			onSuccess: function(r){
				this.applyPipes(r.data);
				w.close();
			},
			onFailure: function(r){
				w.close();
				R.Msg.alert(R.xp(r, 'msg', 'Error...'));
			},
			scope: this
		});
	},
	viewAsJson: function(){
		// Показать текущий план агрегации в виде JSON
		if(!this.validate()) {
			return null;
		}
		var pipes = this.getPipes();

		if(isEmpty(pipes)){
			R.Msg.alert(SM.lang('aggregate.alerts.007', 'Нет плана агрегации, нечего представлять'));
			return;
		}

		SM.modules.view.init(pipes, {title: SM.lang('aggregate.title', 'План агрегации')});
	},
	loadFromJson: function(){
		// Показать окно загрузки плана агрегации из JSON
		SM.modules.view.init([{}], {
			title: SM.lang('aggregate.title', 'План агрегации'),
			action: SM.lang('aggregate.actions.008', 'Применить')
		}, this.setFromJson, this);
	},
	setFromJson: function(data){
		// Установить план агрегации из JSON
		this.applyPipes(data);
	},
	export: function(){
		// Экспорт результатов агрегации
		if(!this.results || isEmpty(this.results)){
			R.Msg.alert(SM.lang('aggregate.alerts.008', 'Нет результатов агрегации, нечего экспортировать'));
			return;
		}
		if(!this.validate()) {
			return null;
		}

		var pipes = this.getPipes();
		

		var data = {
			mode: {code: 'aggregate'},
			dbase: SM.data.dbase,
			collection: SM.data.collection,
			pipeline: pipes
		};

		var params = {
			operation: 'Export.get',
			data: R.encode(data)
		};

		Resolute.download('operations/', params);
	},
	_getLinkByStageName: function(name, mode){
		if(!name){
			return '';
		}

		var nameC = name.split('$').join('');
		var url = 'https://www.mongodb.com/docs/manual/reference/operator/aggregation/' + nameC;

		if(mode == 'url'){
			return url;
		}

		var label = SM.lang('aggregate.form.005', 'Полное описание операнда');
		var link = '<br><br><a href="' + url + '" target="_blank">' + label + '</a>';
		return link;
	}
};
