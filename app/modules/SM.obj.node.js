// Объект отображения узла объекта записи колллекции
// Рекурсивное построение дерева интерактивного редактора объекта записи коллекции
SM.obj.node = function(body, data, parent, record){
	this.body = body;
	this.data = data;
	this.parent = parent;
	this.record = record;

	this.root = false;
	if(!this.parent){
		this.root = true;
		this.level = 0;
	}

	if(this.parent){
		this.level = this.parent.level + 1;
	}

	// Максимальное количество узлов 1-го уровня для прорисовки в свернутом состоянии
	this.__maxRenderCount = 10;

	// Данные узла в формате {name, value} обязательны
	if(!this.data){
		throw 'Node data is not defined!';
		return this;
	}

	// Дети
	this.childs = null;

	// Состояние = развернут
	this.expanded = true;
	this.expandable = false;

	// Анализ узла, формирование вычисляемых опций
	this.analise();

	// Обработка значения
	this.prepareValue();
	
	// Отрисовка узла
	this.render();

	return this;
}

SM.obj.node.prototype = {
	render: function(){
		if(!this.body){
			return;
		}
		if(!this.name && !this.value){
			return;
		}

		// Основная (открывающая для объектов и массивов) строка узла
		this.markup = {
			cls: 'sm_node lv' + this.level, ref: 'node', data: {path: this.path},
			cn: []
		};
		
		// Свернуть/Развернуть блок
		if(this.typeC == 'mixed' && !this.root && !isEmpty(this.value) && this.childrenCount > 1){
			this.markup.cn.push({cn: '&#9660;', ref: 'opener', data: 'opener', cls: 'sm_node_opener'});
			this.expandable = true;
		}else{
			this.markup.cn.push({cn: '', st: 'width: 15px'}); 
		}
		
		// Отступ по уровню узла
		var w = this.level * 15;
		this.markup.cn.push({cn: '&nbsp;', ref: 'margin', st: 'width: ' + w + 'px;'});

		// Имя узла
		if(this.name || this.name === 0){
			var nameS = this.name + '';
			var nameCls = 'sm_node_name';
			if(isString(this.name)){
				nameS = '"' + this.name + '"';
			}else{
				nameCls+=' arrIndex';
			}
			this.markup.cn.push({cn: nameS, ref: 'name', cls: nameCls, data: 'sm_node_name'});
			this.markup.cn.push({cn: ':&nbsp;', ref: 'parser', cls: 'sm_node_name'});
			this.markup.cn.push({st:'width: 0; height: 0;', cn:[{cn: '&nbsp;', ref: 'menu', data: 'menu', cls: 'sm_node_menu', st:'display: none;'}]});
		}

		// Значение узла
		this.markup.cn.push({cn:this.valueS, ref: 'value', data: 'value', cls: 'sm_value ' + this.type});
		
		// Запятая для скалярных узлов после значения
		if(this.typeC == 'scalar' && !this.isLast){
			this.markup.cn.push({cn:',', ref: 'comma'});
		}

		// Блок вывода доп.информации по узлу
		if(isInteger(this.value) && this.value !== 0){
			var date = new Date(this.value);
			var dateL = new Date(this.value);
			date = SM.fn.toUTC(date);
			dateL = dateL.toLocaleString( 'ru', { timeZoneName: 'short' } );
			var info = SM.lang('node.date', 'Дата') + ' &#8594; ' + date.toLocaleString() + ' UTC' + '; ' + dateL;
			this.markup.cn.push({cn: info, ref: 'info', data: 'info', cls: 'sm_value_info', st:'display: none;'});
		}

		// Применяем шаблон
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		
		// Дети (рекурсия в SM.obj.node)
		var allRendered = true;
		if(this.typeC == 'mixed'){
			this.childs = [];
			R.each(this.value, function(item, name){
				if(this.root && !this.record.expanded && this.childs.length >= this.__maxRenderCount){
					allRendered = false;
					return;
				}

				var node = new SM.obj.node(this.body, {name: name, value: item}, this, this.record);
				this.childs.push(node);
			}, this);
		}

		// Закрытие блока
		if(allRendered && this.typeC == 'mixed'){
			this.markupClose = {
				cls: 'sm_node_close', ref: 'nodeClose', data: 'nodeClose',
				cn: [
					{cn: '&nbsp;', st: 'width: ' + (w + 15) + 'px;'},
					{cn: this.tags[1]}
				]
			};

			if(!this.isLast){
				this.markupClose.cn.push({cn:',', ref: 'commaClose'});
			}

			var tmpClose = new Resolute.Markup.Template({markup: this.markupClose});
			tmpClose.apply(this.body, this.items);
		}

		if(this.root){
			R.Msg.hideAll();
		}
	},
	analise: function(){
		// Анализ основных параметров узда по его данным
		this.type = null;
		this.typeC = 'scalar';
		this.tags = ['', ''];

		// Значение
		this.value = R.xp(this.data, 'value');
		this.valueS = this.value;

		// Имя узла
		this.name = R.xp(this.data, 'name');

		// Тип данных узла
		if(isObject(this.value)){
			this.type = 'object';
			this.typeC = 'mixed';
			this.tags = ['{', '}'];
		}
		else if(isArray(this.value)){
			this.type = 'array';
			this.typeC = 'mixed';
			this.tags = ['[', ']'];
		}
		else if(isBoolean(this.value)){
			this.type = 'boolean';
		}
		else if(isString(this.value)){
			this.type = 'string';
		}
		else if(this.value === null){
			this.type = 'null';
		}
		else {
			this.type = 'number';
		}

		// Выводимое значение
		if(this.typeC == 'mixed'){
			this.valueS = this.tags[0];
		}
		else if(this.type == 'string'){
			this.valueS = '"' + this.value + '"';
		}
		else{
			this.valueS = '' + this.value;
		}

		// Путь
		this.path = this.name;
		if(R.xp(this.parent, 'path')){
			this.path = this.parent.path + '.' + this.name;
		}

		// Уровень вложения
		this.level = this.path.split('.').length;
		if(!this.path){
			this.level = 0;
		}

		// Последний ли из детей родителя
		var parentData = R.xp(this.parent, 'data.value');
		this.isLast = false;
		if(!parentData || isEmpty(parentData)){
			this.isLast = true;
		}
		else{
			var n = 0;
			var l = 0;
			R.each(parentData, function(item, name){
				if(name === this.name){
					l = n;
				}
				n++;
			}, this);
			if((n - 1) == l){
				this.isLast = true;
			}
		}

		// Количество детей
		this.childrenCount = 0;
		if(this.type == 'object'){
			this.childrenCount = Object.keys(this.value).length;
		}
		else if(this.type == 'array'){
			this.childrenCount = this.value.length;
		}
	},
	prepareValue: function(){
		// обработка значения для вывода
		// Например, экранирование HTML-тэгов

		// ограничение длины стрового значения
		if(this.type == 'string'){
			if(this.valueS.length > 100){
				this.valueS = this.valueS.substr(0, 100) + '..."';	
			}
			
		}

		// Экранирование HTML
		if(this.type == 'string'){
			this.valueS = this.valueS.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	},
	hide: function(){
		// скрыть узел
		var el = R.xp(this.items, 'node');
		var elClose = R.xp(this.items, 'nodeClose');
		if(el){
			el.hide();
			if(elClose) elClose.hide();
		}

		// дети
		R.each(this.childs, function(child){
			child.hide();
		});
	},
	show: function(){
		// Показать узел
		var el = R.xp(this.items, 'node');
		var elClose = R.xp(this.items, 'nodeClose');
		if(el){
			el.show();
			if(elClose) elClose.show();
		}

		// дети
		R.each(this.childs, function(child){
			child.show();
		});
	},
	toggle: function(){
		// свернуть/развернуть узел
		var opener = R.xp(this.items, 'opener');
		
		if(!this.expandable || !opener){
			return;
		}
		
		if(this.expanded){
			R.each(this.childs, function(child){
				child.hide();
			});
			this.expanded = false;
			opener.setHtml('&#9658;');
		}else{
			R.each(this.childs, function(child){
				child.show();
			});
			this.expanded = true;
			opener.setHtml('&#9660;');
		}
	},
	toggleMenu: function(){
		// Скрыть-показать меню на узле
		var menuEl = R.xp(this.items, 'menu');
		var nameEl = R.xp(this.items, 'name');
		if(!menuEl || !nameEl){
			return;
		}

		var displayMenu = menuEl.getStyle('display');
		if(displayMenu == 'none'){
			this.hideMenusIcon();
			
			this.showEl('menu');
			nameEl.addClass('bold');
		}else{
			this.hideEl('menu');
			nameEl.removeClass('bold');
		}
	},
	toggleInfo: function(){
		// Скрыть-показать блок доп.информации на узле
		var infoEl = R.xp(this.items, 'info');
		if(!infoEl){
			return;
		}

		if(infoEl.getStyle('display') == 'none'){
			this.hideInfos();
			this.showEl('info');
		}else{
			this.hideEl('info');
		}
	},
	showEl: function(ref){
		// Показать элемент макета
		var el = R.xp(this.items, ref);
		if(el && el.show){
			el.show();
		}
	},
	hideEl: function(ref){
		// Показать элемент макета
		var el = R.xp(this.items, ref);
		if(el && el.show){
			el.hide();
		}
	},
	hideMenusIcon: function(){
		// скрыть убрать все отмеченные узлы с иконками контекстного меню
		var nodeEl = R.xp(this.items, 'node');
		var recEl = nodeEl.parent('.sm_record_content');
		R.select('.sm_node_name', recEl).removeClass('bold');
		R.select('.sm_node_menu', recEl).hide();
	},
	hideInfos: function(){
		// скрыть убрать все блоки доп. информации
		var nodeEl = R.xp(this.items, 'node');
		var recEl = nodeEl.parent('.sm_record_content');
		R.select('.sm_value_info', recEl).hide();
	},
	showMenu: function(){
		// Показать меню узла
		var menuEl = R.xp(this.items, 'menu');
		if(!menuEl){
			return;
		}

		// Состав меню
		var menu = [
			{code: 'update', name: SM.lang('node.menu.update', 'Редактировать значение')},
			'-',
			{code: 'query', name: SM.lang('node.menu.query', 'Построить запрос')},
			{code: 'queryAdd', name: SM.lang('node.menu.queryAdd', 'Добавить к запросу')},
			'-',
			{code: 'rename', name: SM.lang('node.menu.rename', 'Переименовать')},
			{code: 'remove', name: SM.lang('node.menu.remove', 'Удалить поле')},
			{code: 'clear', name: SM.lang('node.menu.clear', 'Очистить значение')},
			'-',
			{code: 'copyPath', name: SM.lang('node.menu.copyPath', 'Скопировать путь')},
			'-',
			{code: 'addIndex', name: SM.lang('node.menu.addIndex', 'Создать индекс')}
		];

		// Особое меню для MongoId
		if(inArray(this.name, ['_id', '$oid', '$id'])){
			menu = [{code: 'query', name: SM.lang('node.menu.query', 'Построить запрос')}];
		}

		// Инициализация меню
		Resolute.Pickers.show('Menu', {
			alignTo: menuEl,
			items: menu,
			callback: this.onMenuClick,
			scope:this
		});
	},
	onMenuClick: function(item){
		// Клик контекстного меню
		SM.modules.nodeActions.do(item.code, this.record, this);
	},
	openerMenu: function(){
		// меню элемента "свернуть/развернуть блок"
		var el = R.xp(this.items, 'opener');
		if(!el){
			return;
		}

		// Состав меню
		var menu = [
			{code: 'collaps', name: SM.lang('node.opener.collaps', 'Свернуть весь уровень')},
			{code: 'expand', name: SM.lang('node.opener.expand', 'Размернуть уровень')}
		];

		// Скрыть все существующие
		R.Pickers.hide();

		// Инициализация меню
		this.openerM = R.Pickers.show('Menu', {
			type: 'openerMenu',
			propagationParentClick: true,
			alignTo: el,
			offsets: [12, -5],
			items: menu,
			callback: this.onOpenerMenu,
			scope:this
		});
	},
	onOpenerMenu: function(item){
		// Обработка клика меню элемента "свернуть/развернуть блок"
		// Фактическая обработка происходит в объекте записи
		var code = R.xp(item, 'code');

		if(code == 'collaps'){
			this.record.collapsLevel(this.level);
		}
		else if(code == 'expand'){
			this.record.expandLevel(this.level);
		}
	}
};
