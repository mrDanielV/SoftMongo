/**
	Resolute.Grid
	Базовый компонент грид (таблица)

	Основные опции конфигурации:
		data: [] - массив объектов данных строк или экземпляр класса Resolute.Data.Collection
		columns: [] - массив объектов конфигурации колонок (см. ниже)
		height: 100 - высота таблицы в px
		sortBy: {} - сортировка записей таблицы, по умолчанию отключена (используется сортировка по индексу добавления записи), формат определения сотировки: {path: 1/-1, ...}
		query: {} - запрос фильтрации записей в коллекции data, по умолчанию отсутствует
		unselectable: true/false - игнорировать клик и двойной клик по строке (не выделять строку)

	Основные сервисные функции:
		mask() - заблокировать компонент
		unmask() - разблокировать компонент
		refresh() - обновить отрисовку данных 
		getData() - получить данные в виде массива объектов
		setData(data) - установить данные, data - массив объектов или экземпляр класса Resolute.Data.Collection
		clearData() - обнулить данные
		filter(query) - установить фильтр отбора данных (query) для отрисовки из общего множества записей (this.data)
		sort(path, dir) - сортировка строк, path - путь аргумента сортировки в объекте данных, dir - направление сортировки (1 - возр, -1 - убыв)
		clearSelection() - убрать выделение строки
		setSelection(recCode) - установить выделение строки по CODE записи
		getSelection(asInstance) - получить объект данных выделенной строки, asInstance - вернуть результат как ссылку первичного представления объекта строки в Resolute.Data.Collection
	
	Конфигурация колонок
		Формат объекта, описывающего колонку:
			'number', // Колонка с нумератором строк
			{ 
				name: 'Заголовок',
				path: 'путь в объекте данных',
				renderer: '' / ['', '', {}, ...] - строка или массив рендереров
				width: 100 - ширина колонки в px
			}

		Рендереры
			каждый (или единственный) рендерер может быть строкой (код рендерера) или объектом вида:
			{ code: 'код рендерера', params: { param1: 'v1', param2: 'v2', ... } }

			см. Content/Components/Grid/Renderers.js
			Полный список доступных рендереров: Resolute.Grid.renderers.getList()

	Пример конфигурации компонента
		{
			rtype:'grid',
			data:[	// Либо массив с объектами либо ссылка на экземпляр Data.Collection
				{code:1,number:'R7790-0002199912',client:'Иванов Иван Иванович',phone:'+7(999)123-4567',email:'test@gmail.com',beginDate:'12.12.2023 00:00:00',endDate:'11.12.2024 23:59:59',premium:15002.44},
				{code:2,number:'R7790-0009948828',client:'Сидоров Семен Семенович',phone:'+7(999)123-4567',email:'demo@yandex.ru',beginDate:'31.12.2023 00:00:00',endDate:'30.12.2024 23:59:59',premium:45123.89}
			],
			columns:[
				'number', // Колонка с нумератором строк
				{name:'Номер договора',path:'number',renderer:['center','blueTextBold','centerVertical'],width:170},	// Несколько рендереров
				{name:'Страхователь',path:'client',width:190},
				{name:'Дата начала',width:140,path:'beginDate'},
				{name:'Дата окончания',width:140,path:'endDate'},
				{name:'Страховая премия',path:'premium',width:132,renderer:{code:'money',params:{currency:'RUB'}}} // Передача параметров в рендерер (объект c code = коду рендерера) можно так же массив объектов, либо массив со строками в перемешку с объектами
			],
			height:280
		}

	CSS Стили элемента описаны в resolute4-grids.css 
 */
