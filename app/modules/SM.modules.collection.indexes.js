// Модуль индексов коллекции
SM.modules.collection.indexes = {
	initmarkup: {
		cls: 'sm_collection_indexes',
		cn: [
			{cls: 'sm_menu_item', cn: [
				{cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/add.png'}},
				{cls: 'sm_menu_item_name', cn: SM.lang('indexes.actions.001', 'Добавить индекс')}
			], ref: 'add'}
		]
	},
	init: function(parent){
		this.markup = R.clone(this.initmarkup);
		this.parent = parent;

		// получение индексов коллекции
		this.getIndexes();
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(this.parent, 'items.content');
		if(!this.body){
			return;
		}
		this.body.setHtml('');

		// блок для элементов индекса
		this.markup.cn.push({cls: 'sm_indexes', ref: 'indexes_body'});

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		// Отрисовка индексов
		var indexesBody = R.xp(this.items, 'indexes_body');
		this.indexesItems = [];
		R.each(this.indexes, function(index){
			this.indexesItems.push(new SM.obj.index(indexesBody, index, this));
		}, this);

		// Вешаем прослушивания на элементы
		this.setLinks();
	},
	setLinks: function(){
		// Вешаем прослушивания на элементы
		var addBtn = R.xp(this.items, 'add');
		if(addBtn){
			addBtn.on('click', this.addForm, this);
		}
	},
	getIndexes: function(){
		// получение индексов коллекции
		SM.request('getIndexes', {}, function(r){
			this.indexes = R.xp(r, 'data');
			this.render();
		}, this);
	},
	addForm: function(update, data){
		// Вызов формы добавления индекса
		var parent = this;

		// обновить страницу индексов по результату работы с формой
		if(!isDefined(update)){
			update = true;
		}

		this.indexWindow = new Resolute.Window({
			data: data,
			width: 520,
			title: SM.lang('indexes.form.title', 'Создание индекса'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						rtype: 'textfield',
						ref: 'name',
						label: SM.lang('indexes.form.001', 'Наименование индекса'),
						width: 490
					},
					{
						cls: 'sm_form_label',
						cn: SM.lang('indexes.form.002', 'Поля индекса')
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
					},
					{
						rtype: 'checkbox',
						ref: 'unique',
						boxLabel: SM.lang('indexes.form.003', 'Уникальность значений')
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('indexes.form.004', 'Создать')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onAfterRender: function(){
				if(this.data && isString(this.data)){
					var path0 = R.xp(this.components, 'path.0');
					if(path0){
						path0.setValue(this.data);
					}
				}
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					if(this.getData()){
						parent.addIndex(this.data, update);
						this.close();
					}
				}
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};

				var name = R.xp(this.components, 'name').getValue();
				var unique = R.xp(this.components, 'unique').getValue();
				var pathes = R.xp(this.components, 'path');

				var items = [];
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
					}
				}, this);

				if(isEmpty(items)){
					R.Msg.alert(SM.lang('indexes.alerts.001', 'Необходимо заполнить форму, указав хотя бы одно поле для индексации'));
					return false;
				}
				
				this.data = {
					name: name,
					items: items,
					unique: unique
				};

				return this.data;
			}
		});
	},
	addIndex: function(data, update){
		// добавление индекса по данным формы
		SM.request('createIndex', {index: data}, function(r){
			if(!R.xp(r, 'msg')){
				R.Notices.alert(SM.lang('indexes.alerts.002', 'Индекс создан!'));
			}
			if(update){
				this.getIndexes();
			}
		}, this);
	}
};
