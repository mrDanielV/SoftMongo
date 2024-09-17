/**
	Resolute.Forms.Combobox
	Комбобокс
	
	{
		rtype: 'combobox',
		label: 'Выпадающий список',
		emptyText:'Выберите значение...',
		data:[
			{code:'1',name:'Значение 1'},
			{code:'2',name:'Значение 2'},
			{code:'3',name:'Значение 3'},
			{code:'4',name:'Значение 4'},
			{code:'5',name:'Значение 5'},
			{code:'6',name:'Значение 6'},
			{code:'7',name:'Значение 7'},
			{code:'8',name:'Значение 8'},
			{code:'9',name:'Значение 9'}
		]
	}
	
	TODO:
	- Данные с сервера
	
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.Combobox = Resolute.extend(Resolute.Forms.TextField, {
	listItemMarkup: '{name}', // Умолчальная разметка для каждого отдельного элемента списка, если не передан listItemTpl
	listItemTpl: null,	// Либо можно указать шаблон разметки для каждого элемента списка
	emptyDataTpl: 'Нет данных для выбора!',	// Текст или разметка для отображения сообщения о том, что данных для отображения нет (пустой data либо фильтрация данных выдала пустоту)
	textSearch: false, // Можно искать значение через ввод части текста в textField
	searchPath: 'name', // Путь к данным для фильтрации в реальном времени по мере ввода
	remoteData: false,
	initComponent: function(){
		this.listHidden = true;
		this.noFocusing = false;
		this.buttons = [
			{code:'clear',icon:'mi-clear',hidden:true},
			{code:'list',icon:this.listButtonIcon||'mi-arrow_drop_down'}
		];
		this.cls += ' combobox';
		
		Resolute.Forms.Combobox.superclass.initComponent.call(this);
		// Инициализация событий
		this.addEvents(
			'showList','hideList'
		);
		// Установка данных - хранилище данных (коллекция)
		this.setData(this.data);
		
		if(!this.textValue) this.textValue = '{'+this.searchPath+'}';
		
		// Слушаем изменения коллекции
		this.data.on({
			add:function(){},
			update:function(){
				//console.log('update');
			},
			clear:function(){},
			scope:this
		});
		
		// Шаблон одной строки списка (для одного объекта в коллекции)
		this.listItemTpl = Resolute.Markup.Template.create(this.listItemTpl);
		if(!(this.listItemTpl instanceof Resolute.Markup.Template)){
			// Умолчальный шаблон для code name
			this.listItemTpl = new Resolute.Markup.Template({
				markup:{
					cls:'item',
					cn:this.listItemMarkup || '{name}'
				}
			});
		}
		
		// Шаблон обвязки списка
		if(Resolute.browser.isMobile || this.modal){
			// Если мобильная версия или если this.modal == true
			this.modalList = true;
			this.buttons[1].icon = this.listButtonIcon||'mi-more_horiz';
		} else {
			this.modalList = false;
			this.listWrapTpl = new Resolute.Markup.Template({
				markup:{
					cls:'combobox-layer'
				}
			});
		}
		if(this.filter){
			this.originalFilter = Resolute.clone(this.filter);
		}
		
		// Слушаем нажатия кнопок
		this.on('buttonclick', function(btn){
			if(btn.code == 'clear'){
				this.clear();
				this.hideList();
			};
			if(btn.code == 'list'){
				// Показать/скрыть список
				this.toggleList();
			};
			this.getEl('wrap').removeClass(this.focusClass);
		},this);

		if(!this.textSearch){
			this.setReadOnly(true);
		}
	},
	clear:function(){
		this.filter = {};
		delete this.listSelectedItem;
		Resolute.Forms.Combobox.superclass.clear.call(this);
	},
	onRender: function(){
		Resolute.Forms.Combobox.superclass.onRender.call(this);
		
		// Обработка ввода
		this.mon(this.getEl(), 'input', this.onInput, this);

		// На клик - открыть список
		this.mon(this.getEl(), 'click', this.toggleList, this);
	},
	getData: function(collection){
		// получить this.data, если передано TRUE, то в виде объекта Resolute.Data.Collection
		// иначе - в виде массива
		if(collection || !this.data){
			return this.data;
		}
		if(!(this.data instanceof Resolute.Data.Collection)){
			return this.data;
		}

		// вынимаем массив из Resolute.Data.Collection
		var dataItems = this.data.find({});
		var data = [];
		this.data.each(function(item){
			data.push(R.xp(item, 'data'));
		});

		return data;
	},
	setData: function(data){
		this.remoteData = false;
		
		// установка this.data (Resolute.Data.Collection)
		// Строка - уникальный идентификатор коллекции данных в глобальном store
		// Если не найдено, будет новое пустое хранилище в глобальном store
		if(Resolute.isString(data)){
			this.data = Resolute.Store.collection(data);
		}
		// Массив
		else if(Resolute.isArray(data)){
			this.data = new Resolute.Data.Collection({items:data});
		}
		else if(Resolute.isObject(data) && (data.url || data.params)){
			// Объект с параметрами соединения с сервером
			this.remoteData = true;
			this.remoteConfig = Resolute.clone(data);
			this.data = new Resolute.Data.Collection({items:[]});
		}

		// Если не удалось установить коллекцию, создаем пустую
		if(!(this.data instanceof Resolute.Data.Collection) && !this.remoteData){
			this.data = new Resolute.Data.Collection();
		}

		// Если уже есть текущее значение поля и его нет в this.data - очистить поле
		if(this.rendered && this.getValue()){
			var current = this.data.findOne(this.getValue());
			if(!current){
				this.clear();
			}
		}
	},
	updateData: function(data) {
		// обновление данных без переинициализации this.data
		// перерисовка при этом тоже происходит "налету" (если сделать this.showList после this.updateData) - магия!..
		if(!(this.data instanceof Resolute.Data.Collection)){
			this.setData(data);
		}

		this.data.setData(data);
	},
	onInput: function(event,el){
		// Срабатывает на любое изменение поля! Вставка из буфера обмена, вырезание ctrl+x и прочее
		if(this.textSearch && !this.internalSetText){
			var textInput = this.getEl().dom.value;
			var q = {};
			if(this.searchPath){
				q[this.searchPath] = {'$startsWith':textInput};
			} else {
				return;
			};
			this.filter = Resolute.applyIf(q,this.filter);
			if(!this.picker) this.showPicker();
			this.picker.view.filter(this.filter);
		}
	},
	beforeKey: function(e){
		// Открыть список на нажатие клавиши вниз/вверх, если список еще не открыт
		// На ESC - закрыть список
		var key = R.xp(e, 'keyCode');

		if(key == 38 || key == 40) {
			if(this.listHidden){
				this.showList();
			}
		}

		if(key == 27 && !this.listHidden){
			this.showList();
		}
	},
	postBlur: function(){
		// Если установлен фильтр по вводу, его нужно сбросить - он уже не актуален
		this.setFilter();
	},
	setFilter:function(filter){
		if(!filter){
			this.filter = this.originalFilter;
			return;
		}

		this.filter = Resolute.applyIf(filter,this.originalFilter || {});
	},
	getFilteredData:function(filter){
		if(!filter) filter = this.originalFilter;
		var query = Resolute.applyIf(filter || {},this.originalFilter || {});
		var res = this.data.find(query||{});
		if(this.sort){
			res.sort('name',1);
		}

		// res.limit|skip если надо
		return res;
	},
	setValue:function(v){
		Resolute.Forms.Combobox.superclass.setValue.apply(this, arguments);

		if(isArray(v)) {
			return;
		}
	
		// Поиск значения в this.data, если данные вообще установлены
		// (возможно, было бы лучше сделать опционально - н всегда, как показала практика, value обязано присутствовать в data)
		if(!isEmpty(this.data.getData())){
			var storeData = null;
			if(isObject(v) && !isEmpty(v.code)){
				// Нормальное значение в виде объекта
				storeData = this.data.getData(v.code, true);
			} else if(isScalar(v)) {
				// Код значения (строка или число с идентификатором)
				storeData = this.data.getData(v, true);
			}
			
			this.value = R.clone(storeData);
		}

		this.setText();

		// Если установлен фильтр по вводу, его нужно сбросить - он уже не актуален
		this.setFilter();

		this.onSetValue();
	},
	getValue: function(){
		return this.value || null;
	},
	setText: function(){
		if(!this.getEl() || !this.getEl().exists()) return;
		if(!this.value){
			this.getEl().dom.value = ''; 
			return;
		}
		
		this.internalSetText = true;
		var textValue = this.textValue || '{name}';
		this.getEl().dom.value = textValue.format(this.value);
		this.internalSetText = false;
	},
	toggleList:function(){
		if(this.listHidden){
			this.showList();
		} else {
			this.hideList();
		}
	},
	showListWindow:function(cmps){
		if(Resolute.WindowManager.get(this.id+'-window')){
			return;
		};
		this.listHidden = false;
		this.listWindow = null;
		this.listWindow = new Resolute.ListWindow({
			id:this.id+'-window',
			title:this.label,
			helpText:this.helpText || null,
			multiselect:this.multiselect||false,
			itemTpl: this.listItemTpl,
			initFullscreen:Resolute.screen.is('xxs'),
			search:true,
			value: this.value,		// Текущее значение 
			minCount:this.minCount || 0,
			maxCount:this.maxCount || 100000000,
			data:this.data,
			onSelect:this.onListSelect,
			onBeforeClose:function(){
				this.listHidden = true;
				this.noFocusing = true;
				this.getEl('main').dom.focus();
			},
			scope:this
		});
		return this.listWindow.getEl();
	},
	onListSelect:function(data){
		this.listHidden = true;
		this.setValue(data);
		this.fireEvent('change', this);
		this.getEl('wrap').removeClass(this.focusClass);
		this.validate();
	},
	showList:function(event){
		// Показать список
		if(!this.listHidden) return;
		if(event) event.stopPropagation();
		this.listHidden = false;
		if(this.modalList){
			this.showListWindow();
		} else {
			this.showPicker.defer(120,this);
		}
	},
	hideList:function(event){
		// Скрыть список (удаляем...а зачем его хранить??)
		if(this.listHidden) return;
		this.listHidden = true;

		delete this.queryResult;
		delete this.listSelectedItem;
		if(!this.modalList) this.hidePicker();
	},
	getList:function(){
		// Получить список как элемент
		return this.getEl('list');
	},
	isListHidden:function(){
		// Признак того, что список скрыт
		return this.listHidden;
	},
	showPicker:function(){
		// Вызов пикера по клику на иконку
		delete this.picker;
		
		// Инициализация пикера
		this.picker = Resolute.Pickers.show('List',{
			alignTo:this.getEl('field'), // Выравнивание по данному элементу (input) 
			offsets:[0,-1],	// Сдвиг выравнивания в пикселях (x,y)
			data:this.data,
			itemTpl:this.listItemTpl,
			query:this.filter,
			cls: this.listCls || '',
			value: this.value,	// Текущее значение 
			callback:this.onListSelect,	// Функция, которая будет вызвана при выборе строки (пикер сам закроется)
			onHide:function(){ // Функция, которая будет вызвана при закрытии пикера
				this.listHidden = true;
				this.noFocusing = true;
				this.getEl('main').dom.focus();
				delete this.picker;
			},
			scope:this
		});
	},
	hidePicker:function(){
		if(this.picker){
			this.picker.hide();
			this.picker = null;
		}
	},
	postBlurValidate:function(){
		// Валидация значения на соответствие данным
		// TODO
		if(this.textSearch){
			var rawText = this.getEl().dom.value;
			var d = this.data.getByField(this.searchPath || 'name' ,rawText);
			if(!d){
				this.clear();
			}
		};
		this.hideList();
		return true;
	}
});
Resolute.reg('combobox', Resolute.Forms.Combobox);