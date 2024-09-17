// Модуль формы экспорта данных из коллекции/коллекций
SM.modules.export = {
	initmarkup: {
		cls: 'p-20',
		cn: [
			{cls: 'sm_m_title', cn: SM.lang('export.title', 'Экспорт данных')}
		]
	},
	init: function(data){
		this.markup = R.clone(this.initmarkup);

		this.data = data;

		this.render();
		this.setData();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(SM, 'view.items.right');
		if(!this.body){
			return;
		}
		this.body.setHtml('');

		// Форма
		var formMarkup = this.getFormMarkup();
		this.markup.cn.push(formMarkup);

		// Текстовая область отображения результата
		var answermk = {
			cls: 'mt-30', cn: [
				{
					rtype: 'textarea',
					style: 'padding: 5px; line-height: 18px;',
					ref: 'answer',
					attr: { spellcheck:'false' },
					height: 400
				}
			]
		};
		this.markup.cn.push(answermk);
		
		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		// Скрыть область отображения ответа
		var answer = R.xp(this.cmps, 'answer');
		if(answer){
			answer.hide();
		}

		// Вешаем прослушивание кликов
		this.setLinks();
	},
	getFormMarkup: function(){
		// Размерка формы запросов
		var form = {
			cls: 'sm_form form',
			cn: [
				{
					cls: 'w-650',
					ref: 'section1',
					data: {section: 1},
					cn: [
						{
							rtype: 'list',
							ref: 'mode',
							label: SM.lang('export.form.mode.label', 'Вариант экспорта'),
							data: [
								{code: 'file', name: SM.lang('export.form.mode.file', 'Файл (zip-архив)')},
								{code: 'text', name: SM.lang('export.form.mode.text', 'Текст (на экран)')}
							],
							value: 'file'
						},{
							rtype: 'combobox',
							ref: 'type',
							label: SM.lang('export.form.type.label', 'Область экспорта'),
							clearIcon: null,
							listIcon: null,
							hideClear: true,
							data: [
								{code: 'one', name: SM.lang('export.form.type.one', 'Одна коллекции')},
								{code: 'list', name: SM.lang('export.form.type.list', 'Несколько коллекций')},
								{code: 'all', name: SM.lang('export.form.type.all', 'Все коллекции')}
							],
							value: 'all'
						},{
							rtype: 'combobox',
							ref: 'collection',
							label: SM.lang('export.form.collection', 'Коллекция'),
							clearIcon: null,
							listIcon: null,
							hideClear: true,
							data: SM.data.collections 
						},{
							rtype: 'multiselect',
							ref: 'collections',
							label: SM.lang('export.form.collections', 'Коллекции'),
							mandatory: true,
							data: SM.data.collections 
						},{
							rtype: 'textarea',
							ref: 'query',
							label: SM.lang('export.form.query', 'Фильтр записей по запросу'),
							value: '{\n\t\n}',
							grow: true,
							tab: true,
							codding: true,
							height: 60
						},{
							rtype: 'checkbox',
							ref: 'setLimit',
							boxLabel: SM.lang('export.form.setLimit', 'Диапазон записей'),
						},{
							cls: 'flex mt-5',
							ref: 'limitValue',
							cn: [
								{
									rtype: 'numberfield',
									cls: 'ml-45',
									ref: 'skip',
									dec: 0,
									value: 0,
									width: 100
								},{
									cls: 'p-7',
									cn: ' - '
								},{
									rtype: 'numberfield',
									ref: 'limit',
									dec: 0,
									value: 100,
									width: 100
								}
							]
						},{
							cls: 'sm_form_line',
							cn: [
								{
									cls: 'sm_form_btn mt-20 ml-512',
									cn: SM.lang('export.form.execute', 'Выгрузить'),
									ref: 'execute',
									data: {btn: 'execute'}
								}
							]
						}
					]
				},{
					cls: 'sm_form_view_right',
					ref: 'section2',
					data: {section: 2},
					cn: '&nbsp;'
				}
			]
		};


		return form;
	},
	setLinks: function(){
		// вешаем прослушиватели на элементы и компоненты
		R.each(this.cmps, function(cmp){
			cmp.on('change', this.onFormChange, this);
		}, this);

		// кнопка
		var btn = R.xp(this.items, 'execute');
		if(btn){
			btn.on('click', this.execute, this);
		}
	},
	setData: function(){
		// применение данных к форме
		var collection = R.xp(this.data, 'collection');
		var query = R.xp(this.data, 'query');

		var typeFld = R.xp(this.cmps, 'type');
		var collectionFld = R.xp(this.cmps, 'collection');
		var queryFld = R.xp(this.cmps, 'query');

		if(!typeFld){
			return;
		}

		// Коллекция
		if(collection){
			typeFld.setValue('one');
			collectionFld.setValue(collection);
		}

		// Фильтрация по запросу
		if(query && isObject(query) && !isEmpty(query)){
			var qw = R.clone(query);
			qw = JSON.stringify(qw, null, '\t');
			queryFld.setValue(qw);
		}

		this.syncForm();
	},
	syncForm: function(){
		// логика видимости полей формы от значений других полей
		var typeFld = R.xp(this.cmps, 'type');
		if(!typeFld){
			return;
		}

		var type = typeFld.getValue();

		var collection = R.xp(this.cmps, 'collection');
		var collections = R.xp(this.cmps, 'collections');
		var query = R.xp(this.cmps, 'query');

		var setLimit = R.xp(this.cmps, 'setLimit');
		var limitValue = R.xp(this.items, 'limitValue');

		collection.hide();
		collections.hide();
		query.hide();

		setLimit.hide();
		limitValue.hide();

		if(type && type.code == 'one'){
			collection.show();
			query.show();

			setLimit.show();
			limitValue.show();
		}
		else if (type && type.code == 'list'){
			collections.show();
		}

		var setLimitIs = setLimit.getValue();
		if(setLimitIs){
			limitValue.show();
		}else{
			limitValue.hide();
		}
	},
	onFormChange: function(fld){
		// на изменение значений полей
		if(fld.ref == 'type' || fld.ref == 'setLimit'){
			this.syncForm();
		}
	},
	validate: function(){
		// валидация формы
		var typeFld = R.xp(this.cmps, 'type');
		if(!typeFld){
			return true;
		}
		var type = typeFld.getValue();

		var collection = R.xp(this.cmps, 'collection');
		var collections = R.xp(this.cmps, 'collections');
		var query = R.xp(this.cmps, 'query');

		if(type && type.code == 'one'){
			if(!collection.getValue()){
				R.Msg.alert(SM.lang('export.alerts.001', 'Не указана коллекция для экспорта'));
				return false;
			}
			
			var qw = query.getValue();
			if(qw){
				qw = SM.fn.toJSON(qw);
				if(!qw){
					R.Msg.alert(SM.lang('export.alerts.002', 'Некорректный JSON в запросе'));
					return false;
				}
			}
		}
		else if (type && type.code == 'list'){
			if(!collections.getValue()){
				R.Msg.alert(SM.lang('export.alerts.003', 'Не указаны коллекции для экспорта'));
				return false;
			}
		}

		return true;
	},
	getData: function(){
		// сбор данных с формы
		this.data = {};

		// Собрать значения из полей
		R.each(this.cmps, function(cmp){
			if(cmp.hidden){
				return;
			}
			var name = cmp.ref;
			var value = cmp.getValue();

			R.put(this.data, name, value);
		}, this);

		// запрос преобразовать в объект
		var query = R.xp(this.data, 'query');
		if(query){
			var qw = SM.fn.toJSON(query);
			if(!qw){
				qw = {};
			}
			this.data.query = qw;
		}

		return this.data;
	},
	execute: function(){
		// запуск процесса экспорта
		if(!this.validate()){
			return false;
		}

		// Скрыть область отображения ответа
		var answer = R.xp(this.cmps, 'answer');
		if(answer){
			answer.hide();
		}

		// Сбор данных
		this.getData();
		this.data.dbase = SM.data.dbase;

		// Обнуление параметров ограничения (Диапазон записей)
		if(!R.xp(this.data, 'setLimit')) {
			this.data.skip = 0;
			this.data.limit = null;
		}

		var mode = R.xp(this.data, 'mode.code');

		var params = {
			operation: 'Export.get',
			data: R.encode(this.data)
		};

		// Экспорт в файл
		if(mode == 'file'){
			Resolute.download('operations/', params);
			return;
		}

		// Экспорт в text
		var w = R.Msg.wait();
		R.request({
			url: 'operations/',
			params: params,
			onSuccess: function(r){
				w.close();
				this.setAnswer(r.data);
			},
			onFailure: function(r){
				w.close();
				R.Msg.alert(r.msg);
			},
			scope: this
		});
	},
	setAnswer: function(text){
		// Отображение результата экспорта в виде текста
		var answerFld = R.xp(this.cmps, 'answer');
		if(!answerFld){
			return;
		}

		answerFld.show();
		answerFld.setValue(text);
	}
};
