// Модуль формы импорта данных
SM.modules.import = {
	initmarkup: {
		cls: 'p-20',
		cn: [
			{cls: 'sm_m_title', cn: SM.lang('import.title', 'Импорт данных')}
		]
	},
	init: function(data){
		this.markup = R.clone(this.initmarkup);
		this.view = SM.modules.dbase;
		this.render();
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

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		// Вешаем прослушивание кликов
		this.setLinks();

		// логика форма, видимости полей
		this.syncForm();
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
							label: SM.lang('import.form.mode.label', 'Вариант импорта'),
							data: [
								{code: 'file', name: SM.lang('import.form.mode.file', 'Файл (zip-архив)')},
								{code: 'text', name: SM.lang('import.form.mode.text', 'Текст (формат softMongo)')}
							],
							value: 'file'
						},{
							rtype: 'fileinput',
							ref: 'file',
							icon: 'upload_file',
							label: SM.lang('import.form.file', 'Файл'),
							emptyText: SM.lang('import.form.fileEmpty', 'Укажите файл'),
							exts: ['zip']
						},{
							rtype: 'textarea',
							ref: 'text',
							label: SM.lang('import.form.text', 'Текст'),
							height: 350
						},{
							cls: 'sm_form_btn mt-20 ml-512',
							cn: SM.lang('import.form.execute', 'Импортировать'),
							ref: 'execute',
							data: {btn: 'execute'}
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

		// Удаление значения для поля Файл
		var clearEl = R.xp(this.items, 'fileClear');
		var fileFld = R.xp(this.cmps, 'file');
		if(clearEl && fileFld){
			clearEl.on('click', fileFld.clear, fileFld);
		}
	},
	syncForm: function(){
		// логика видимости полей формы от значений других полей
		var modeFld = R.xp(this.cmps, 'mode');
		if(!modeFld){
			return;
		}

		var mode = modeFld.getValue();

		var file = R.xp(this.cmps, 'file');
		var text = R.xp(this.cmps, 'text');

		file.hide();
		text.hide();

		if(mode && mode.code == 'file'){
			file.show();
		}
		else{
			text.show();
		}
	},
	onFormChange: function(fld){
		// на изменение значений полей
		if(fld.ref == 'mode'){
			this.syncForm();
		}
	},
	validate: function(){
		// валидация формы
		var modeFld = R.xp(this.cmps, 'mode');
		if(!modeFld){
			R.Msg.alert(SM.lang('import.alerts.001', 'Ошибка данных формы импорта!'));
			return false;
		}

		var mode = modeFld.getValue();
		var text = R.xp(this.cmps, 'text').getValue();
		var fileFld = R.xp(this.cmps, 'file');
		var file = fileFld.getFile();

		if(!mode){
			R.Msg.alert(SM.lang('import.alerts.001', 'Ошибка данных формы импорта'));
			return false;
		}

		if(mode.code == 'file' && !file){
			R.Msg.alert(SM.lang('import.alerts.002', 'Не указан файл импорта'));
			return false;
		}
		if(mode.code == 'file' && !fileFld.validate()){
			R.Msg.alert(SM.lang('import.alerts.003', 'Указан файл недопустимого формата'));
			return false;
		}
		if(mode.code == 'text' && !text){
			R.Msg.alert(SM.lang('import.alerts.004', 'Не указан текст импорта'));
			return false;
		}

		return true;
	},
	getData: function(){
		// сбор данных с формы
		this.data = {};

		var modeFld = R.xp(this.cmps, 'mode');
		if(!modeFld){
			R.Msg.alert(SM.lang('import.alerts.001', 'Ошибка данных формы импорта!'));
			return false;
		}

		this.data = {
			mode: modeFld.getValue(),
			text: R.xp(this.cmps, 'text').getValue()
		};

		return this.data;
	},
	execute: function(){
		// запуск процесса экспорта
		if(!this.validate()){
			return false;
		}

		// Сбор данных
		this.getData();
		this.data.dbase = SM.data.dbase;

		// Параметры запроса, файл прикрепляем отдельным атрибутом
		var params = {
			operation: 'Import.get',
			data: R.encode(this.data),
			file: R.xp(this.cmps, 'file').getFile()
		};

		// Отправляем на сервер
		var w = R.Msg.wait(SM.lang('import.alerts.005', 'Импорт данных...'));
		R.request({
			url: 'operations/',
			params: params,
			timeout: 120000,
			onSuccess: function(r){
				this.successWin(r.data);
				this.view.updateCollectionsList();
				w.close();
			},
			onFailure: function(r){
				w.close();
				R.Msg.alert(R.xp(r, 'msg', SM.lang('import.alerts.006', 'Ошибка выполнения...')));
			},
			scope: this
		});
	},
	successWin: function(data){
		// Окно визуализации успешного импорта
		var parent = this;
		var node = this.node;

		// Изменение значения узла
		var form = new Resolute.Window({
			width: 520,
			title: SM.lang('import.success.title', 'Результаты импорта'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			data: data,
			markup:{
				cn: [
					{
						cls: 'sm_import_res',
						cn: [
							{cn: SM.lang('import.success.001', 'Успешно импортировано записей') + ': ' + R.xp(data, 'imported')},
							{cn: SM.lang('import.success.002', 'Количество коллекций импорта') + ': ' + R.xp(data, 'collections.n')},
							{cn: SM.lang('import.success.003', 'Ошибок') + ': ' + R.xp(data, 'errors.n')}
						]
					},
					{
						ref: 'errors',
						cn: [
							{ref: 'errorsShow', cls: 'sm_import_errorsShow', cn: SM.lang('import.success.004', 'Показать ошибки')},
							{ref: 'errorsList', cls: 'sm_import_errorsList', cn: ''}
						]
					}
				]
			},
			buttons:[
				{code: 'close', name: SM.lang('close', 'Закрыть')}
			],
			onAfterRender: function(){
				this.setErrors();
			},
			setErrors: function(){
				var errorsList = R.xp(this.data, 'errors.list');
				var errors = R.xp(this.elements, 'errors');
				if(!errorsList || isEmpty(errorsList)){
					errors.hide();
					return;
				}

				var errorsListEl = R.xp(this.elements, 'errorsList');
				errorsListEl.setHtml(errorsList.join('<br>'));

				errors.show();
				errorsListEl.hide();

				var errorsShow = R.xp(this.elements, 'errorsShow');
				errorsShow.on('click', this.toggleErrors, this);
			},
			toggleErrors: function(){
				var errorsList = R.xp(this.elements, 'errorsList');
				var errorsShow = R.xp(this.elements, 'errorsShow');

				if(errorsList.isHidden()){
					errorsList.show();
					errorsShow.setHtml(SM.lang('import.success.005', 'Скрыть ошибки'));
				}else{
					errorsList.hide();
					errorsShow.setHtml(SM.lang('import.success.004', 'Показать ошибки'));
				}
			}
		});
	}
};
