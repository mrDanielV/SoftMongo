Resolute.ListWindow = Resolute.extend(Resolute.Window, {
	titleButtons:[
		{code:'fullscreen',icon:'mi-fullscreen',tooltip:'На весь экран'},
		{code:'close',icon:'mi-close',tooltip:'Закрыть окно'}
	],
	buttons:[
		{code:'close',name:'Закрыть'},
		{code:'save',name:'Готово',primary:true}
	],
	recordsSelectForm:['Выбрана','Выбрано','Выбрано'],
	recordsForm:['запись','записи','записей'],
	recordsNoneForm:'одной',
	minCount:0,
	maxCount:100000000,
	autoShow:true,
	selectOnClick:true,
	multiselect:false,
	initComponent:function(){
		if(!this.itemTpl){
			this.itemTpl = {
				markup:{
					cls:'item flex center stretch',
					cn:[
						{cls:'flex-1 size-12 color-446688 pl-6',cn:'{name}'}
					]
				}
			};
		};
		this.items = [];
		if(this.search){
			this.items.push({
				cls:'search pb-6',
				ref:'search',
				cn:{
					rtype: 'textfield',
					wrapCls: 'wrap w-full',
					emptyText:'Поиск...',
					ref:'searchField',
					listeners:{
						'keyup':this.onFilterKeyup,
						scope:this
					}
				}
			});
		};
		this.items.push({
			rtype: 'listview',
			ref:'list',
			data:this.data,
			query: this.query,
			value: this.value,
			multiselect:this.multiselect,
			cls:'bgcolor-fff',
			itemTpl:this.itemTpl,
			listeners:{
				itemInternalClick:function(listview,el,clickCode,data){
					listview.select(data,false,true);
				},
				itemClick:function(cmp,el,data){
					this.syncSelection();
				},
				scope:this
			}
		});
		if(this.multiselect) this.selectOnClick = false;
		this.cls += ' listwindow';
		Resolute.ListWindow.superclass.initComponent.call(this);
	},
	onFilterKeyup:function(cmp){
		var list = this.getCmp('list'),
			searchTolerance = (this.search && this.search.tolerance)?this.search.tolerance:2,
			searchType = (this.search && this.search.type)?this.search.type:'like',
			searchFld = (this.search && this.search.field)?this.search.field:'name';
		if(list){
			var search = this.components.searchField.getValue();
			if(search && search.length>searchTolerance){
				if(this.search && this.search.query){
					this.search.query['$vars'] = {search:search};
					list.filter(this.search.query);
				} else {
					var q = {};
					q[searchField] = {};
					q[searchField]['$'+searchType] = search;
					 list.filter(q);
				}
			} else {
				list.filter();
			}
		}
	},
	onButtonClick:function(code,btnEl){
		if(code == 'save'){
			var selection = this.getCmp('list').getSelected();
			if(this.multiselect){
				var cnt = this.getCmp('list').getSelectionCount();
				if(cnt<this.minCount){
					this.showError('Необходимо выбрать минимум '+this.minCount.form(this.recordsForm)+'.<br/>Осталось выбрать еще '+(this.minCount-cnt).form(this.recordsForm)+'');
					return;
				};
				if(cnt>this.maxCount){
					this.showError('Можно выбрать максимум '+this.maxCount.form(this.recordsForm));
					return;
				};
			};
			if(this.onSelect){
				this.onSelect.call(this.scope||this,selection);
			};
			this.close();
		}
	},
	syncSelection:function(noClick){
		if(!noClick && !this.multiselect && this.selectOnClick){
			this.onButtonClick('save');
			return true;
		};
		if(this.getEl('info')){
			var selectedCount = this.getCmp('list').getSelectionCount();
			if(selectedCount>0){
				var msg = selectedCount.form(this.recordsSelectForm,true)+' '+selectedCount.form(this.recordsForm);
				if(this.minCount && (this.minCount-selectedCount>0)) msg += '<br/>Осталось выбрать еще '+(this.minCount-selectedCount).form(this.recordsForm)+'';
				if(this.maxCount < 100000000 && (selectedCount - this.maxCount>0)) msg += '<br/>Уберите '+(selectedCount - this.maxCount).form(this.recordsForm)+'';
				this.getEl('info').update(msg);
			} else {
				this.getEl('info').update('Не '+this.recordsSelectForm[1].toLowerCase()+' ни '+this.recordsNoneForm+' '+this.recordsForm[1]);
			}
		}
	},
	onAfterRender:function(){
		// Синхронизация выбранных значений
		this.syncSelection(true);
	},
	showError:function(msg,code){
		Resolute.Notices.warning(msg,'Внимание!')
	}
});