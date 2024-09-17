/*
	Resolute.ListView
	
	Компонент для отображения списочных элементов

	TODO:
		- Мультиселект
		- Перетаскивание элементов (реордер)
	
 */
Resolute.ListView = Resolute.extend(Resolute.Component,{
	itemMarkup:'{name}',
	itemCls:'item', // Класс css для идентификации элемента списка
	emptyDataTpl:{cn:'Нет данных для выбора!'},
	markup:{cls:'resolute-listview unselectable',a3:{tabIndex:'0'}}, // Разметка компонента
	selectedCls:'selected', // Класс css для выделенного элемента списка
	hoverCls:'hover', // Класс css для выделенного элемента списка
	selectable:true,
	multiselect:false,
	initComponent: function(){
		this.addEvents(
			'itemClick','itemInternalClick'
		);
		
		Resolute.ListView.superclass.initComponent.call(this);
		
		if(!this.query) this.query = {}; // Умолчальный фильтр данных, может быть сброшен или изменен 
		
		// Хранилище данных (коллекция)
		if(Resolute.isString(this.data)){
			// Строка - уникальный идентификатор коллекции данных в глобальном store
			// Если не найдено, будет новое пустое хранилище в глобальном store
			this.data = Resolute.Store.collection(this.data);
		} else if(Resolute.isArray(this.data)){
			// Передан массив данных. Делаем из него коллекцию.
			this.data = new Resolute.Data.Collection({items:this.data});
		};
		if(!(this.data instanceof Resolute.Data.Collection)){
			// Если нечто не понятное, делаем пустую коллекцию
			this.data = new Resolute.Data.Collection();
		};
		// Если снаружи в this.data пришел экземпляр класса Resolute.Data.Collection, то он будет использован как есть.
		
		// Слушаем изменения коллекции
		this.data.on({
			add:this.onDataAdded,
			update:this.onDataUpdated,
			remove:this.onDataRemoved,
			clear:this.onDataCleared,
			scope:this
		});
		// Шаблон одного элемента списка (для одного объекта в коллекции)
		this.itemTpl = Resolute.Markup.Template.create(this.itemTpl);
		if(!(this.itemTpl instanceof Resolute.Markup.Template)){
			// Умолчальный шаблон для code name
			this.itemTpl = new Resolute.Markup.Template({
				markup:{
					cls:this.itemCls,
					cn:this.itemMarkup || '{name}'
				}
			});
		};
		// Шаблоны дополнительных элементов
		this.prependTpl = Resolute.Markup.Template.create(this.prependTpl);
		this.appendTpl = Resolute.Markup.Template.create(this.appendTpl);
	},
	onClick:function(event,el){
		// Проверяем, есть ли отмеченные элементы внутри строки списка, клик по которым надо обрабатывать отдельно
		var elClicked = Resolute.get(el);
		var elClickedSub = elClicked.up('#'+this.id+' [data-click-code]');
		var itemEl = elClicked.up('.'+this.itemCls);
		if(elClickedSub){
			// Передаем управление на отдельные обработчики
			var data = this.data.get(itemEl.data('code'));
			this.fireEvent('itemInternalClick',this,elClickedSub,elClickedSub.getAttribute('data-click-code'),(data)?data.data:null);
			return;
		};
		if(itemEl){
			// Получаем данные, связанные с элементом списка
			var data = this.data.get(itemEl.data('code'));
			if(this.selectable){
				// Убираем стиль выделения с элементов (если не мультиселект)
				if(!this.multiselect) this.clearSelection();
				// Добавляем стиль выделения к текущему элементу
				if(this.multiselect){
					if(itemEl.hasClass(this.selectedCls)){
						itemEl.removeClass(this.selectedCls);
					} else {
						itemEl.addClass(this.selectedCls);
					}
				} else {
					itemEl.addClass(this.selectedCls);
				}
			};
			// Взводим событие клика на элементе
			this.fireEvent('itemClick',this,itemEl,(data)?data.data:null);
		} else {
			console.log('ListView error - no item element found on click');
		}
	},
	getItemEl:function(data){
		// Возвращает элемент по данным
		if(!data) return null;
		var key = data;
		if(Resolute.isObject(data)){
			if(!data.code) return null;
			key = data.code;
		};
		var elem = null;
		this.getEl().query('.'+this.itemCls,true).every(function(el){
			if(key == el.data('code')){
				elem = el;
				return false;
			};
			return true;
		});
		return elem;
	},
	select:function(data,keepExistingSelection,noScroll){
		// Выделить элемент по данным, связанным с ним (либо уникальный идентификатор, либо целиком объект с данными)
		if(Resolute.isArray(data)){
			this.clearSelection();
			Resolute.each(data,function(item){
				this.select(item,true,noScroll);
			},this);
			return;
		};
		var el = this.getItemEl(data);
		if(!el) return;
		if(!keepExistingSelection) this.clearSelection();
		el.addClass(this.selectedCls);
		var pos = el.getPosition();
		if(!noScroll) this.getEl('wrap').scroll({top:pos.top});
	},
	hoverMove:function(dir){
		// PRIVATE
		var hoverEl = this.getEl().query('.'+this.itemCls+'.'+this.hoverCls),
			direction = (dir==1)?'next':'prev';
		//if(hoverEl) hoverEl = this.getEl().query('.'+this.itemCls+'.'+this.selectedCls)
		if(hoverEl){
			var nextEl = hoverEl[direction]();
			if(nextEl){
				hoverEl.removeClass(this.hoverCls);
				nextEl.addClass(this.hoverCls);
			}
		} else {
			var nextEl = this.getEl().child();
			if(nextEl) nextEl.addClass(this.hoverCls);
		}
	},
	hoverFirst:function(){
		// PRIVATE
		var hoverEl = this.getEl().query('.'+this.itemCls+'.'+this.hoverCls);
		if(hoverEl) hoverEl.removeClass(this.hoverCls);
		var nextEl = this.getEl().first();
		if(nextEl) nextEl.addClass(this.hoverCls);
	},
	hoverLast:function(){
		// PRIVATE
		var hoverEl = this.getEl().query('.'+this.itemCls+'.'+this.hoverCls);
		if(hoverEl) hoverEl.removeClass(this.hoverCls);
		var nextEl = this.getEl().last();
		if(nextEl) nextEl.addClass(this.hoverCls);
	},
	clickHover:function(){
		// PRIVATE
		var hoverEl = this.getEl().query('.'+this.itemCls+'.'+this.hoverCls);
		if(!hoverEl) return null;
		this.onClick(null,hoverEl);
	},
	getSelection:function(returnEl){
		// Получение текущего выделенного элемента (данных, связанных с элементом)
		var res = [];
		var selEl = this.getEl().query('.'+this.selectedCls,true);
		if(!selEl || selEl.length==0) return null;
		if(returnEl && this.multiselect) return selEl;
		if(returnEl && !this.multiselect) return selEl[0];
		Resolute.each(selEl,function(item){
			var data = this.data.get(item.data('code'));
			if(data){
				res.push(this.clearInternalData(data.data));
			}
		},this);
		if(res.length==0 && !this.multiselect) return null;
		if(res.length==0 && this.multiselect) return [];
		if(this.multiselect) return res;
		if(!this.multiselect) return res[0]; 
	},
	getSelected:function(){
		return this.getSelection();
	},
	getSelectionCount:function(){
		var s = this.getSelection();
		if(!this.multiselect && s) return 1;
		if(this.multiselect && s && s.length) return s.length;
		return 0;
	},
	clearSelection:function(){
		// Снятие выделения
		Resolute.select('.'+this.itemCls+'.'+this.selectedCls,this.getEl()).removeClass(this.selectedCls);
	},
	clearItems:function(){
		// PRIVATE Очистка списка (визуальная)
		Resolute.select('.'+this.itemCls,this.getEl()).remove();
		Resolute.select('.empty',this.getEl()).remove();
		this.getEl().append({cls:'empty flex center fill',cn:this.emptyDataTpl},true);
	},
	clearInternalData:function(d){
		// PRIVATE
		var data = Resolute.clone(d);
		delete data['_rowNumber'];
		delete data['_rowPosition'];
		return data;
	},
	filter:function(query){
		// Фильтрация значений
		this.query = query || {};
		var selected = this.getSelection();
		this.clearItems();
		this.renderItems(this.query);
		if(selected) this.select(selected);
		return this;
	},
	clearFilter:function(){
		// Сброс фильтра значений
		this.filter({});
		return this;
	},
	sort2:function(cfg){
		// Сортировка значений
		this.sort = cfg || {};
		return this;
	},
	getFilteredData:function(filter){
		// PRIVATE Получение курсора с результатом отбора данных
		var query = Resolute.applyIf(filter || {},this.originalFilter || {});
		var res = this.data.find(query||{});
		if(this.sort){
			res.sort(this.sort,1);
		};
		return res;
	},
	renderItems:function(filter){
		// PRIVATE Отрисовка элементов списка
		var el = this.getEl();
		this.queryResult = this.getFilteredData(filter);
		this.queryResult.each(function(data,collection,query,index){
			data._rowNumber = this.queryResult.skipAmount+index+1;
			data._rowPosition = index+1;
			var elem = this.itemTpl.setData(data).apply(el);
			elem.data('code',data.code);
		},this);
		
		if(el.query('.empty')){
			el.query('.empty').remove();
		};
		
		if(this.queryResult.count()==0){
			// Если пусто, применяем разметку для этого случая
			el.append({cls:'empty flex center fill',cn:this.emptyDataTpl},true);
		}
		// Браузер сохраняет позицию скролинга даже после обновления страницы, поэтому делаем скрол вверх до упора
		this.getEl('wrap').scroll({top:0});
	},
	renderPrepend:function(){
		// PRIVATE Отрисовка дополнительных элементов до списка
		if(!this.prependTpl) return;
		this.prependTpl.apply(this.getEl());
	},
	renderAppend:function(){
		// PRIVATE Отрисовка дополнительных элементов после списка
		if(!this.appendTpl) return;
		this.appendTpl.apply(this.getEl());
	},
	onDataAdded:function(event){
		// При добавлении записи в коллекцию с данными
		if(!event) return;
		// Проверяем попадает ли новая запись под критерии отбора (если нет, то нет смысла её отрисовывать)
		if(Resolute.match(event.record.data,this.query)){
			// Если запись попадает под фильтрацию, то отрисовываем список. !!! Внимание !!! Придумать как не перерисовывать, а добавлять!
			// Проблема - определить позицию вставляемого элемента
			this.filter(this.query);
		}
	},
	onDataUpdated:function(event){
		// При изменении записи в коллекции с данными
		if(!event) return;
		// Проверяем попадает ли новая запись под критерии отбора (если нет, то нет смысла её обновлять)
		if(Resolute.match(event.record.data,this.query)){
			var el = this.getItemEl(event.record.data);
			if(el){
				var elem = this.itemTpl.setData(event.record.data).apply(this.getEl());
				elem.data('code',event.record.code);
				el.replaceWith(elem);
			}
		}
	},
	onDataRemoved:function(event){
		// При удалении записи из коллекции с данными
		if(!event) return;
		// Проверяем попадает ли новая запись под критерии отбора (если нет, то нет смысла её удялать)
		if(Resolute.match(event.record.data,this.query)){
			var el = this.getItemEl(event.record.data);
			if(el) el.remove();
		}
	},
	onDataCleared:function(){
		// При очистке коллекции с данными
		this.clearItems();
	},
	onRender: function(){
		// PRIVATE Отрисовка компонента
		Resolute.ListView.superclass.onRender.call(this);
		var el = this.getEl();
		if(this.height) el.setHeight(this.height);
		if(this.width) el.setWidth(this.width);
		
		this.renderPrepend();
		this.renderItems(this.query);
		this.renderAppend();
		//el.on('click',this.onClick,this);
		this.mon(el,'click',this.onClick,this);
		if(this.value) this.select(this.value);
	},
	getHeight:function(content){
		if(!this.rendered) return 0;
		if(content){
			var h = 0;
			Resolute.each(this.getEl().query('.'+this.itemCls,true),function(el){
				h += Resolute.get(el).getHeight();
			});
			return h;
		} else {
			return this.elements[this.resizeEl].getHeight();
		}
	}
});

Resolute.reg('listview', Resolute.ListView);