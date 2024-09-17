// Объект отображения одной формы конфигурации этапа агрегации
SM.obj.aggStage = function(body, data, parent){
	this.body = body;
	this.data = data;
	this.parent = parent;

	// Данные обязательны
	if(!this.data){
		throw 'aggStage data is not defined!';
		return this;
	}

	// Отрисовка
	this.render();

	return this;
}

SM.obj.aggStage.prototype = {
	render: function(){
		if(!this.body){
			return;
		}

		// Атрибуты
		var name = R.xp(this.data, 'name');
		var link = this.parent._getLinkByStageName(name, 'url');
		var descPath = 'desc.' + SMlang.code || 'ru';
		var desc = R.xp(this.data, descPath);

		// Значение
		var value = R.xp(this.data, 'value');
		var valueTxt = html = JSON.stringify(value, null, '\t');

		// Активность
		var enabled = true;
		if(R.xp(this.data, 'enable') === false){
			enabled = false;
		}

		// Макет вывода
		this.markup = {
			cls: 'sm_aggregate_item', ref: 'aggregate_item',
			cn: [
				{
					cls: 'sm_aggregate_info',
					cn:[
						{
							cls: 'flex',
							cn: [
								{cls: 'sm_agg_type', cn: name, t: 'a', a: {href: link, target:'_blank'}},
								{
									rtype: 'checkbox',
									ref: 'enable',
									value: enabled,
									boxLabel: ''
								},
								{cn: 'delete', cls: 'sm_agg_delete material-icons', ref: 'delete'}
							]
						},
						{cn: desc}
					]
				},
				{
					cls: 'sm_aggregate_area',
					cn:[
						{
							rtype: 'textarea',
							cls: 'sm_field',
							ref: 'agg_query',
							value: valueTxt,
							grow: true,
							tab: true,
							codding: true,
							height: 60
						}
					]
				}
			]
		};
		
		// Применяем шаблон
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		this.el = R.xp(this.items, 'aggregate_item');

		// События
		this.setLinks();

		// Свойства
		this.enable(enabled);
	},
	setLinks: function(){
		// СОбытия на элементы
		var deleteEl = R.xp(this.items, 'delete');
		if(deleteEl){
			deleteEl.on('click', this.unset, this);
		}

		var enableEl = R.xp(this.cmps, 'enable');
		if(enableEl){
			enableEl.on('change', this.toggle, this);
		}

		var agg_query = R.xp(this.cmps, 'agg_query');
		if(agg_query){
			agg_query.on('change', this.change, this);
		}
	},
	unset: function(){
		// Удаление объекта этапа
		R.Msg.ask(SM.lang('aggregate.alerts.009', 'Удалить этап агрегации') + ' ' + R.xp(this.data, 'name') + ' ?', function(){
			this.parent.deleteStage(this.data.id, this);
			this.el.remove();
		}, this);
	},
	toggle: function(){
		// Изменение активности этапа
		var enabled = R.xp(this.data, 'enable');
		enabled = enabled?false:true;

		this.enable(enabled);

		if(enabled){
			this.change();
		}
	},
	enable: function(enabled){
		this.data.enable = enabled;
		this.parent.enableStage(this.data.id, enabled);

		var agg_query = R.xp(this.cmps, 'agg_query');

		if(enabled){
			agg_query.enable();
			this.el.removeClass('disabled');
		}else{
			agg_query.disable();
			this.el.addClass('disabled');
			this.el.removeClass('invalid');
		}
	},
	change: function(){
		this.el.removeClass('invalid');
		if(!this.validate()){
			this.el.addClass('invalid');
		}

		this.parent.updatePipeline();
	},
	isEnabled: function(){
		// Проверка активности этапа
		var enabled = R.xp(this.data, 'enable');

		return enabled;
	},
	validate: function(){
		// Валидность значения
		var agg_query = R.xp(this.cmps, 'agg_query');
		value = agg_query.getValue();

		if(!value){
			R.Notices.alert(SM.lang('aggregate.alerts.010', 'Пустое значения конфигурации этапа плана агрегации!'));
			return false;
		}

		value = SM.fn.toJSON(value);
		if(!value){
			R.Notices.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
			return false;
		}

		return true;
	},
	getValue: function(){
		// Получение текущего значения этапа
		if(!this.validate()){
			return null;
		}

		var agg_query = R.xp(this.cmps, 'agg_query');
		value = agg_query.getValue();
		value = SM.fn.toJSON(value);

		this.data.value = value;

		return this.data;
	}
};
