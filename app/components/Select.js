/**
	Расширение компонента Resolute.Forms.TextField
	Текстовое поле с контекстным поиском в заданном массиве вариантов
	Собственные опции:
	 - data - массив вариантов для выбора, элементы могут быть строками или объектами вида {code, name}
	 - maxCount - максимальное количество показываемых вариантов в списке
 */
Resolute.ns('Resolute.Forms.SM');
Resolute.Forms.SM.Select = Resolute.extend(Resolute.Forms.TextField, {
	maxCount: 10,
	initComponent: function(){
		Resolute.Forms.SM.Select.superclass.initComponent.call(this);

		// Установка данных - хранилище данных (коллекция)
		this.setData(this.data);
	},
	setData: function(data){
		this.data = [];

		if(data && isArray(data) && !isEmpty(data)){
			R.each(data, function(item, i){
				if(isScalar(item)){
					item = {code: i, name: item};
				}
				this.data.push(item);
			}, this);
		}

		return this.data;
	},
	getData: function(){
		return this.data;
	},
	afterKey: function(e){
		Resolute.Forms.SM.Select.superclass.afterKey.call(this);
		
		if(!R.Event.isKey(e, ['down', 'up', 'enter'])){
			this.listUpdate();
		}
		if(R.Event.isKey(e, ['enter']) && this.list){
			this.list.hide.defer(100, this.list);
		}
	},
	preFocus: function(){
		this.listUpdate.defer(100, this);
	},
	onBlur: function(){
		Resolute.Forms.SM.Select.superclass.onBlur.call(this);

		if(this.list){
			this.list.hide.defer(100, this.list);
		}
	},
	listUpdate: function(){
		var text = this.getText();

		if(this.list){
			this.list.hide();
		}

		var items = this.filterList();
		if(isEmpty(items)){
			return;
		}

		this.list = R.Pickers.show('Menu', {
			propagationParentClick: true,
			keys: true,
			cls: 'sm-select',
			alignTo: this.getEl(),
			autoWidth: true,
			offsets: [-5, 0],
			items: items,
			callback: this.onSelect,
			scope:this
		});
		if(this.list.getEl()){
			this.list.getEl().setStyle('min-width', '200px');
			this.list.getEl().setStyle('max-height', '300px');
			this.list.getEl().setStyle('overflow-y', 'auto');
		}
	},
	onSelect: function(item){
		var v = R.xp(item, 'name');
		if(v){
			this.setValue(v);
			this.list.hide();
		}
	},
	filterList: function(){
		var text = this.getText();
		var items = [];

		if(!this.data || isEmpty(this.data) || !text){
			return items;
		}

		R.each(this.data, function(item){
			var v = R.xp(item, 'name');
			if(!v || !isScalar(v)){
				return;
			}
			if(items.length >= this.maxCount){
				return;
			}

			if(v.indexOf(text) !== -1){
				items.push(item);
			}
		}, this);

		return items;
	}
});
Resolute.reg('sm-select', Resolute.Forms.SM.Select);