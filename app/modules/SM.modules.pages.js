// Модуль отображения навигатора по страницам результата запроса
SM.modules.pages = {
	init: function(body, parent, data){
		this.body = body;
		this.data = data;
		this.parent = parent;

		this.count = R.xp(data, 'count', 0);
		this.skip = R.xp(data, 'skip', 0);
		this.limit = R.xp(data, 'limit', 10);

		this.render();
	},
	render: function(){
		if(!this.body || !this.count){
			return;
		}

		var from = this.skip || '0';
		var to = this.skip + this.limit;

		if(to > this.count) {
			to = this.count;
		}

		var text = SM.lang('pages', 'Записи <b>{0} - {1}</b> из <b>{2}</b>');
		text = text.format(from, to, this.count);

		this.markup = {
			cls: 'sm_pages',
			cn: [
				{cls: 'sm_pages_btn', cn: '&laquo;', ref: 'start', data: {btn: 'start'}},
				{cls: 'sm_pages_btn', cn: '&#9668;', ref: 'down', data: {btn: 'down'}},
				{cls: 'sm_pages_text', cn: text},
				{cls: 'sm_pages_btn', cn: '&#9658;', ref: 'up', data: {btn: 'up'}},
				{cls: 'sm_pages_btn', cn: '&raquo;', ref: 'end', data: {btn: 'end'}}
			]
		};

		var tmp = new Resolute.Markup.Template({markup: this.markup});
		this.items = {};
		tmp.apply(this.body, this.items);

		this.setLinks();
	},
	setLinks: function(){
		// события на элементы формы
		R.each(this.items, function(el, code){
			var data = el.data();
			if(R.xp(data, 'btn')){
				el.on('click', function(){this.onBtnClick(data.btn)}, this);
			}
		}, this);
	},
	onBtnClick: function(btn){
		// обработка нажатия кнопок
		if(btn == 'up'){
			var skip = this.skip + this.limit;
			if(skip < this.count){
				this.parent.skip = skip;
				this.parent.query();
			}
		}

		if(btn == 'down' && this.skip > 0){
			var skip = this.skip - this.limit;
			if(skip < 0){
				skip = 0;
			}
			if(skip < this.count){
				this.parent.skip = skip;
				this.parent.query();
			}
		}

		if(btn == 'start' && this.skip > 0){
			this.parent.skip = 0;
			this.parent.query();
		}

		if(btn == 'end' && this.skip < (this.count - this.limit)){
			this.parent.skip = this.count - this.limit;
			this.parent.query();
		}
	}
};
