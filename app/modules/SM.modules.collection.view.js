// Модуль просмотра и запросов по коллекции
SM.modules.collection.view = {
	initmarkup: {
		cls: 'sm_collection_view',
		cn: []
	},
	init: function(parent){
		this.markup = R.clone(this.initmarkup);
		this.parent = parent;

		this.skip = 0;
		this.limit = 10;

		this.render();
		this.getPathes();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(this.parent, 'items.content');
		if(!this.body){
			return;
		}

		// Форма
		var formMarkup = this.getFormMarkup();
		this.markup.cn.push(formMarkup);

		// Область вывода результата
		this.markup.cn.push({cls: 'sm_records_main', cn: [
			{cls: 'sm_records_pages', cn: '', ref: 'pagesTop'},
			{cls: 'sm_records', cn: '', ref: 'records'},
			{cls: 'sm_records_pages', cn: '', ref: 'pagesBottom'}
		]});

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		// Вешаем прослушивание кликов
		this.setLinks();

		// Логика формы
		this.syncByType();

		// Инициация блоков сортировки и полей
		this.setSort(null, true);
		this.setFields(null, true);

		// Выполнение базового запроса на отбор всех записей
		this.query();
	},
	getFormMarkup: function(){
		// Размерка формы запросов
		var form = {
			cls: 'sm_form',
			cn: [
				{
					cls: 'sm_form_view_left form',
					ref: 'section1',
					data: {section: 1},
					cn: [
						{
							rtype: 'list',
							ref: 'queryType',
							data: [
								{code: 'select', name: SM.lang('query.form.select', 'Выбрать записи')},
								{code: 'modify', name: SM.lang('query.form.modify', 'Изменить записи')},
								{code: 'remove', name: SM.lang('query.form.remove', 'Удалить записи')}
							],
							value: 'select'
						},{
							cls: 'sm_form_alarm',
							cn: SM.lang('query.form.alarm', 'ВНИМАНИЕ! Удаление записей необратимо! Трижды убедитесь в том, что вы удаляете именно то, что желаете удалить!'),
							ref: 'queryAlarm'
						},{
							rtype: 'textarea',
							ref: 'query',
							value: '{\n\t\n}',
							grow: true,
							tab: true,
							codding: true,
							height: 60
						},{
							rtype: 'textarea',
							label: SM.lang('query.form.querySet', 'Изменяемые поля'),
							ref: 'querySet',
							value: '{\n\t"$set": {\n\t\t\n\t}\n}',
							grow: true,
							tab: true,
							codding: true,
							height: 100
						},{
							rtype: 'checkbox',
							ref: 'explain',
							boxLabel: SM.lang('query.form.explain', 'Аналитика (Explain) запроса')
						},{
							cls: 'sm_form_line',
							cn: [
								{
									cls: 'sm_form_btn blue',
									cn: SM.lang('query.form.execute', 'Выполнить'),
									ref: 'execute',
									data: {btn: 'execute'}
								},{
									cls: 'sm_form_btn',
									cn: SM.lang('query.form.clear', 'Сбросить'),
									st: 'margin-left: 231px;',
									ref: 'clear',
									data: {btn: 'clear'}
								}
							]
						}
					]
				},{
					cls: 'sm_form_view_right',
					ref: 'section2',
					data: {section: 2},
					cn: [
						{
							cls: 'sm_form_btn',
							cn: SM.lang('query.form.sort', 'Сортировка'),
							ref: 'sort',
							data: {btn: 'sort'}
						},{
							cls: 'flex',
							cn: [
								{
									cls: 'sm-lt-icon material-icons',
									cn: 'clear',
									ref: 'sortClear',
									data: {btn: 'sortClear'}
								},{
									cls: 'sm_form_view_textData',
									cn: '',
									ref: 'sortData'
								}
							]
						},{
							cls: 'sm_form_btn',
							cn: SM.lang('query.form.fields', 'Поля'),
							ref: 'fields',
							data: {btn: 'fields'}
						},{
							cls: 'flex',
							cn: [
								{
									cls: 'sm-lt-icon material-icons',
									cn: 'clear',
									ref: 'fieldsClear',
									data: {btn: 'fieldsClear'}
								},{
									cls: 'sm_form_view_textData',
									cn: '',
									ref: 'fieldsData'
								}
							]
						},{
							cls: 'sm_form_view_textData',
							st: 'margin-top: 20px;',
							cn: '',
							ref: 'queryTime'
						}
					]
				}
			]
		};


		return form;
	},
	setLinks: function(){
		// события на элементы формы
		R.each(this.cmps, function(cmp){
			cmp.on('change', this.onFieldChange, this);
		}, this);

		R.each(this.items, function(el, code){
			var data = el.data();
			if(R.xp(data, 'btn')){
				el.on('click', function(){this.onBtnClick(data.btn)}, this);
			}
		}, this);
	},
	onFieldChange: function(fld){
		// логика формы от типа запроса
		if(fld.ref == 'queryType'){
			this.syncByType();

			// при выборе типа "Запрос" - выполнять запрос
			var type = fld.getValue();
			if(R.xp(type, 'code') == 'select'){
				this.query();
			}
		}
	},
	onBtnClick: function(btn){
		// обработка нажатия кнопок
		var explain = R.xp(this.cmps, 'explain');

		// Выполнение запроса
		if(btn == 'execute'){
			this.clearPages();
			this.query();
		}

		// Вызов окна Сортировки
		if(btn == 'sort'){
			this.onSortClick();
		}
		if(btn == 'sortClear'){
			this.setSort();
		}

		// Вызов окна Полей
		if(btn == 'fields'){
			this.onFieldsClick();
		}
		if(btn == 'fieldsClear'){
			this.setFields();
		}

		// Кнопка сброса
		if(btn == 'clear'){
			this.onClearClick();
		}
	},
	syncByType: function(){
		// логика формы от значения типа запроса
		var queryType = R.xp(this.cmps, 'queryType');
		var querySet = R.xp(this.cmps, 'querySet');
		var section2 = R.xp(this.items, 'section2');
		var queryAlarm = R.xp(this.items, 'queryAlarm');
		var explain = R.xp(this.cmps, 'explain');

		if(!queryType){
			return;
		}

		var queryType = R.xp(queryType.getValue(), 'code');

		if(queryType == 'modify'){
			querySet.show();
		}else{
			querySet.hide();
		}

		if(queryType == 'select'){
			section2.show();
			explain.show();
		}else{
			section2.hide();
			explain.hide();
		}

		if(queryType == 'remove'){
			queryAlarm.show();
		}else{
			queryAlarm.hide();
		}
	},
	onSortClick: function(){
		// окно сортировок
		var parent = this;
		var data = R.xp(this.items, 'sortData.data');

		this.sortWindow = new Resolute.Window({
			width: 520,
			title: SM.lang('query.sort.title', 'Сортировка результатов запроса'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						cls: 'sm_form_label',
						cn: SM.lang('query.sort.fields', 'Укажите поля (пути), по которым следует выполнить сортировку результатов запроса') + '<br><br>'
					},
					{
						cls: 'sm_form_line',
						cn: [
							{
								rtype: 'sm-select',
								ref: 'path.0',
								data: SM.data.pathes,
								width: 400
							},{
								rtype: 'list',
								cls: 'sm_list_arrow',
								ref: 'ord.0',
								data: [
									{code:1, name: '&#8593;'},
									{code:-1, name: '&#8595;'}
								],
								value: 1,
								width: 80
							}
						]
					},{
						cls: 'sm_form_line',
						cn: [
							{
								rtype: 'sm-select',
								ref: 'path.1',
								data: SM.data.pathes,
								width: 400
							},{
								rtype: 'list',
								cls: 'sm_list_arrow',
								ref: 'ord.1',
								data: [
									{code:1, name: '&#8593;'},
									{code:-1, name: '&#8595;'}
								],
								value: 1,
								width: 80
							}
						]
					},{
						cls: 'sm_form_line',
						cn: [
							{
								rtype: 'sm-select',
								ref: 'path.2',
								data: SM.data.pathes,
								width: 400
							},{
								rtype: 'list',
								cls: 'sm_list_arrow',
								ref: 'ord.2',
								data: [
									{code:1, name: '&#8593;'},
									{code:-1, name: '&#8595;'}
								],
								value: 1,
								width: 80
							}
						]
					},{
						cls: 'sm_form_line',
						cn: [
							{
								rtype: 'sm-select',
								ref: 'path.3',
								data: SM.data.pathes,
								width: 400
							},{
								rtype: 'list',
								cls: 'sm_list_arrow',
								ref: 'ord.3',
								data: [
									{code:1, name: '&#8593;'},
									{code:-1, name: '&#8595;'}
								],
								value: 1,
								width: 80
							}
						]
					},{
						cls: 'sm_form_line',
						cn: [
							{
								rtype: 'sm-select',
								ref: 'path.4',
								data: SM.data.pathes,
								width: 400
							},{
								rtype: 'list',
								cls: 'sm_list_arrow',
								ref: 'ord.4',
								data: [
									{code:1, name: '&#8593;'},
									{code:-1, name: '&#8595;'}
								],
								value: 1,
								width: 80
							}
						]
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('apply', 'Применить')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onAfterRender: function(){
				if(data){
					this.setData(data);
				}
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					this.getData();
					this.close();
					parent.setSort(this.data);
				}
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};
				var pathes = R.xp(this.components, 'path');

				var items = [];
				var value = [];

				R.each(pathes, function(item, code){
					if(item.getValue()){
						var path = item.getValue();
						var ord = R.xp(this.components, 'ord.' + code).getValue();
						if(ord){
							ord = ord.code;
						}else{
							ord = 1;
						}

						path = SM.fn.preparePath(path);

						items.push({path: path, ord: ord});
						value.push(path + ':' + ord);
					}
				}, this);
				
				this.data = {
					value: value.join(', '),
					items: items
				};

				return this.data;
			},
			setData: function(data){
				// установка данных на форму
				var items = R.xp(data, 'items');
				if(!items || !isArray(items) || isEmpty(items)){
					return;
				}

				var i = 0;
				R.each(items, function(item){
					var path = R.xp(item, 'path');
					var ord = R.xp(item, 'ord', 1);
					if(path){
						var pathFld = R.xp(this.components, 'path.' + i);
						var ordFld = R.xp(this.components, 'ord.' + i);
						if(pathFld){
							pathFld.setValue(path);
							ordFld.setValue(ord);
						}
						i++;
					}
				}, this);
			}
		});
	},
	setSort: function(sort, noQuery){
		// установка на форму запроса сортировки
		var sortDataEl = R.xp(this.items, 'sortData');
		var sortClear = R.xp(this.items, 'sortClear');
		var sortStr = R.xp(sort, 'value', '');

		sortClear.hide();
		if(sortStr){
			sortClear.show();
		}

		sortDataEl.setHtml(sortStr);
		sortDataEl.data = sort;

		if(!noQuery){
			this.query();
		}
	},
	onFieldsClick: function(){
		// окно полей результата запроса
		var parent = this;
		var data = R.xp(this.items, 'fieldsData.data');

		this.fieldsWindow = new Resolute.Window({
			width: 520,
			title: SM.lang('query.fields.title', 'Выбор полей результата запроса'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cn: [
					{
						cls: 'sm_form_label',
						cn: SM.lang('query.fields.001', 'Добавьте по одному') + '<br>'
					},{
						cn: [
							{
								rtype: 'sm-select',
								cls: 'field',
								ref: 'field',
								data: SM.data.pathes,
								width: 490
							},{
								cls: 'sm_form_btn',
								cn: SM.lang('query.fields.002', 'Добавить'),
								ref: 'addField',
								st: ''
							}
						]
					},{
						cls: 'sm_form_label',
						cn: '<br>'
					},{
						cls: 'sm_form_label',
						cn: SM.lang('query.fields.003', 'Или укажите через запятую поля (пути), которые требуется отобрать запросом: id, name, type.name и т.п.') + '<br>'
					},{
						cn: [
							{
								rtype: 'textarea',
								ref: 'fields',
								width: 490,
								height: 80
							}
						]
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('apply', 'Применить')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onAfterRender: function(){
				if(data){
					this.setData(data);
				}

				var addField = R.xp(this.elements, 'addField');
				if(addField){
					addField.on('click', this.addField, this);
				}
			},
			addField: function(){
				var fld = R.xp(this.components, 'field');
				var flds = R.xp(this.components, 'fields');
				if(!fld || !flds){
					return;
				}

				var field = fld.getValue();
				var fields = flds.getValue();

				if(!field){
					return;
				}

				fields = fields.split(' ').join('');
				if(fields){
					fields = fields.split(',');
				}else{
					fields = [];
				}

				if(inArray(field, fields)){
					return;
				}

				fields.push(field);
				fields = fields.join(', ');
				flds.setValue(fields);

				fld.setValue();
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					this.getData();
					this.close();
					parent.setFields(this.data);
				}
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};
				var fld = R.xp(this.components, 'fields');
				var value = fld.getValue();

				value = SM.fn.preparePath(value);
				var items = value.split(',');

				value = value.split(',').join(', ');

				this.data = {
					value: value,
					items: items
				};

				return this.data;
			},
			setData: function(data){
				// установка данных на форму
				var value = R.xp(data, 'value');
				if(!value){
					value = '';
				}

				var fld = R.xp(this.components, 'fields');
				fld.setValue(value);
			}
		});
	},
	setFields: function(fields, noQuery){
		// установка на форму запроса полей
		var fieldsDataEl = R.xp(this.items, 'fieldsData');
		var fieldsClear = R.xp(this.items, 'fieldsClear');
		var value = R.xp(fields, 'value', '');

		fieldsClear.hide();
		if(value){
			fieldsClear.show();
		}

		fieldsDataEl.setHtml(value);
		fieldsDataEl.data = fields;

		if(!noQuery){
			this.query();
		}
	},
	onClearClick: function(){
		// сброс параметров запроса
		this.clear();
	},
	clear: function(params){
		// сброс параметров запроса
		var queryType = R.xp(this.cmps, 'queryType');
		var query = R.xp(this.cmps, 'query');
		var querySet = R.xp(this.cmps, 'querySet');
		var sortData = R.xp(this.items, 'sortData');
		var fieldsData = R.xp(this.items, 'fieldsData');

		queryType.setValue('select');
		if(!R.xp(params, 'saveQuery')){
			query.setValue(query.initialConfig.value);
		}
		querySet.setValue(querySet.initialConfig.value);

		this.setSort(null, true);
		this.setFields(null, true);

		this.clearPages();

		this.syncByType();

		this.query();
	},
	clearPages: function(){
		// Сброс текущей страницы
		this.skip = 0;
	},
	refresh: function(params){
		// Обновление текущего представления в исходное состояние
		// Обновляются список коллекций и отображение пустого запроса по коллекции
		this.clear(params);
		SM.modules.dbase.updateCollectionsList();
	},
	getCurrentQuery: function(emptyOnError){
		var query = R.xp(this.cmps, 'query').getValue();
		var query = SM.fn.toJSON(query);
		if(!query){
			if(!emptyOnError){
				return null;
			}
			query = {};
		}

		return query;
	},
	query: function(){
		// выполнение текущего запроса (вызов)
		var sort = R.xp(this.items, 'sortData.data');
		if(!sort || !isObject(sort)){
			sort = [];
		}

		var fields = R.xp(this.items, 'fieldsData.data');
		if(!fields || !isObject(fields)){
			fields = [];
		}

		// подготовка основного запроса
		var query = this.getCurrentQuery();
		if(!query){
			R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
			return;
		}

		// Чекбокс "EXPLAIN" - отправляем в EXPLAIN
		var explain = R.xp(this.cmps, 'explain');
		if(explain && explain.getValue()){
			this.explain();
			return;
		}
		
		// подготовка запроса на изменение
		var type = R.xp(this.cmps, 'queryType').getValue();
		var querySet = R.xp(this.cmps, 'querySet').getValue();
		if(type && type.code == 'modify'){
			var querySet = SM.fn.toJSON(querySet);
			if(!querySet){
				R.Msg.alert(SM.lang('query.alerts.001', 'Невалидный JSON в области изменяемых данных'));
				return;
			}
		}

		// Данные для обращения на сервер
		request = {
			dbase: SM.data.dbase,
			collection: SM.data.collection,
			type: type,
			query: query,
			querySet: querySet,
			sort: sort,
			fields: fields,
			limit: this.limit,
			skip: this.skip
		};

		// Запрос на выполнение запроса к БД
		// Для опасных операций - через конфирм действия
		if(type && (type.code == 'modify' || type.code == 'remove')) {
			var cfrm = SM.lang('query.alerts.002', 'Ваши действия приведут к изменению записей! Вы уверены, что хотите именно этого?');
			if(type.code == 'remove'){
				cfrm = SM.lang('query.alerts.003', 'Вы уверены, что хотите УДАЛИТЬ записи???');
			}
			R.Msg.show({
				title: SM.lang('confirm', 'Подтверждение'),
				msg: cfrm,
				buttons: R.Msg.YESNO,
				fn: function(btn){if(btn=='yes'){
					this.querySend(request);
				}},
				scope:this
			});
		}else{
			this.querySend(request);
		}
	},
	querySend: function(request, callback, scope){
		// отправка уже сформированного запроса на сервер
		R.garbageCollect(); // Чистка памяти

		SM.request('query', request, function(r){
			this.setTime(R.xp(r, 'data.time'));
			this.setResult(r.data);

			if(R.xp(r, 'msg')){
				R.Notices.alert(r.msg);
			}

			SM.modules.dbase.updateCollectionCount();

			if(callback && isFunction(callback)){
				callback.call(scope || callback)
			}
		}, this);
	},
	getPathes: function(){
		// запрос массива путей по записям коллекции
		SM.request('getPathes', {}, function(r){
			SM.data.pathes = R.xp(r, 'data', []);
		}, this);
	},
	setTime: function(time){
		// вывод времени выполнения запроса
		var queryTime = R.xp(this.items, 'queryTime');
		queryTime.setHtml(SM.lang('query.form.time', 'Время выполнения') + ': <i>' + time + ' ms</i>');
	},
	setResult: function(data){
		// установка результата выполнения скрипта
		var type = R.xp(this.cmps, 'queryType').getValue().code;

		var recordsCnt = R.xp(this.items, 'records');
		var pagesTop = R.xp(this.items, 'pagesTop');
		var pagesBottom = R.xp(this.items, 'pagesBottom');

		pagesTop.setHtml('');
		recordsCnt.setHtml('');
		pagesBottom.setHtml('');

		// При удалении надо обновить список коллекций
		// И сбросить форму
		if(type == 'remove'){
			SM.modules.dbase.updateCollectionsList();
			this.onClearClick();
		}

		var records = R.xp(data, 'records');
		var count = R.xp(data, 'count');
		if(!records || !isArray(records) || isEmpty(records)){
			recordsCnt.setHtml(SM.lang('query.form.empty', 'Нет записей...'));
			return;
		}

		// Страницы, верх
		SM.modules.pages.init(pagesTop, this, {count: count, skip: this.skip, limit: this.limit});

		// Вывод записей
		this.records = [];
		R.each(records, function(record){
			var rec = new SM.obj.record(recordsCnt, record);
			this.records.push(rec);
		}, this);

		// Страницы, низ
		SM.modules.pages.init(pagesBottom, this, {count: count, skip: this.skip, limit: this.limit});

		// Чистка памяти
		R.garbageCollect();
	},
	explain: function(){
		// Запуск действия "Explain" по запросу типа "FIND" (Select)
		var query = this.getCurrentQuery();
		if(!query){
			R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
			return;
		}

		var sort = R.xp(this.items, 'sortData.data');
		if(!sort || !isObject(sort)){
			sort = [];
		}

		R.garbageCollect(); // Чистка памяти

		SM.request('explain', {query:query, sort:sort}, function(r){
			var recordsCnt = R.xp(this.items, 'records');
			var pagesTop = R.xp(this.items, 'pagesTop');
			var pagesBottom = R.xp(this.items, 'pagesBottom');

			pagesTop.setHtml('');
			recordsCnt.setHtml('');
			pagesBottom.setHtml('');

			SM.modules.explain.init(recordsCnt, r.data);
		}, this);
	}
};
