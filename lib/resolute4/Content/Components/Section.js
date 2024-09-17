/**
	Resolute.Forms.Section
	Секция с полями
	
	{
		rtype:'section',
		cls:'transparent',
		columns:[
			{width:0.6,labelWidth:190},
			{width:0.4,labelWidth:190,minWidth:320},
			{width:1,labelWidth:190}
		],
		items:[
			{
				rtype: 'combobox',
				label: 'Выпадающий список',
				emptyText:'Выберите значение...',
				name:'type',
				data:[
					{code:'1',name:'Значение 1'},
					{code:'2',name:'Значение 2'},
					{code:'3',name:'Значение 3'},
					{code:'4',name:'Значение 4 очень длинное длинное длинное'},
					{code:'5',name:'Значение 5'},
					{code:'6',name:'Значение 6'},
					{code:'7',name:'Значение 7'},
					{code:'8',name:'Значение 8'},
					{code:'9',name:'Значение 9'}
				]
			},{
				rtype: 'textfield',
				name:'name',
				mandatory:true,
				label: 'Текстовое поле 1',
				column:0
			},{
				rtype: 'textfield',
				name:'desc',
				label: 'Текстовое поле 2',
				column:0
			},{
				rtype: 'textfield',
				name:'data.txt1',
				label: 'Текстовое поле 3',
				column:0
			},{
				rtype: 'textfield',
				name:'data.txt2',
				label: 'Текстовое поле 4',
				column:1
			},{
				rtype: 'textfield',
				name:'data.txt3',
				label: 'Текстовое поле 5',
				column:1
			},{
				rtype: 'textfield',
				name:'data.txt4',
				label: 'Текстовое поле 6',
				column:2
			},{
				rtype: 'triggerfield',
				name:'data.txt5',
				label: 'Текстовое поле 7',
				buttons:[
					{code:'someBtn',icon:'keyboard_arrow_down'}
				],
				column:2,
			},{
				rtype: 'textfield',
				name:'data.txt6',
				label: 'Текстовое поле 8',
				column:2
			}
		]
	}
	
	TODO:
	- Заголовок секции (и helpText)
	- Кнопки в секции (?)
	
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.Section = Resolute.extend(Resolute.Сontainer, {
	wrap: true,
	cls: 'transparent',
	labelPosition: 'left',
	initComponent: function(){
		// Инициализация компонента
		this.addEvents('change');
		
		var cls = 'section section-body';
		if(this.cls) {
			this.cls += ' '+cls;
		} else {
			this.cls = cls;
		};
		
		// Если колонки не указаны, создаём одну
		if(!this.columns) this.columns = [{width:1,labelAlign:'right',labelWidth:this.labelWidth||90,labelPosition:this.labelPosition||'left',minWidth:190}];
		Resolute.each(this.columns,function(item){
			if(!item.minWidth){
				// Если не указана минимальная ширина колонки (при которой она будет перенесена на следующую строку и расширена), 
				// то принимаем её равной ширине подписи к полю, умноженной на два
				item.minWidth = item.labelWidth*2;
			}
		},this);
		
		// Инициируем резолвер для ширин колонок
		this.columnResolver = Resolute.adaptive.create('columns');
		this.columnResolver.add(this.columns);
		
		// Получаем разметку с колонками и полями в них
		this.items = this.initItems();
		
		Resolute.Forms.Section.superclass.initComponent.call(this);
	},
	initItems:function(){
		// Построение разметки, добавление колонок и элементов к ним
		// Вызывается при инициализации компонента, до отрисовки его на странице!
		var colCmp = [];
		Resolute.each(this.columns, function(column){
			if(!isObject(column) && isNumber(column)){
				column = {width: column};
			}

			if(!column.labelPosition){
				column.labelPosition = this.labelPosition || 'left';
			}
			var col = {
				rtype:'container',
				cls:'column form label-' + column.labelPosition,
				width:(column.width||1)*100+'%',
				defaults:{
					labelPosition: column.labelPosition,
					labelWidth: column.labelWidth||this.labelWidth||90
				},
				items:[]
			};
			if(column.markup) col.markup = column.markup;
			colCmp.push(col);
		},this);
		
		// Раскидываем элементы по колонкам
		var items = this.items || [];
		Resolute.each(items,function(fld){
			if(!fld.column) fld.column = 0; // Можно не указывать у поля ссылку на колонку (по умолчанию поле будет помещено в самую первую)
			var col = fld.column;
			if(fld.rtype){
				// Подписка на события изменения в полях
				fld.listeners = {change:this.onFieldChange,scope:this};
			} else if(fld.cls || fld.cn || fld.t){
				var m = Resolute.clone(fld);
				fld = {
					rtype:'component',
					wrap:false,
					markup:m,
					ref:m.ref,
					column:m.column
				}
			};
			if(colCmp[col]){
				// Добавляем поле в колонку
				colCmp[col].items.push(fld);
			};
		},this);
		
		return colCmp;
	},
	addColumn:function(cfg){
		if(!this.rendered) return null;
		
		// Добавление колонки
		this.columnResolver.add(cfg);
		return this.items.add({
			rtype:'container',
			cls:'column resolute-form',
			width:(cfg.width||1)*100+'%',
			layout: (cfg.markup)?null:'form',
			markup: cfg.markup || null,
			defaults:{
				labelWidth:cfg.labelWidth||90
			},
			items:[]
		});
	},
	removeColumn:function(index){
		// Удаление колонки TODO
	},
	getColumn:function(index){
		// Получение компонента колонки
		return this.items.get(index);
	},
	eachColumnField:function(colIndex,fn,scope){
		this.items.get(colIndex).items.each(fn,scope);
	},
	eachField:function(fn,scope){
		// Вызвать функцию для каждого поля
		this.items.each(function(colCmp,i){
			Resolute.each(colCmp.items.items,function(fld,index){
				if(fld.fieldContainer){
					if(fld.each) fld.each(fn,scope);
				} else {
					fn.call(scope||this,fld,index);
				}
			},this);
		},this);
	},
	findField:function(name){
		// Поиск поля
		var res = null;
		this.eachField(function(fld){
			if(Resolute.isObject(name)){
				// Объект с запросом
				if(Resolute.match(fld,name)) res = fld;
			} else if(Resolute.isString(name)){
				// Имя поля
				if(fld.name == name) res = fld;
			}
		},this);
		return res;
	},
	getColumnEl:function(index){
		// Получение элемента колонки по индексу
		return this.getEl('wrap').query('.column[data-index="'+index+'"]');
	},
	onRender: function(){
		// Отрисовка
		Resolute.Forms.Section.superclass.onRender.call(this);
		(function(){
			if(this.title)
				this.getEl('wrap').setAttribute('data-title',this.title);
			
			var sections = this.getEl('wrap').query('.column',true);
			Resolute.each(sections,function(el,index){
				el.setAttribute('data-index',index).data('index',index);
				if(this.columns[index] && this.columns[index].title){
					el.setAttribute('data-title',this.columns[index].title);
				}
			},this);
			var cnt = this.getEl('container');
			cnt.on('resize',this.onResize,this);
			this.onResize(cnt,{width:cnt.getWidth()});
		}).createDelegate(this).defer(1);// Разобраться в рассинхроне!
	},
	onResize:function(el,rect){
		// При изменении размера секции пересчитываем ширины колонок. Если ширина колонки меньше минимальной, то переносим но новую строку
		var res = this.columnResolver.resolve(rect.width);
		Resolute.each(res,function(item,index){
			var colEl = this.getColumnEl(index);
			if(colEl){
				colEl.dom.style.width = (100*item.rWidth)+'%';
			}
		},this);
	},
	onFieldChange:function(fld){
		// Изменение поля
		this.fireEvent('change',fld);
	},
	getErrors:function(){
		// Получить массив полей с ошибками (ссылка на поле и текст ошибки)
		var res = [];
		this.eachField(function(fld){
			if(fld.getError){
				var error = fld.getError();
				if(error){
					res.push({field:fld, error:error});
				}
			};
		},this);
		return (res.length>0)?res:null;
	},
	clearInvalid:function(){
		// Очистить сообщения об ошибках в полях
		this.eachField(function(fld){
			if(fld.clearInvalid){
				fld.clearInvalid();
			};
		},this);
	},
	validate:function(silent){
		// Запустить валидацию всех полей
		this.eachField(function(fld){
			if(fld.validate){
				fld.validate(silent);
			};
		},this);
	},
	isValid:function(){
		// Валидна ли секция
		var res = [];
		this.eachField(function(fld){
			if(fld.isValid){
				res.push((fld.isValid())?1:0);
			};
		},this);
		if(res.count(1)<res.length){
			return false;
		} else {
			return true;
		}
	}
});
Resolute.reg('section', Resolute.Forms.Section);