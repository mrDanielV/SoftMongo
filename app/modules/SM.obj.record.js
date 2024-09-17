// Объект отображения одной записи колллекции
SM.obj.record = function(body, record, options){
	this.body = body;
	this.record = record;
	this.view = SM.modules.collection.view;
	
	this.options = options;
	this.contextmenu = R.xp(options, 'contextmenu', true);
	
	this.expanded = false;
	this.renderedFull = false;

	this.render();

	return this;
}

SM.obj.record.prototype = {
	render: function(){
		if(!this.body){
			return;
		}

		var menu = R.xp(this.options, 'menu');
		if(!menu){
			menu = [
				{code: 'edit', name: SM.lang('record.menu.edit', 'Изменить')},
				{code: 'refresh', name: SM.lang('record.menu.refresh', 'Обновить')},
				{code: 'remove', name: SM.lang('record.menu.remove', 'Удалить')},
				{code: 'expand', name: SM.lang('record.menu.expand', 'Развернуть')}
			];
		}

		this.markup = {
			cls: 'sm_record_main', ref: 'record',
			cn: [
				{cls: 'sm_record_menu', cn: [
					{cls: '', cn: '', st: 'width: 20px;'},
					{cls: 'sm_record_menu_item material-icons size-13 pl-15 pr-15', cn: 'file_copy', ref: 'copy', data: 'action'}
				]},
				{cls: 'sm_record_content collapsed', cn: '', ref: 'recordContent'}
			]
		};
		R.each(menu, function(mitem){
			var item = {cls: 'sm_record_menu_item', cn: mitem.name, ref: mitem.code, data: 'action'};
			this.markup.cn[0].cn.push(item);
		}, this);

		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		// Применение основного содержимого записи
		this.setRecord();

		// События
		this.setLinks();
	},
	setLinks: function(){
		// события на элементы меню
		R.each(this.items, function(el, code){
			var data = el.data();
			if(data == 'action'){
				el.on('click', function(){this.onAction(code)}, this);
			}
		}, this);

		// Свернуть/Развернуть запись по двойному клику
		this.items.record.on('dblclick', this.toggle, this);

		// Клики на основную запись-узлы
		this.items.recordContent.on('click', this.onClick, this);
		this.items.recordContent.on('dblclick', this.onDblClick, this);

		// Наведение мыши на основную запись-узлы
		this.items.recordContent.on('mouseover', this.onHover, this);
	},
	setRecord: function(record){
		// прорисовка объекта записи
		if(record){
			this.record = record;
		}
		if(!this.record || !isObject(this.record)){
			this.record = {};
		}

		// Основной контейнер записи
		var contentEl = R.xp(this.items, 'recordContent');
		if(!contentEl){
			return;
		}

		contentEl.setHtml('');

		R.garbageCollect();

		// Вывод интерактивного объекта записи
		this.rootNode = new SM.obj.node(contentEl, { name: '', value: this.record}, null, this );
	},
	onClick: function(e, el){
		var el = R.get(el);
		if(!el){
			return;
		}

		// обработка кликов по узлу записи или его частям
		var node = this.getNodeByEl(el);
		if(node){
			this.onNodeClick(node, node.code, e);
		}
	},
	onDblClick: function(e, el){
		var el = R.get(el);
		if(!el){
			return;
		}

		// обработка двойных кликов по узла записи или его частям
		var node = this.getNodeByEl(el);
		if(node){
			this.onNodeDblClick(node, node.code, e);
		}
	},
	onHover: function(e, el){
		var el = R.get(el);
		if(!el){
			return;
		}

		var node = this.getNodeByEl(el);

		// Наведение на элементы "свернуть/развернуть блок"
		if(node && el.hasClass('sm_node_opener')){
			node.openerMenu();
		}

		// Скрыть меню элементов "свернуть/развернуть блок" при наведении на другие элементы
		if(el.hasClass('sm_node_name') || el.hasClass('sm_value') || el.hasClass('sm_node')){
			var openerMenus = filterIn(R.Pickers.cache, 'type', 'openerMenu');
			if(openerMenus && isArray(openerMenus)){
				R.each(openerMenus, function(m){
					m.hide();
				});
			}
		}
	},
	onAction: function(code){
		// обработка действий пунктов меню
		// Редактирование записи как JSON-текста
		if(code == 'edit'){
			SM.modules.collection.upsert.init(this.record, this.options);
		}

		// Копирование записи в буфер
		if(code == 'copy'){
			var text = JSON.stringify(this.record, null, '\t');
			SM.fn.copyBuffer(text);
			R.Notices.alert(SM.lang('record.alerts.001', 'Скопировано в буфер обмена!'));
		}

		// Удаление записи
		if(code == 'remove'){
			this.onRemove();
		}

		// Раскрыть/свернуть
		if(code == 'expand'){
			this.toggle();
		}

		// Обновить запись из БД
		if(code == 'refresh'){
			this.refresh();
		}
	},
	onNodeClick: function(node, code, e){
		// Обработка кликов по узлам и частям узлов
		if(!node){
			return;
		}

		// Свернуть/Развернуть блок
		if(code == 'opener'){
			node.toggle();
		}

		// Для любого элемента узла, кроме имени - на клик скрыть все активные иконки контекстных меню
		if(code != 'sm_node_name' && code != 'menu'){
			node.hideMenusIcon();
		}

		// иконка меню узла
		if(code == 'sm_node_name' && this.contextmenu){
			node.toggleMenu();
		}

		// Блок доп. информации
		if(code == 'value'){
			node.toggleInfo();
		}
		if(code != 'value' && code != 'info'){
			node.hideInfos();
		}

		if(code == 'menu' && this.contextmenu){
			node.showMenu();
		}
	},
	onNodeDblClick: function(node, code, e){
		// двойной клик по имени узла - свернуть/развернуть его
		if(node.expandable && code == 'sm_node_name'){
			node.toggle();
		}

		// двойной клик по любому значимому элементу - подавляем, чтобы не происходило сворачивания/разворачивания записи
		if(code && code != 'node'){
			e.stopPropagation();
		}
	},
	toggle: function(){
		// Раскрыть/свернуть
		var contentEl = R.xp(this.items, 'recordContent');
		var expandEl = R.xp(this.items, 'expand');
		if(!contentEl){
			return;
		}

		// Развернуть
		if(contentEl.hasClass('collapsed')){
			contentEl.removeClass('collapsed');
			expandEl.setHtml(SM.lang('record.collaps', 'Свернуть'));
			this.expanded = true;

			if(!this.renderedFull){
				R.Msg.wait();
				this.setRecord.defer(1, this);
				this.renderedFull = true;
			}
		}
		// Свернуть
		else{
			contentEl.addClass('collapsed');
			expandEl.setHtml(SM.lang('record.expand', 'Развернуть'));
			this.expanded = false;
		}
	},
	refresh: function(){
		// обновление содержимого записи из БД
		var params = {
			id: R.xp(this.record, '_id'),
			fields: R.xp(this.view, 'items.fieldsData.data', [])
		};

		SM.request('getRecord', params, function(r){
			this.setRecord(R.xp(r, 'data'));
			R.Notices.alert(SM.lang('record.alerts.002', 'Запись обновлена!'));

			if(!this.expanded){
				this.renderedFull = false;
			}
		}, this);
	},
	onRemove: function(){
		// конфирм удаления записи
		R.Msg.show({
			title: SM.lang('confirm', 'Подтверждение'),
			msg: SM.lang('record.alerts.003', 'Вы уверены, что хотите УДАЛИТЬ запись?'),
			buttons: R.Msg.YESNO,
			fn: function(btn){if(btn=='yes'){
				this.remove();
			}},
			scope:this
		});
	},
	remove: function(){
		// удаление записи из БД
		SM.request('removeRecord', {id: R.xp(this.record, '_id')}, function(r){
			R.Notices.alert(SM.lang('record.alerts.004', 'Запись удалена!'));
			SM.modules.dbase.updateCollectionsList();
			this.view.refresh({saveQuery: true});
		}, this);
	},
	setNodeValue: function(path, value){
		// установка значения по пути в объект записи
		if(!path){
			return;
		}

		// сохранение в БД
		var params = {
			oid: R.xp(this.record, '_id.$oid', R.xp(this.record, '_id.$id')),
			path: path,
			value: value
		};

		SM.request('updatePath', params, function(r){
			R.Notices.alert(SM.lang('record.alerts.005', 'Запись обновлена!'));
			R.put(this.record, path, value);
			this.afterSave();
		}, this);
	},
	deleteNode: function(path){
		// Удаление узла по указанному пути
		var params = {
			oid: R.xp(this.record, '_id.$oid', R.xp(this.record, '_id.$id')),
			path: path
		};

		SM.request('deletePath', params, function(r){
			R.Notices.alert(SM.lang('record.alerts.005', 'Запись обновлена!'));
			R.path.unset(this.record, path);
			this.afterSave();
		}, this);
	},
	renameNode: function(path, newpath){
		// Переименование (перемещение) узла по указанному пути на новый путь
		var params = {
			oid: R.xp(this.record, '_id.$oid', R.xp(this.record, '_id.$id')),
			path: path,
			newpath: newpath
		};

		SM.request('renamePath', params, function(r){
			R.Notices.alert(SM.lang('record.alerts.005', 'Запись обновлена!'));
			this.view.query();
		}, this);
	},
	saveRecord: function(){
		// сохранение текущей записи в БД
		SM.request('upsert', {record: this.record}, function(r){
			R.Notices.alert(SM.lang('record.alerts.006', 'Запись сохранена!'));
			this.afterSave();
		}, this);
	},
	afterSave: function(){
		// обработка результата сохранения записи в БД
		this.setRecord();
	},
	getNodeByEl: function(el){
		// получение объекта узла (SM.obj.node) по элементу узла или его части
		if(!el){
			return;
		}

		// если клик был по узлу записи или составной части узла, получим узел
		var node = null;
		var code = null;
		var elData = el.data();
		if(isObject(elData) && R.xp(elData, 'path')){
			code = 'node';
			node = this.getNodeByPath(R.xp(elData, 'path'));
		}
		else{
			var parent = el.parent('.sm_node');
			if(parent){
				code = elData;
				node = this.getNodeByPath(R.xp(parent.data(), 'path'));
			}
		}
		if(node){
			node.code = code;
		}

		return node;
	},
	getNodeByPath: function(path){
		// получение проинициированного объекта узла записи по пути в объекте записи
		// Поиск происходит по дереву от this.rootNode.childs, где каждый последующий узел содержит свой массив узлов childs
		if(!path || !isString(path)){
			return this.rootNode;
		}

		var parthes = path.split('.');
		var nodes = R.xp(this.rootNode, 'childs');
		var node = null;

		var pps = [];
		R.each(parthes, function(p){
			var pp = p;
			if(!isEmpty(pps)){
				pp = pps.join('.') + '.' + p;
			}

			node = findIn(nodes, 'path', pp);

			if(node){
				pps.push(p);
				nodes = R.xp(node, 'childs');
			}
		}, this);

		return node;
	},
	getNodesByLevel: function(level){
		// получение проинициированных объектов узла по уровню
		var nodes = [];

		R.select('.lv' + level, this.rootNode.body).each(function(el){
			var node = this.getNodeByEl(el);
			if(node){
				nodes.push(node);
			}
		}, this);

		return nodes;
	},
	collapsLevel: function(level){
		// свернуть все узла заданного уровня
		if(!level){
			return;
		}

		var nodes = this.getNodesByLevel(level);
		R.each(nodes, function(node){
			if(node.expandable && node.expanded){
				node.toggle();
			}
		});
	},
	expandLevel: function(level){
		// свернуть все узла заданного уровня
		if(!level){
			return;
		}

		var nodes = this.getNodesByLevel(level);
		R.each(nodes, function(node){
			if(node.expandable && !node.expanded){
				node.toggle();
			}
		});
	}
};
