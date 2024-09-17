// Модуль вьюпорта выбранной БД - в левой части список-меню коллекций
// В правой части - стат. информация о БД
SM.modules.dbase = {
	init: function(code){
		if(!code){
			return;
		}
		SM.data.dbase = code;

		// Запрос на получение списка коллекций
		this.getCollections();
		this.rendered = false;
	},
	render: function(){
		// основная отрисовка областей

		// Левая часть
		this.renderCollectionsList();

		// Правая часть
		this.renderMain();
		this.rendered = true;
	},
	getCollections: function(updateOnly){
		// Запрос на получение списка коллекций
		// По результату - отрисовка областей модуля
		SM.data.collections = [];

		SM.request('getCollections', {}, function(r){
			SM.data.collections = R.xp(r, 'data');
				
				if(updateOnly){
					this.renderCollectionsList();
					return;
				}
				
				this.render();
		}, this, updateOnly);
	},
	renderCollectionsList: function(){
		// отрисовка области списка коллекций в левой части (вертикальный список)
		var container = R.xp(SM, 'view.items.left');
		if(!container){
			return;
		}

		// Сохранение значения фильтра при обновлении отрисовки левой части макета модуля
		var filter = '';
		var colflt = R.xp(this.cmps, 'colflt');
		if(colflt) {
			filter = colflt.getValue();
		}

		// Показать левую часть
		container.setHtml('');
		container.show();
		container.setResize(true,{sides:{e:true}});

		// Имя сервера
		var server = R.xp(SM.data.servers, SM.data.server);
		var serverName = R.xp(server, 'name', '').toUpperCase();

		// Макет
		var markup = {
			cls: 'sm_colls_main',
			cn: [
				{cls: 'sm_colls_server', ref: 'serverName', cn: serverName},
				{cls: 'sm_colls_dbase', cn: [
					{cls: 'sm_colls_dbase_name', cn: SM.data.dbase, ref:'dbase', data: 'dbaseName'},
					{cls: 'sm_colls_dbase_info', cn: ' ', ref:'dbase_info', data: {dbase: SM.data.dbase}}
				]},
				{cls: 'sm_colls_dbase_colcreate', cn: SM.lang('dbase.colcreate', 'создать коллекцию'), ref:'createCollection'},
				{cls: 'mr-15 ml-15 mt-5', st: 'clear: both;', cn:[
					{
						rtype: 'textfield',
						cls: 'sm_colflt',
						icon: 'filter_list',
						ref: 'colflt',
						value: filter
					}
				]},
				{cls: 'sm_colls_list', ref: 'sm_colls_list', cn: ''}
			]
		};

		// Отрисовка области
		var tmp = R.render(markup, container);
		this.items = tmp.refs;
		this.cmps = tmp.cmps;

		// Отрисовка списка коллекций
		this.setCollectionList();

		this.setLinks();
	},
	setCollectionList: function(){
		// Отрисовка списка коллекций
		var container = R.xp(this.items, 'sm_colls_list');
		if(!container){
			return;
		}

		container.setHtml('');

		// Фильтрация коллекций
		var filter = '';
		var colflt = R.xp(this.cmps, 'colflt');
		if(colflt){
			filter =  colflt.getValue();
		}

		// формирование элементов списка коллекций
		var list = [];
		R.each(SM.data.collections, function(item){
			var name = item.name;

			if(filter){
				var reg = new RegExp(filter, 'i');
				if(!reg.test(name)){
					return;
				}else{
					var matches = name.match(reg)
					name = name.split(matches).join('<b>'+matches+'</b>');
				}
			}

			var ref = item.name.split('.').join('-');

			var currentCls = '';
			if(item.name == SM.data.collection){
				currentCls = ' sm_colls_current_item';
			}

			list.push({cls: 'sm_colls_list_item ' + currentCls, ref: ref, data: {collection: item.name}, cn: [
				{cn: name},
				{cls: 'sm_colls_list_item_count', cn: '('+ item.count +')'}
			]});
		}, this);

		var tmp = new Resolute.Markup.Template({markup: list});
		tmp.apply(container, this.items, this.cmps);

		// Вешаем прослушивание кликов - на список коллекций
		var  els = R.select('.sm_colls_list_item').elements;
		R.each(els, function(eldom){
			var el = R.get(eldom);
			var colname = el.data('collection');
			if(el && el.on && colname){
				el.on('click', function(){
					this.setCollection(colname);
				}, this);
			}
		}, this);
	},
	updateCollectionsList: function(){
		// обновление данных и списка коллекций
		this.getCollections(true);
	},
	setCollection: function(colname) {
		// установка текущей коллекции
		if(!colname){
			return;
		}

		// инициация модуля работы с коллекцией (collectionMain)
		var right = R.xp(SM, 'view.items.right');
		right.setHtml('');
		SM.modules.collectionMain.init(colname);

		// Выделение стилем текущей коллекции в списке
		R.select('.sm_colls_list_item').removeClass('sm_colls_current_item');
		var ref = colname.split('.').join('-');
		var el = R.xp(this.items, ref);
		if(el){
			el.addClass('sm_colls_current_item');	
		}
	},
	unsetCollection: function(){
		SM.data.collection = null;
		R.select('.sm_colls_list_item').removeClass('sm_colls_current_item');
	},
	updateCollectionCount: function(name) {
		// Обновление "количества записей" у коллекции в списке коллекций
		if(!isDefined(name) && SM.data.collection) {
			name = SM.data.collection;
		}
		if(!name) {
			return;
		}

		var collectionEl = R.select('[data-ref="' + name + '"]').first();
		if(!collectionEl) {
			return;
		}

		var countEl = collectionEl.query('.sm_colls_list_item_count');
		if(!countEl) {
			return;
		}

		SM.request('statsCollection', {}, function(r){
			var count = R.xp(r, 'data.count');
			if(count || count === 0) {
				countEl.setHtml('(' + count + ')');
			}
		}, this, true);
	},
	setLinks: function(){
		var self = this;
		window.addEventListener('keyup', function(e) {self.onKey(e);});
		
		var container = R.xp(SM, 'view.items.right');
		if(!container){
			return;
		}

		// Ввод значения в поле фильтра коллекций
		var colflt = R.xp(this.cmps, 'colflt');
		if(colflt){
			colflt.on('keyup', this.onFilter, this);
			colflt.on('clear', this.onFilter, this);
		}

		// вешаем выбор БД по клику: фиксация текущей БД, запрос списка коллекций, подгрузка модуля Коллекции
		R.each(this.items, function(el, code){
			if(!el.on){
				return;
			}
			el.on('click', function(){
				var itemData = el.data();
				if(code == 'createCollection'){
					SM.modules.dbaseInfo.createCollectionWin();
				}
				else if(R.xp(itemData, 'dbase')){
					container.setHtml('');
					SM.modules.dbase.init(itemData.dbase);
				}
				else if(itemData == 'dbaseName'){
					this.toggleDBList();
				}
			}, this);
		}, this);
	},
	renderMain: function(){
		// отрисовка модуля статистики БД в основной части экрана
		var container = R.xp(SM, 'view.items.right');
		if(!container){
			return;
		}
		container.setHtml('');

		// Инфо о БД
		SM.modules.dbaseInfo.init();
	},
	setServer: function(){
		// Обновление имени сервера над списком коллекций
		var el = R.xp(this.items, 'serverName');
		if(!el){
			return;
		}
		
		var server = R.xp(SM.data.servers, SM.data.server);
		var serverName = R.xp(server, 'name', '').toUpperCase();

		el.setHtml(serverName);
	},
	onKey: function(e){
		// На ESC - закрыть окно контекстного меню
		if(e.keyCode == '27'){
			R.Pickers.hide();
		}
	},
	onFilter: function(){
		// фильтрация списка коллекций
		this.setCollectionList();
	},
	toggleDBList: function(){
		// показать список БД по клику на имя текущей БД
		var dbaseEl = R.xp(this.items, 'dbase');
		if(!dbaseEl){
			return;
		}

		this.dbListMenu = Resolute.Pickers.show('Menu', {
			alignTo: dbaseEl,
			items: SM.data.dbases,
			callback: this.onDBListClick,
			scope:this
		});
		if(this.dbListMenu.getEl()){
			this.dbListMenu.getEl().setStyle('min-width', '217px');
			this.dbListMenu.getEl().setStyle('max-height', '300px');
			this.dbListMenu.getEl().setStyle('overflow-y', 'auto');
		}
	},
	onDBListClick: function(db){
		// Изменение текущей БД на выбранную
		if(!R.xp(db, 'name')){
			return;
		}

		SM.modules.dbase.init(db.name);
	}
};
