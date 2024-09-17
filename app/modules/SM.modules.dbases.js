// Модуль списка-выбора БД сервера
SM.modules.dbases = {
	initmarkup: {
		cls: 'sm_dbases_main',
		cn: [
			{cls: 'sm_m_title sm_dbases_main_title', cn: SM.lang('dbases.title', 'Базы данных')}
		]
	},
	init: function(){
		SM.data.dbases = null;
		this.totalSize = null;
		this.markup = R.clone(this.initmarkup);
		this.rendered = false;

		var server = R.xp(SM.data.servers, SM.data.server);
		var name = R.xp(server, 'name', '');
		var info = SM.lang('dbases.info', 'Сервер: {0}, версия MongoDB: {1}');
		var version = R.xp(server, 'data.version', '');

		info = info.format(name, version);

		this.markup.cn.push({
			cls: 'sm_dbases_server_title', cn: info
		});

		// Запрос на получение списка доступных БД
		SM.request('getDBlist', {}, function(r){
			if(!R.xp(r, 'data.ok')){
				R.Msg.alert(SM.lang('dbases.alerts.001', 'Ошибка получения списка БД'));
				return;
			}

			SM.data.dbases = R.xp(r, 'data.databases');
			this.totalSize = R.xp(r, 'data.totalSize');
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
		R.each(SM.data.dbases, function(item){
			this.markup.cn.push({
				cls: 'sm_dbase_item',
				ref: item.name,
				cn: [
					{cls: 'sm_dbase_item_icon', t:'img', a:{width:32, height:32, src:'./images/fatcow/32x32/database.png'}},
					{cls: 'sm_dbase_item_name', cn: item.name},
					{cls: 'sm_dbase_item_size', cn: SM.fn.sizeFormat(item.sizeOnDisk)}
				]
			});
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
		this.rendered = true;
	},
	setLinks: function(){
		// вешаем выбор БД по клику: фиксация текущей БД, запрос списка коллекций, подгрузка модуля Коллекции
		R.each(this.items, function(el, code){
			el.on('click', function(){
				SM.modules.dbase.init(code);
			});
		}, this);
	}
};
