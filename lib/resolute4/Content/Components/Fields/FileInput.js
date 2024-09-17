/**
	Resolute.Forms.FileInput
	Поле для указания файла на форме.
	Аналог HTML <input type="file">


	var file = new R.Forms.FileInput({renderTo: 'ext-comp-1012', exts: ['jpg', 'png'], maxSize: 5242880})

	Инициализация вне контекста:  
	var file = new R.Forms.FileInput({
		renderTo: '<id родителя, куда нужно прорисовать поле>',
		emptyText: 'Текст пустого поля', - по умолчанию = "Укажите файл"
		multiple: true/false, - режим мультизагрузки файлов
		exts: [<массив расширений>]/null - расширения файла, доступные к загрузке, расширения можно указывать в любом регистре,
		maxSize: максимально допустимый размер файл в байтах,
		disabled: true/false,
		hidden: true/false
	});

	CSS Стили элемента описаны в resolute4-form-fileinput.css 
 */
Resolute.ns('Resolute.Forms');
Resolute.Forms.FileInput = Resolute.extend(Resolute.Forms.Field, {
	emptyText: 'Укажите файл',
	multiple: false,
	errors: {
		mandatory: 'Обязательно для заполнения',
		extentionError: 'Допустимы только файлы с расширениями {0}',
		sizeError: 'Превышен максимально допустимый рамер файла/файлов {0} байт'
	},
	initComponent: function(){
		// Разметка элемента
		this.getMarkup();
		this.buttons = [{code:'clear',icon:'mi-clear',hidden:true}];

		// Вызов initComponent Resolute.Forms.Field
		Resolute.Forms.FileInput.superclass.initComponent.call(this);

		// Инициализация событий
		this.addEvents(
			'click','change'
		);
	},
	getMarkup: function(){
		// получение построения элемента
		var input = {t: 'input', a:{type:'file'}, ref:'fileInput', st:'display:none;'};
		if(this.multiple){
			input.a.multiple = true;
		}
		this.markup = [
			{t: 'input', cls: 'resolute-fieldinput', ref:'main', a: {readonly:true, placeholder: this.emptyText || ''}},
			input
		];
	
		return this.markup;
	},
	onRender: function(){
		// Инициализация элемента
		Resolute.Forms.FileInput.superclass.onRender.call(this);

		// Элементы поля
		this.fileInput = this.getEl('fileInput');
		this.el = this.getEl('main');

		// События на элементы поля
		this.mon(this.fileInput, 'change', this.onSelect, this);
		this.mon(this.el, 'click', this.onClick, this);

		this.onSelect(false);
	},
	onClick: function(event, el){
		// клик по элементу - обзор файла
		if(this.disabled || !this.fileInput){
			return;
		}

		this.fileInput.dom.click();
	},
	onSelect: function(change){
		// выбор (обзор) файлов
		this.clearInvalid();
		if(!isDefined(change)){
			change = true;
		}

		var names = this.getNames();
		var prev = this.el.dom.value;
		this.el.dom.value = names;
		this.toggleClear();

		if(change){
			this.fireEvent('change', this, names, prev);
		}
	},
	getValue: function(){
		// Значением считается текст в элементе
		// Фактическое значение (файл/файлы) получить невозможно
		var value = this.getNames();

		return value;
	},
	setValue: function(v){
		// Полю нельзя назначить опциональное значение программно
		// Но для присвоения пустого значения (удаления значения) использовать setValue можно
		if(v){
			this.toggleClear();
			return;
		}

		this.clear();

		this.onSetValue();
	},
	onButtonClick:function(btn){
		if(this.isDisabled()) return;
		
		if(btn.code == 'clear'){
			this.clear();
		}
		
		this.fireEvent('buttonclick', btn , this);
	},
	clear: function(){
		// удаление выбранного файла, если он есть
		if(!this.fileInput){
			return;
		}

		this.fileInput.dom.value = null;
		this.el.dom.value = '';
		this.clearInvalid();
		this.hideButton('clear');
	},
	getFiles: function(){
		// получение массива указанных в элементе файлов (JS instanceof File)
		this.files = [];
		var files = R.xp(this.fileInput, 'dom.files');
		
		if(!files || isEmpty(files)){
			return this.files;
		}

		var n = files.length;
		for (var i = 0; i < n; i++) {
			this.files.push(files[i]);
		}

		return this.files;
	},
	getFile: function(){
		// получение одного файла (0-го) из массива файлов
		// актуально при multiple = false
		this.file = null;
		this.getFiles();
		if(!isEmpty(this.files)){
			this.file = this.files[0];
		}

		return this.file;
	},
	getNames: function(){
		// получение имён указанных файлов
		this.getFiles();
		var names = [];

		R.each(this.files, function(file){
			names.push(file.name);
		}, this);

		if(isEmpty(names)){
			return '';
		}

		return names.join(', ');
	},
	getSize: function(){
		// получение суммарного размера всех указанных в поле файлов
		var size = 0;
		this.getFiles();
		if(isEmpty(this.files)){
			return 0;
		}

		R.each(this.files, function(file){
			var s = R.xp(file, 'size', 0);
			size+= s;
		});

		return size;
	},
	getExts: function(){
		// получение массива разширений указанных файлов
		var exts = [];

		this.getFiles();
		if(isEmpty(this.files)){
			return exts;
		}

		R.each(this.files, function(file){
			var ext = '';
			var name = R.xp(file, 'name');
			var parts = name.split('.');
			if(parts.length > 1){
				ext = parts[parts.length - 1];
			}
			exts.push(ext);
		});

		return exts;
	},
	validateSize: function(){
		// проверка на превыщение заданного максимального общего размера файлов
		if(!this.maxSize){
			return true;
		}

		var size = this.getSize();
		if(!size){
			return true;	
		}

		if(size > this.maxSize){
			return false;
		}

		return true;
	},
	validateExts: function(){
		// проверка контроля допустимых расщирений файлов
		if(!this.exts || !isArray(this.exts) || isEmpty(this.exts)){
			return true;
		}

		var exts = this.getExts();
		if(!exts || !isArray(exts) || isEmpty(exts)){
			return true;
		}

		var badExt = true;
		R.each(this.exts, function(extOK){
			R.each(exts, function(ext){
				if(ext==extOK || ext==extOK.toUpperCase()){
					badExt = false;
				}
			});
		});

		return !badExt;
	},
	isValid: function(){
		// Валидация значения поля. не воздействует на поле, только возвращает TRUE/FALSE
		// Служит составной частью для Resolute.Forms.Field.validate()
		
		// Базовая валидация - у компонента-предка (Field)
		var baseValid = Resolute.Forms.FileInput.superclass.isValid.call(this);
		if(!baseValid){
			return baseValid;
		}

		// Допустимые расширения файлов
		if(!this.validateExts()){
			this.errorCode = 'extentionError';
			this.errorsList.extentionError = this.getErrorTmp('extentionError').format(this.exts.join(', '));
			return false;
		}

		// Максимальный размер файлов
		if(!this.validateSize()){
			this.errorCode = 'sizeError';
			this.errorsList.sizeError = this.getErrorTmp('sizeError').format(this.maxSize);
			return false;
		}

		return true;
	}
});
Resolute.reg('fileinput', Resolute.Forms.FileInput);