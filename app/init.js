// Опеределение основного нэймспейса
SM = {
	title: 'Resolute SoftMongo',
	version: '1.5.1',
	fn: {},
	modules: {
		collection: {}
	},
	obj: {},
	data: {}
};

// Функция работы с языком системы: получение текста по разделу и коду
SM.lang = function(path, def) {
	if(!isDefined(def) || !isString(def)) {
		def = '';
	}

	if(!SMlang || isEmpty(SMlang) || !path) {
		return def;
	}

	return R.xp(SMlang, 'values.' + path, def);
}
SM.version = SM.lang('top.003') + ' ' + SM.version;

// Язык для констант Resolute
Resolute.Message.YESNO = [
	{code:'yes', name: SM.lang('yes', 'Да')},
	{code:'no', name: SM.lang('no', 'Нет')}
];

// Модуль отрисовки основного вьюпорта
SM.view = {
	markup: {
		cls: 'sm_main',
		cn: [
			{cls: 'sm_top', ref: 'top', cn: [
				{cls: 'sm_logo'},
				{cls: 'sm_title', cn: SM.title},
				{cls: 'sm_logout', ref: 'logout', cn: '', a:{'data-tooltip':SM.lang('top.004', 'Выход')}},
				{cls: 'sm_lang unselectable', ref: 'langSelect', cn: SMlang.code},
				{cls: 'sm_version', cn: SM.version}
			]},
			{cls: 'sm_content', ref: 'content', cn: [
				{cls: 'sm_left', cn: '', ref: 'left'},
				{cls: 'sm_right', cn: '', ref: 'right'}
			]}
		]
	},
	render: function(){
		this.body = R.getBody();

		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		var left = R.xp(SM, 'view.items.left');
		if(left){
			left.hide();
		}

		var logout = R.xp(this.items, 'logout');
		if(logout){
			logout.on('click', this.logout, this);
		}

		var langSelect = R.xp(this.items, 'langSelect');
		if(langSelect){
			langSelect.on('click', this.toggleLangs, this);
		}
	},
	logout: function(){
		// Выход
		R.request({
			url: 'operations/',
			params: {
				operation: 'Auth.logout'
			},
			disableSuccessCheck: true,
			onSuccess: function(r){
				window.document.location.reload();
			},
			scope: this
		});
	},
	toggleLangs: function() {
		// Список выбора языка интерфейса
		var langSelect = R.xp(this.items, 'langSelect');
		if(!langSelect){
			return;
		}

		this.langsMenu = Resolute.Pickers.show('Menu', {
			alignTo: langSelect,
			offsets: [-100, 0],
			items: SMlang.list,
			callback: this.onSelectLang,
			scope:this
		});
		if(this.langsMenu.getEl()){
			this.langsMenu.getEl().setStyle('min-width', '130px');
			this.langsMenu.getEl().setStyle('max-height', '200px');
			this.langsMenu.getEl().setStyle('overflow-y', 'auto');
			this.langsMenu.getEl().setStyle('box-shadow', '#666 1px 1px 5px -1px');
		}
	},
	onSelectLang: function(lang) {
		if(R.xp(SMlang, 'code') == R.xp(lang, 'code')) {
			return;
		}
		
		var w = R.Msg.wait();
		R.request({
			url: 'operations/',
			params: {
				operation: 'Lang.change',
				data: lang.code
			},
			onSuccess: function(r){
				if(w) w.close();
				window.document.location.reload();
			},
			onFailure: function(r){
				if(w) w.close();
				R.Msg.alert(r.msg);
			},
			scope: this
		});
	}
};

// Меню в top-контейнере
SM.topmenu = {
	markup: {
		cls: 'sm_menu_main',
		cn: []
	},
	render: function(){
		this.body = R.xp(SM, 'view.items.top');
		if(!this.body){
			return;
		}

		this.list = [
			{code: 'servers', name: SM.lang('top.001', 'Серверы'), icon: 'database_server', module: 'servers'},
			{code: 'dbases', name: SM.lang('top.002', 'Базы данных'), icon: 'database', module: 'dbases'},
			//{code: 'createDB', name: 'Создать БД', icon: 'database_add', module: 'createDB'}
		]

		R.each(this.list, function(item){
			var m = {cls: 'sm_menu_item sm_menu_item_top', ref:item.code, cn:[]};
			
			if(item.icon){
				m.cn.push({cls: 'sm_menu_item_icon', t:'img', a:{width:16, height:16, src:'./images/fatcow/16x16/' + item.icon + '.png'}});
			}

			m.cn.push({cls: 'sm_menu_item_name', cn: item.name});

			this.markup.cn.push(m);
		}, this);

		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		this.setLinks();
	},
	setLinks: function(){
		// вешаем подгрузку модулей для меню
		var container = R.xp(SM, 'view.items.right');
		if(!container){
			return;
		}

		R.each(this.items, function(el, code){
			var item = findIn(this.list, 'code', code);
			if(item && item.module && SM.modules[item.module]){
				el.on('click', function(){
					if(code != 'createDB'){
						container.setHtml('');
					}
					SM.modules[item.module].init();
				});
			}
		}, this);
	}
};

// Инициализация
SM.init = function(){
	SM.view.render();
	SM.topmenu.render();

	// Проверка сохраненных в куки сервера и БД
	SM.request('getCookie', {}, function(r){
		var server = R.xp(r, 'data.server');
		var dbase = R.xp(r, 'data.dbase');

		if(server === null){
			// Если сервер не был сохранен в куки, запрос на все подключенные сервера
			SM.getServers();
		}else{
			SM.data.server = server;

			// Если сервер в куки есть, и есть БД, то открываем сразу БД
			// Если БД не указано, то открываем форму выбора БД
			if(dbase){
				// Запрос на получение списка доступных БД
				// Асинхронно для ускорения процесса
				SM.request('getDBlist', {}, function(r){
					SM.data.dbases = R.xp(r, 'data.databases');
				}, this);

				// Открывам БД
				SM.modules.dbase.init(dbase);

				// Запрос на получение списка доступных серверов для сохранения списка в памяти
				// Асинхронно для ускорения процесса
				// По результату запроса имя Сервера устанавливается в соотв. элементе
				SM.request('getServerlist', {connect:false}, function(r){
					SM.data.servers = R.xp(r, 'data');
					SM.modules.dbase.setServer();
				}, this, true);
			}else{
				// Запрос на получение списка доступных серверов для сохранения списка в памяти 
				SM.request('getServerlist', {connect:false}, function(r){
					SM.data.servers = R.xp(r, 'data');
					SM.modules.dbases.init();
				}, this, true);
			}
		}
	}, this, null, function(r){
		SM.modules.servers.init();
	});

	// Пингер
	setInterval(SM.modules.pinger, 60000); 
}
SM.getServers = function(){
	// Запрос на список серверов
	// Если 1 сервер - открыть сразу список БД, иначе - открыть список серверов для выбора
	SM.data.dbase = null;
	
	SM.request('getServerlist', {}, function(r){
		var servers = R.xp(r, 'data');
		SM.data.servers = servers;
		if(!isEmpty(servers) && isArray(servers) && servers.length > 1){
			SM.modules.servers.init();
		}else{
			SM.data.server = 0;
			SM.modules.dbases.init();
		}
	}, this);
}