// Модуль отображения данных EXPLAIN запроса
SM.modules.explain = {
	initmarkup: {
		cls: '',
		cn: []
	},
	init: function(body, data){
		this.markup = R.clone(this.initmarkup);

		this.body = body;
		this.data = data;

		this.render();
	},
	render: function(){
		// Отрисовка модуля
		if(!this.body){
			return;
		}
		this.body.setHtml('');

		// Разметка
		var markup = this.getMarkup();
		this.markup.cn.push(markup);

		// Применение к контейнеру
		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		this.cmps = {};
		tmp.apply(this.body, this.items, this.cmps);

		// Полный JSON данных
		var dataEl = R.xp(this.items, 'sm_explain_data');
		if(dataEl){
			var menu = [
				{code: 'edit', name: SM.lang('record.menu.json', 'JSON')},
				{code: 'expand', name: SM.lang('record.menu.expand', 'Развернуть')},
			];
			new SM.obj.record(dataEl, this.data, {menu:menu, contextmenu: false, mode: 'view'});
		}

		// Вешаем прослушивание кликов
		this.setLinks();
	},
	getMarkup: function(){
		// Разметка области общих показателей аналитики запроса
		var nDocs = R.xp(this.data, 'executionStats.nReturned');
		var exKeys = R.xp(this.data, 'executionStats.totalKeysExamined');
		var exDocs = R.xp(this.data, 'executionStats.totalDocsExamined');
		var msTime = R.xp(this.data, 'executionStats.executionTimeMillis');

		// Массив планов запроса
		var stage = R.xp(this.data, 'executionStats.executionStages');
		stages = this.getStages(stage);

		// План-победитель
		var winner = R.xp(this.data, 'queryPlanner.winningPlan.queryPlan.inputStage');
		if(!winner) {
			winner = R.xp(this.data, 'queryPlanner.winningPlan.inputStage');
		}

		// Наличие сортировки
		var sortStage = findIn(stages, 'type', 'SORT');
		var isSort = sortStage?SM.lang('explain.isSort.yes', 'ДА'):SM.lang('explain.isSort.no', 'нет');

		// Индексы (не работает на Mongo 7)
		/*var indexStages = filterIn(stages, 'type', 'IXSCAN');
		var indexes = [];
		var indexCns = [];
		R.each(indexStages, function(item){
			var stage = R.xp(this.data, 'executionStats.executionStages.' + item.path);
			var key = R.xp(stage, 'keyPattern');
			if(!key || !isObject(key) || isEmpty(key)){
				return;
			}
			indexes.push(key);


			R.each(key, function(v, name){
				var keyStr = name + ':' + v;
				indexCns.push({cls: 'sm_explain_index', cn: keyStr});
			}, this);
		}, this);
		if(isEmpty(indexCns)){
			indexCns = '-';
		}*/

		// Индексы победившего плана (работает на Mongo 3,5,7)
		var keys = R.xp(winner, 'keyPattern');
		var indexCns = [];
		if(!isEmpty(keys)) {
			R.each(keys, function(v, name){
				var keyStr = name + ':' + v;
				indexCns.push({cls: 'sm_explain_index', cn: keyStr});
			}, this);
		}
		if(isEmpty(indexCns)){
			indexCns = '-';
		}

		var markup = {
			cn: [
				{cls: 'sm_explain_summary', cn: [
					{cls: 'sm_m_title', cn: SM.lang('explain.title', 'Общие показатели запроса')},
					{cls:'sm_explain_sum_line flex', cn:[
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.nDocs', 'Документов по запросу')},
							{cls:'sm_explain_value', cn: nDocs + ''}
						]},
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.msTime', 'Время выполнения запроса, ms')},
							{cls:'sm_explain_value', cn: msTime + ''}
						]}
					]},
					{cls:'sm_explain_sum_line flex', cn:[
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.exDocs', 'Использовано документов')},
							{cls:'sm_explain_value', cn: exDocs + ''}
						]},
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.isSort.title', 'Сортировка в памяти')},
							{cls:'sm_explain_value', cn: isSort}
						]}
					]},
					{cls:'sm_explain_sum_line flex', cn:[
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.exKeys', 'Использовано ключей')},
							{cls:'sm_explain_value', cn: exKeys + ''}
						]},
						{cls:'sm_explain_sum_cell', cn: [
							{cls:'sm_explain_param', cn: SM.lang('explain.indexCns', 'Использованы индексы')},
							{cls:'sm_explain_value', cn: indexCns}
						]}
					]}
				]},
				{cls: 'sm_explain_data', ref: 'sm_explain_data', cn: ''}
			]
		};

		return markup;
	},
	setLinks: function(){
	},
	getStages: function(stage, path, stages){
		if(!isDefined(stages)){
			stages = [];
		}
		if(!isDefined(path)){
			path = '';
		}
		if(!stage || isEmpty(stage)){
			return stages;
		}

		var item = {
			type: R.xp(stage, 'stage'),
			path: path
		};
		stages.push(item);

		var inputStage = R.xp(stage, 'inputStage');

		if(inputStage){
			if(path){
				path = path + '.';
			}
			path+= 'inputStage';
			stages = this.getStages(inputStage, path, stages)
		}

		return stages;
	}
};
