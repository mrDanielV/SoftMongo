// Объект отображения одной записи индекса
SM.obj.index = function(body, data, parent){
	this.body = body;
	this.data = data;
	this.parent = parent;

	// Данные индекса обязательны
	if(!this.data){
		throw 'Index data is not defined!';
		return this;
	}

	// Отрисовка узла
	this.render();

	return this;
}

SM.obj.index.prototype = {
	render: function(){
		if(!this.body){
			return;
		}

		// Значение индекса
		var keyStr = SM.fn.htmlJSON(R.xp(this.data, 'key'));

		// Уникальность
		var unique = null;
		if(R.xp(this.data, 'unique') || R.xp(this.data, 'spec.unique')){
			unique = SM.lang('indexes.info.uniq', 'УНИКАЛЬНЫЙ');
		}


		// Статистика
		var ops = R.xp(this.data, 'accesses.ops', '0') + '';
		var sinceDate = R.xp(this.data, 'accesses.since.milliseconds');
		var since = '';
		if(sinceDate && isString(sinceDate)){
			sinceDate = parseInt(sinceDate);
		}else{
			sinceDate = null;
		}
		since = SM.lang('indexes.info.since', 'с') + ' ' + (new Date(sinceDate)).toLocaleDateString();

		// Макет вывода
		this.markup = {
			cls: 'sm_index', ref: 'main', data: 'main',
			cn: [
				{cls: '', cn: [
					{ cls: 'sm_index_name', cn: R.xp(this.data, 'name') },
					{ cls: 'sm_index_unique', cn: unique },
					{ cls: 'sm_index_stats',cn: [
						{ cls: 'sm_index_ops', cn: SM.lang('indexes.info.stat', 'Обращений') + ': <b>' + ops + '</b>'},
						{ cls: 'sm_index_since', cn: since}
					]}
				]},
				{cls: 'sm_index_key', cn: keyStr}
			]
		};
		if(R.xp(this.data, 'name') != '_id_'){
			this.markup.cn.push({cls: 'sm_index_drop', cn: [{cls: 'sm_index_drop_a', cn:SM.lang('indexes.info.del', 'удалить'), ref: 'drop'}]});
		}
		
		// Применяем шаблон
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);


		// События
		this.setLinks();
	},
	setLinks: function(){
		var drop = R.xp(this.items, 'drop');
		if(drop){
			drop.on('click', this.onDropIndex, this);
		}
	},
	onDropIndex: function(){
		// начало процесса удаления индекса
		R.Msg.ask(SM.lang('indexes.alerts.003', 'Удалить индекс') + ' ' + R.xp(this.data, 'name') + '?', this.drop, this);
	},
	drop: function(){
		// удаление индекса
		var name = R.xp(this.data, 'name');
		SM.request('dropIndex', {name: name}, function(r){
			var msg = SM.lang('indexes.alerts.004', 'Индекс <b>{0}</b> удалён!');
			R.Notices.alert(msg.format(name));
			this.parent.getIndexes();
		}, this);
	}
};
