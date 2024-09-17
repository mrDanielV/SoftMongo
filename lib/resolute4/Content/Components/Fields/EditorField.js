Resolute.ns('Resolute.Forms');

Resolute.Forms.EditorField = Resolute.extend(Resolute.Forms.Field, {
	createWrap:true,
	clearOnPaste:true,
	clearHTML:false,
	initComponent: function(){
		this.buttons = [
			//{code:'fontColor',name:'Цвет шрифта',icon:'fatcow-font_colors',dropdown:'Color'},
			{code:'bold',name:'Жирный шрифт',icon:'fatcow-text_bold'},
			{code:'italic',name:'Курсив',icon:'fatcow-text_italic'},
			{code:'underline',name:'Подчеркнутый',icon:'fatcow-text_underline'},
			{code:'strikeThrough',name:'Перечеркнутый',icon:'fatcow-text_strikethroungh'},
			'-',
			{code:'justifyLeft',name:'Выравнивание по левому краю',icon:'fatcow-text_align_left'},
			{code:'justifyCenter',name:'Выравнивание по центру',icon:'fatcow-text_align_center'},
			{code:'justifyRight',name:'Выравнивание по правому краю',icon:'fatcow-text_align_right'},
			{code:'justifyFull',name:'Выравнивание по ширине',icon:'fatcow-text_align_justity'},
			'-',
			{code:'indent',name:'Увеличить отступ',icon:'fatcow-text_indent'},
			{code:'outdent',name:'Уменьшить отступ',icon:'fatcow-text_indent_remove'},
			'-',
			{code:'insertUnorderedList',name:'Список',icon:'fatcow-text_list_bullets'},
			{code:'insertOrderedList',name:'Нумерованный список',icon:'fatcow-text_list_numbers'},
			'-',
			{code:'subscript',name:'',icon:'fatcow-text_subscript'},
			{code:'superscript',name:'',icon:'fatcow-text_superscript'},
			'-',
			{code:'h1',name:'Заголовок 1',icon:'fatcow-text_heading_1'},
			{code:'h2',name:'Заголовок 2',icon:'fatcow-text_heading_2'},
			{code:'h3',name:'Заголовок 3',icon:'fatcow-text_heading_3'},
			'-',
			{code:'removeFormat',name:'Очистка форматирования',icon:'fatcow-clear_formatting'},
			{code:'undo',name:'Отмена',icon:'fatcow-undo'},
			{code:'redo',name:'Повтор',icon:'fatcow-redo'},
			'-',
			{code:'code',name:'Просмотр кода',icon:'fatcow-page_white_code'}
		];
		this.markup = {cls: 'resolute-editorfield',cn:[
			{cls:'toolbar',ref:'toolbar',cn:[]},
			{cls:'editor',a:{contenteditable:true,spellcheck:false},ref:'editor'},
			{t:'textarea',cls:'codeview',ref:'viewer'}
		]};
		Resolute.each(this.buttons,function(btn){
			if(btn == '-'){
				this.markup.cn[0].cn.push({cls:'separator'});
			} else {
				var mk = {
					cls:'button',
					attr:{code:btn.code},
					a:{},
					cn:[]
				};
				if(btn.name){
					mk.attr.tooltip = btn.name;
					mk.attr.name = btn.name;
				};
				if(btn.dropdown){
					mk.attr.dropdown = btn.dropdown;
				};
				if(btn.icon){
					mk.cn.push(Resolute.jsml.icon(btn.icon))
				} else {
					mk.cn.push(btn.name || '');
				};
				this.markup.cn[0].cn.push(mk);
			};
		},this);
		Resolute.Forms.EditorField.superclass.initComponent.call(this);
	},
	onRender: function(){
		Resolute.Forms.EditorField.superclass.onRender.call(this);
		this.mon(this.getEl('toolbar'),'click',this.onToolbarClick,this);
		this.mon(this.getEl('editor'),{
			drop:this.onDrop,
			paste:this.onPaste,
			selectstart:this.onSelectionStart,
			scope:this
		});
	},
	onToolbarClick:function(event,el){
		var elem = Resolute.get(el).up('.button');
		if(!elem) return;
		var action = elem.getAttribute('data-code');
		var dropdown = elem.getAttribute('data-dropdown');
		if(dropdown){
			var cfg = {alignTo:elem};
			if(dropdown == 'Menu'){
				cfg.items = [
					{code:'1',name:'Первый пункт меню',icon:'fatcow-16-anchor'},
					{code:'2',name:'Второй пункт меню'},
					{code:'3',name:'Третий пункт меню',icon:'email_add'},
					{code:'4',name:'Четвертый пункт меню',icon:'fatcow-16-cog'},
					{code:'5',name:'Пятый пункт меню'},
					'-',
					{code:'6',name:'Шестой пункт меню'}
				];
			};
			this.activePicker = new Resolute.Pickers[dropdown](cfg);
			this.activePicker.show();
			return true;
		};
		switch(action) {
			case 'code': this.toggleCodeView();
				break;
			case 'h1':
			case 'h2':
			case 'h3':
			case 'p':
				document.execCommand('formatBlock', false, action);
				break;
			default:
				document.execCommand(action, false, null);
				break;
		}
	},
	toggleCodeView:function(){
		if(this.getEl().hasClass('view')){
			this.hideCodeView();
		} else {
			this.showCodeView();
		};
	},
	showCodeView:function(){
		this.getEl('viewer').dom.value = this.getValue();
		this.getEl().addClass('view');
	},
	hideCodeView:function(){
		this.getEl('editor').dom.innerHTML = this.getEl('viewer').dom.value;
		this.getEl().removeClass('view');
	},
	onSelectionStart:function(event){
		
	},
	onDrop:function(event){
		event.preventDefault();
	},
	onPaste:function(event){
		/* (function(){
			this.getEl('editor').clear();
		}).createDelegate(this).defer(150); */
		if(!this.clearOnPaste) return true;
		event.preventDefault();
		var text = event.browserEvent.clipboardData.getData('text/plain');
		text = text.replace('\n','<br/>');
		document.execCommand('insertHTML', false, text);
	},
	getSelection:function(getParent){
		var selection = null;
		if (window.getSelection) {
			selection = window.getSelection();
		} else if (document.selection && document.selection.type != "Control") {
			selection = document.selection;
		};
		if(getParent){
			if(selection && selection.anchorNode){
				if(selection.anchorNode.parentNode.id == this.id){
					return selection.anchorNode;
				};
				return selection.anchorNode.parentNode;
			} else {
				return null;
			}
		};
		return selection;
	},
	getValue:function(){
		if(!this.rendered) return this.value;
		
		if(this.clearHTML) this.getEl('editor').clear();
		var v = this.getEl('editor').dom.innerHTML;
		
		return v;
	}
});
Resolute.reg('editorfield', Resolute.Forms.EditorField);