Resolute.namespace('Resolute.Grid');
Resolute.Grid = Resolute.extend(Resolute.Component, {
	data: [],
	columns: [],
	height: null,
	sortBy: {index: -1},
	query: {},
	unselectable: false,
	initComponent: function(){
		this.styleSheet = Resolute.hcode();
		// Хранилище данных (коллекция)
		this.data = Resolute.Data.create(this.data);
		this.data.on('update',this.onStoreUpdate,this);
		this.data.on('remove',this.onStoreUpdate,this);
		this.data.on('add',this.onStoreUpdate,this);
		this.data.on('load',this.onStoreLoad,this);
		this.data.on('beforeload',this.onStoreBeforeLoad,this);
		this.columns = new Resolute.Grid.Columns(this.columns,this);
		this.cls = 'resolute-grid bgcolor-fff field-border';
		this.markup = [
			{cls:'header unselectable',cn:this.getColumnsMarkup(),ref:'header'},
			{cls:'body unselectable',ref:'body'},
			{cls:'resizer-line unselectable resolute-hidden',cn:{cls:'line'},ref:'colResizerLine'}
		]; 
		this.allowColumnMove = false;
		this.allowColumnResize = true;
		Resolute.Grid.superclass.initComponent.call(this);
	},
	onStoreUpdate: function(changes){
		// Синхронизация изменений хранилища с отображением в интрефейсе
		if(changes.code == 'update'){
			var cellEl = this.getEl('body').query('.row[data-code="'+changes.record.code+'"] .cell[data-path="'+changes.path+'"]');
			if(cellEl) cellEl.update(''+changes.value);
		} else if(changes.code == 'remove'){
			var rowEl = this.getEl('body').query('.row[data-code="'+changes.record.code+'"]');
			if(rowEl) rowEl.remove();
		} else if(changes.code == 'add'){
			changes.record.set('_rowIndex',this.data.count()-1);
			this.rowTpl.setData(changes.record.data).apply(this.getEl('body'))
		};
		this.fireEvent('dataupdate',this,changes);
	},
	onStoreLoad: function(data){
		this.refresh();
		this.unmask()
	},
	onStoreBeforeLoad: function(data){
		this.mask();
	},
	mask: function(){
		this.getEl().mask();
	},
	unmask: function(){
		this.getEl().unmask();
	},
	getColumnsMarkup: function(){
		var res = [];
		this.columns.each(function(col,index){
			res.push(col.headerMarkup());
		},this);
		return res;
	},
	onRender: function(){
		Resolute.Grid.superclass.onRender.call(this);
		var colWidths = [];
		Resolute.each(this.getEl().query('.header .column',true),function(el){
			var colIndex = el.getAttribute('column'),
				col = this.columns.get(colIndex),
				colWidth = 0;
			if(col.width){
				colWidth = col.width;
			} else {
				colWidth = el.getWidth();
			};
			col.setEl(el);
			
			colWidths.push(colWidth);
			col.width = colWidth;
		},this);
		Resolute.each(colWidths,function(w,index){
			Resolute.CSS.addStyle({
				name:'#'+this.id+' .col-'+index,
				styles:{
					width:w+'px',
					order: index+1,
					flexShrink: 0
				}
			},this.styleSheet);
		},this);
		this.renderBody();
		this.syncSize();
		this.mon(this.getEl(),{
			mousedown:this.onMouseDown,
			mousemove:this.onMouseMove,
			mouseup:this.onMouseUp,
			contextmenu:this.onContextMenu,
			click:this.onClick,
			dblclick:this.onDblClick,
			keypress:this.onKeyPress,
			scope:this
		});
	},
	onContextMenu: function(event){
		event.preventDefault();
	},
	onKeyPress: function(event,node){
		var el = Resolute.get(node);
	},
	syncSize: function(){
		var headerHeight = this.getEl('header').getHeight(true),
			filtersHeight = this.getEl('filters').getHeight(true),
			toolbarHeight = this.getEl('toolbar').getHeight(true),
			contentWidth = Resolute.select('.column',this.getEl('header')).aggWidth();
			
		if(this.hasEl('filters')) this.getEl('filters').setStyle('top',headerHeight+'px');
		if(this.hasEl('toolbar')) this.getEl('toolbar').setStyle('top',headerHeight+filtersHeight+'px').setWidth(contentWidth+'px');
	},
	refresh: function(){
		// Перерисовать содержимое грида
		this.renderBody();
	},
	renderBody: function(){
		var bdy = this.getEl('body');
		bdy.dom.innerHTML = '';

		if(!this.sortBy) this.sortBy = {index:-1};
		if(!this.query) this.query = {};
		
		this.data.find(this.query).sort(this.sortBy).each(function(item,collection,queryResult,index){
			item.set('_rowIndex',index);
			item.set('_rowNumber',index+1);
			var rowTplCfg = {
				observe:false,
				markup:{
					cls:'row',
					attr:{
						code:'{code}',
						index:'{_rowIndex}'
					},
					cn:[]
				}
			};
			this.columns.each(function(col,index){
				rowTplCfg.markup.cn.push(col.cellMarkup(item));
			},this);
			var rowTpl = new Resolute.Markup.Template(rowTplCfg);
			rowTpl.setData(item.data).apply(bdy);
		},this,true);

		this.fireEvent('render', this);
	},
	getData: function(){
		return this.data.getData();
	},
	setData: function(data){
		if(isEmpty(data) || !data || isScalar(data)) {
			data = [];
		}
		if(!isArray(data) && !(data instanceof Resolute.Data.Collection)) {
			data = [data];
		}
		if(isArray(data)) {
			R.each(data, function(item, i){
				if(isScalar(item)) {
					data[i] = {};
				}
			});
			this.data = Resolute.Data.create(data);
		}

		this.refresh();
	},
	clearData: function(){
		this.setData();
	},
	filter: function(query){
		this.query = {};
		if(query){
			this.query = query;
		};
		this.refresh();
	},
	sort: function(path,dir){
		// Пересортировка строк грида по пути
		this.sortBy = null;
		if(Resolute.isString(path)){
			this.sortBy = {};
			this.sortBy[path] = dir || 1;
		} else if(Resolute.isObject(path)){
			this.sortBy = path;
		};
		this.refresh();
	},
	destroy: function(){
		Resolute.CSS.removeStyleSheet(this.styleSheet);
		Resolute.Grid.superclass.destroy.call(this);
	},
	onMouseDown: function(event){
		var el = Resolute.get(event.target);
		var xy = event.xy;
		if(el.matches('.column .resizer')){
			if(!this.allowColumnResize) return;
			// Начало растяжения колонки
			this.isColumnResizeStart = true;
			this.columnResizeStart = xy;
			var cmpRect = this.getEl().getRect();
			var scrollOffset = this.getEl().dom.scrollLeft;
			this.getEl('colResizerLine').show('resolute-hidden').setLeft(xy[0]-cmpRect.x-64-2+scrollOffset).setTop(0);
			var colEl = el.up('.column');
			this.columnResizeIndex = colEl.getAttribute('column');
		} else if(el.matches('.header .column') || el.matches('.header .column .cn')){
			if(!this.allowColumnMove) return;
			// Начало перетаскивания колонки
			this.isColumnReorderStart = true;
			var colEl = el.up('.column');
			this.columnReorderIndex = colEl.getAttribute('column');
			var col = this.columns.get(this.columnReorderIndex);
			this.columnReorderEl = Resolute.getBody().append({cls:'resolute-grid-column-ghost flex center',cn:col.name},true);
			this.columnReorderEl.setTop(xy[1]+8).setLeft(xy[0]+16).setWidth(colEl.getWidth()).setHeight(colEl.getHeight());
		}
	},
	onMouseMove: function(event){
		var xy = event.xy;
		if(this.isColumnResizeStart){
			if(this.isScheduledColumnResize) return;
			this.isScheduledColumnResize = true;
			requestAnimationFrame((function(){
				var cmpRect = this.getEl().getRect();
				var scrollOffset = this.getEl().dom.scrollLeft;
				this.getEl('colResizerLine').setLeft(xy[0]-cmpRect.x-64+scrollOffset).setTop(0);
				this.isScheduledColumnResize = false;
			}).createDelegate(this));
		} else if(this.isColumnReorderStart){
			if(this.isScheduledColumnReorder) return;
			this.isScheduledColumnReorder = true;
			requestAnimationFrame((function(){
				var node = Resolute.get(event.target);
				if(node.hasClass('resizer') && !node.hasClass('active')){
					node.addClass('active');
				};
				if(!node.hasClass('resizer')){
					Resolute.select('.resizer.active',this.getEl('header')).removeClass('active');
				};
				this.columnReorderEl.setTop(xy[1]+8).setLeft(xy[0]+16);
				this.isScheduledColumnReorder = false;
			}).createDelegate(this));
		} else {
			
		}
	},
	onMouseUp: function(event){
		var el = Resolute.get(event.target);
		if(this.isColumnResizeStart){
			var cmpRect = this.getEl().getRect();
			var newWidth = null;
			var col = this.columns.get(this.columnResizeIndex);
			if(col){
				newWidth = col.el.getWidth() + event.xy[0]-this.columnResizeStart[0];
			};
			if(newWidth>18){
				this.columns.get(this.columnResizeIndex).setWidth(newWidth);
			};
			this.isColumnResizeStart = false;
			this.columnResizeIndex = null;
			this.columnResizeStart = null;
			this.getEl('colResizerLine').hide('resolute-hidden');
		} else if(this.isColumnReorderStart){
			this.isColumnReorderStart = false;
			if(el.hasClass('resizer')){
				var newCol = el.up('.column').getAttribute('column');
				this.columns.get(this.columnReorderIndex).setOrder(this.columns.get(newCol).getOrder()+1);
			};
			this.columnReorderIndex = null;
			this.columnReorderEl.remove();
			this.columnReorderEl = null;
			Resolute.select('.resizer.active',this.getEl('header')).removeClass('active');
		};
	},
	onClick: function(event){
		if(this.unselectable) {
			return;
		}

		var el = Resolute.get(event.target);
		if(el.hasClass(['row','cell','cn','sub'])){
			this.clearSelection();
			el.up('.row').addClass('selected');
			el.focus();
			// Определить строку!
			this.fireEvent('rowclick',this);

			this.fireEvent('select',this);
		};
	},
	onDblClick: function(event){
		if(this.unselectable) {
			return;
		}
		
		var el = Resolute.get(event.target);
		if(el.hasClass(['row','cell','cn'])){
			var col = null, row = null;
			if(el.hasClass('cell')){
				col = parseInt(el.getClass('col-',true));
				row = parseInt(el.up('.row').getAttribute('data-index'));
			};
			this.fireEvent('rowdblclick', this, row, col);
		};
	},
	clearSelection: function(){
		Resolute.select('.row.selected',this.getEl('body')).removeClass('selected');
		this.fireEvent('unselect',this);
	},
	setSelection: function(recCode) {
		this.clearSelection();

		if(!recCode && recCode !== 0) {
			return;
		}

		var el = this.getEl('body').query('.row[data-code="' + recCode + '"]');
		if(el) {
			el.addClass('selected');
			el.focus();
			this.fireEvent('select',this);
		}
	},
	getSelection: function(asInstance){
		var selectedRowEls = this.getEl('body').query('.row.selected',true),
			res = [];
		Resolute.each(selectedRowEls,function(sel){
			var selIndex = parseInt(sel.getAttribute('data-index'));
			if(selIndex || selIndex === 0){
				var rec = this.data.getByIndex(selIndex);
				if(rec){
					if(asInstance){
						res.push(rec);
					} else {
						res.push(this.data.getData(rec.code));
					}
				}
			}
		},this);
		return (this.multiselect)?res:((res.length>0)?res[0]:null);
	}
});
Resolute.reg('grid', Resolute.Grid);