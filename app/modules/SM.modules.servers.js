// Модуль списка-выбора серверов
SM.modules.servers = {
	initmarkup: {
		cls: 'sm_dbases_main',
		cn: [
			{cls: 'sm_m_title sm_dbases_main_title', cn: SM.lang('servers.title', 'Список серверов')}
		]
	},
	init: function(){
		SM.data.servers = null;
		this.markup = R.clone(this.initmarkup);

		// Запрос на получение списка доступных серверов
		SM.request('getServerlist', {connect:false}, function(r){
			SM.data.servers = R.xp(r, 'data');
			this.render();
		}, this);
	},
	render: function(){
		// Отрисовка модуля
		this.body = R.xp(SM, 'view.items.right');
		if(!this.body){
			return;
		}
		this.body.setHtml('');

		// Список БД
		R.each(SM.data.servers, function(item, i){
			var m = {
				cls: 'sm_dbase_item',
				ref: 'server_' + i,
				data: i+'',
				cn: [
					{cls: 'sm_dbase_item_icon', t:'img', a:{width:32, height:32, src:'./images/fatcow/32x32/database_server.png'}},
					{cls: 'sm_dbase_item_name', cn: item.name}
				]
			};

			if(R.xp(item, 'data.version')){
				m.cn.push({cls: 'sm_dbase_item_info', cn: 'MongoDB ' + R.xp(item, 'data.version')});
			}
			if(R.xp(item, 'data.connect') === false){
				m.cn.push({ cls:'sm_dbase_item_info color-F00', cn: SM.lang('servers.001', 'Нет подключения')});
			}

			this.markup.cn.push(m);
		}, this);

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		// левый блок всегда скрываем
		var left = R.xp(SM, 'view.items.left');
		if(left){
			left.hide();
		}

		// Вешаем прослушивание кликов
		this.setLinks();
	},
	setLinks: function(){
		// вешаем выбор БД по клику: фиксация текущей БД, запрос списка коллекций, подгрузка модуля Коллекции
		R.each(this.items, function(el, code){
			el.on('click', function(){
				var index = el.data();
				this.setServer(index);
			}, this);
		}, this);
	},
	setServer: function(index){
		// установка сервера
		if(!index){
			index = 0;
		}

		// Текущие глобальные сервер/БД
		SM.data.server = index;
		SM.data.dbase = null;

		// установка сервера
		SM.request('setServer', {index:index, connect: false}, function(r){
			SM.modules.dbases.init();
		}, this);
	}
};
