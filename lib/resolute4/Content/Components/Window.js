// Менеджер окон
Resolute.WindowManager = {
	items:{},
	z: 20000,
	wi: 0,
	active:null,
	init:function(){
		window.addEventListener('resize',Resolute.WindowManager.onBrowserResize.debounce(80));
		window.addEventListener('keyup',Resolute.WindowManager.onKeyPress);
	},
	register:function(win,type){
		Resolute.WindowManager.wi++;
		win.windowIndex = Resolute.WindowManager.wi;
		if(type){
			win.windowType = type;
		};
		Resolute.WindowManager.items[win.id] = win;
	},
	unregister:function(id,destroy){
		if(!Resolute.WindowManager.items[id]) return;
		var w = Resolute.WindowManager.items[id];
		if(w.id == Resolute.WindowManager.active){
			// Ищем предыдуший индекс окна и делаем его активным
			if(w.prevWindowId){
				Resolute.WindowManager.setActive(w.prevWindowId);
			};
		};
		if(destroy && Resolute.WindowManager.items[id].destroy){
			Resolute.WindowManager.items[id].destroy()
		};
		Resolute.WindowManager.items[id] = null;
		delete Resolute.WindowManager.items[id];
	},
	get:function(id){
		var w = Resolute.WindowManager.items[id];
		if(!w) return null;
		return w;
	},
	each:function(fn,scope){
		Resolute.each(Resolute.WindowManager.items,fn,scope||this);
	},
	isActive:function(id){
		var w = Resolute.WindowManager.items[id];
		if(!w) return false;
		if(w.id == Resolute.WindowManager.active) return true;
		return false;
	},
	getActive:function(){
		if(!Resolute.WindowManager.active) return null;
		return Resolute.WindowManager.items[Resolute.WindowManager.active] || null;
	},
	setActive:function(id){
		//console.log('active win',id);
		var w = Resolute.WindowManager.items[id];
		if(!w) return false;
		if(id != Resolute.WindowManager.active){
			Resolute.WindowManager.items[id].prevWindowId = Resolute.WindowManager.active;
			Resolute.WindowManager.setInactive(Resolute.WindowManager.active,true);
		};
		Resolute.WindowManager.active = id;
		w.getEl('mask').removeClass('inactive');
		Resolute.WindowManager.items[id].lastActivateDate = (new Date()).getTime();
	},
	setInactive:function(id,silent){
		//console.log('inactive win',id);
		if(!Resolute.WindowManager.active) return null;
		var w = Resolute.WindowManager.items[id];
		if(!w) return false;
		w.getEl('mask').addClass('inactive');
		if(w.prevWindowId && !silent){
			Resolute.WindowManager.setActive(w.prevWindowId);
		};
	},
	closeAll:function(){
		
	},
	onBrowserResize:function(event){
		// Изменение размера браузера
		Resolute.WindowManager.each(function(win){
			if(win && win.syncHeight){
				win.syncHeight();
			}
		});
	},
	onKeyPress:function(event){
		// Нажатия кнопок
		if(Resolute.Event.isKey(event,'escape')){
			// Закрытие активного окна
			var active = Resolute.WindowManager.getActive();
			if(active && !active.ignoreESC){
				active.close();
			}
		}
	}
};
Resolute.WindowManager.init();

// Общий класс для всех типов окон

Resolute.Window = Resolute.extend(Resolute.Сontainer, {
	wrap:false,
	modal:true,
	ignoreItemsMarkup:true,
	autoShow:false,	// Автоматический показ окна при иницииализации
	closeByMaskClick:false,	// Клик по маске закроет окно?
	hideAction: 'destroy', // destroy|hide
	resizeEl:'body',
	hideEl:'mask',
	itemsRenderTarget:'content',
	deferredRender:true,
	deferRenderEvent:false,
	initComponent:function(){
		this.isFullScreen = false;
		var mw = Math.round(Resolute.getViewportWidth()*0.8);
		if(!this.width){
			this.width = Math.min(480,mw);
		} else {
			if(this.width >= mw){
				this.width = mw;
			}
		};
		
		this.initMarkup = R.clone(this.markup);

		this.renderTo = Resolute.getBody();
		this.prepareMarkup();

		if(this.autoShow){
			this.deferredRender = false;
		};
		
		this.on('afterchildsrendered',this.onChildsRendered,this);
		
		Resolute.Window.superclass.initComponent.call(this);
		
		// Авторегистрация в менеджере окон
		Resolute.WindowManager.register(this);
	},
	prepareMarkup:function(){
		this.markup = {
			cls:'resolute-modal hidden unselectable '+(this.theme || '')+' '+(this.cls || ''),
			ref:'mask',
			cn:{
				id:this.id,
				cls:'resolute-modal-wrap',
				ref:'main',
				cn:{
					cls:'resolute-modal-body',
					ref:'body',
					cn:[]
				}
			}
		};
		if(this.cls){
			delete this.cls;
		};
		if(this.title){
			var tbtns = null,title = this.title;
			if(this.titleButtons){
				var btns = [];
				for(var i=0;i<this.titleButtons.length;i++){
					var cl = '', bcn = '',attr = {'data-code':this.titleButtons[i].code,tabindex:0};
					if(this.titleButtons[i].icon){
						cl += ' has-icon';
						bcn = Resolute.jsml.icon(this.titleButtons[i].icon);
					};
					if(this.titleButtons[i].tooltip){
						attr['data-tooltip'] = this.titleButtons[i].tooltip;
					};
					btns.push({cls:'button flex center'+cl,a:attr,cn:bcn});
				};
				tbtns = {cls:'buttons',cn:btns};
			};
			if(this.helpText){
				title = [this.title,{t:'span',cls:'helptext',cn:this.helpText}];
			};
			this.markup.cn.cn.cn.push({cls:'caption '+((this.icon)?'has-icon':''),ref:'caption',cn:[Resolute.jsml.icon(this.icon,'icon'),{t:'span',cls:'title',ref:'title',cn:title},tbtns]});
		};
		this.markup.cn.cn.cn.push({cls:'content',cn:this.initMarkup||'',ref:'content'});
		if(this.addElements && this.addElements.afterContent){
			this.markup.cn.cn.cn.push(this.addElements.afterContent);
		};
		if(this.buttons){
			var btns = [];
			for(var i=0;i<this.buttons.length;i++){
				var cl = '', bcn = {t:'span',cls:'title',cn:this.buttons[i].name} || '', attr = {'data-code':this.buttons[i].code,tabindex:0};
				if(this.buttons[i].primary) cl += ' primary';
				if(this.buttons[i].icon){
					cl += ' has-icon';
					bcn = [Resolute.jsml.icon(this.buttons[i].icon)];
					if(this.buttons[i].name){
						bcn.push({t:'span',cls:'title',cn:this.buttons[i].name});
					} else {
						cl += ' icon-only';
					}
				};
				if(this.buttons[i].tooltip){
					attr['data-tooltip'] = this.buttons[i].tooltip;
				};
				if(this.buttons[i].menu){
					attr['data-menu'] = 'menu'+Resolute.hcode();
					this[attr['data-menu']] = new Resolute.Pickers.Menu({
						deferredRender:true,
						items:this.buttons[i].menu
					});
				};
				btns.push({cls:'button flex center'+cl,a:attr,cn:bcn});
			};
			this.markup.cn.cn.cn.push({cls:'footer',ref:'footer',cn:[{cls:'info flex',ref:'info'},{cls:'buttons',cn:btns}]});
		};
	},
	onChildsRendered:function(){
		Resolute.WindowManager.setActive(this.id);
		
		this.mon(this.getEl('body'),'click',this.onClick,this);
		this.mon(this.getEl('mask'),'click',this.onMaskClick,this);
			this.syncHeight(true);
		(function(){
			this.getEl('mask').removeClass('hidden');
		}).defer(10,this);
		if(this.onAfterRender){
			this.onAfterRender();
		}
	},
	onMouseOver:function(event){
		var el = Resolute.get(event.target);
		var btn = el.up('.button');
		if(!btn.matches('.resolute-modal-body .footer .button')) return;
		var menu = btn.getAttribute('data-menu');
		if(!menu) return;
		if(!this[menu]) return;
		if(this.activeMenu && this.activeMenu == menu) return;
		Resolute.Tooltips.hide();
		this.activeMenu = menu;
		this[menu].alignTo = btn;
		this[menu].show();
	},
	onMaskClick:function(event){
		// Клик на маску
		var el = Resolute.get(event.target);
		if(!el.hasClass('resolute-modal')) return;
		if(this.closeByMaskClick) this.close();
	},
	onClick:function(event){
		// Клик по любому элементу внутри окна
		var el = Resolute.get(event.target),
			btn = el.up('.button'),
			ownButton = false;

		if(!btn || btn.hasClass('disabled')){
			return;
		}

		// Клик по какой то кнопке, определяем где она:
		Resolute.Tooltips.hide();
		var btnCode = btn.getAttribute('data-code');
		if(!btnCode) return;
		
		// Кнопка в заголовке
		if(btn.matches('.resolute-modal-body .caption .button')){
			ownButton = true;
			this.fireEvent('titleButtonClick',btnCode,btn,this);
			if(this.onTitleButtonClick && this.onTitleButtonClick(btnCode,btn)===false){
				// Вызываем кастомную функцию обработки клика. Если она вернёт false то не идём дальше
				return;
			};
			
		}
		// Кнопка внизу окна
		else if(btn.matches('.resolute-modal-body .footer .button')){
			ownButton = true;
			this.fireEvent('buttonClick',btnCode,btn,this);
			if(this.onButtonClick && this.onButtonClick.call(this,btnCode,btn)===false){
				return;
			}
		}
		
		if(ownButton){
			// Если кнопка принадлежит заголовку или футеру, то вызывем стандартные действия
			if(btnCode == 'close'){
				this.close();
			}

			if(btnCode == 'fullscreen'){
				if(this.isFullScreen)
					this.fullscreen(false)
				else this.fullscreen();
			}
		}
	},
	show:function(){
		Resolute.Tooltips.hide();
		Resolute.Pickers.hide();
		//Resolute.getBody().addClass('no-overflow');
		Resolute.Window.superclass.show.call(this);
		if(this.initFullscreen){
			this.fullscreen();
		};
		this.syncHeight();
		Resolute.WindowManager.setActive(this.id);
		(function(){
			this.el.focus();
		}).defer(150,this);
	},
	onRender:function(){
		Resolute.Tooltips.hide();
		Resolute.Pickers.hide();
		Resolute.getBody().addClass('no-overflow');
	},
	hide:function(){
		// Скрытие окна
		if(this.onBeforeClose && this.onBeforeClose.call(this.scope||this) === false) return; // Передаем обработку в кастомную функцию, если она явно вернёт false то не закрываем окно
		Resolute.Tooltips.hide();
		this.getEl('mask').addClass('hidden');
		(function(){
			if(this.hideAction == 'hide'){
				Resolute.Window.superclass.hide.call(this);
				Resolute.WindowManager.setInactive(this.id);
			} else {
				Resolute.WindowManager.unregister(this.id,true);
			};
			if(!Resolute.WindowManager.getActive()){
				Resolute.getBody().removeClass('no-overflow');
			}
		}).defer(150,this);
	},
	close:function(){
		this.hide();
	},
	fullscreen:function(state){
		// Развернуть окно на всё окно браузера (не полноэкранный режим!)
		var btn = this.getButton('fullscreen','caption');
		if(state !== false){
			this.isFullScreen = true;
			this.getEl('mask').addClass('full');
			if(btn){
				btn.tooltip('Свернуть в окно').child('.icon').update('fullscreen_exit');
			}
		} else if(state === false){
			this.isFullScreen = false;
			this.getEl('mask').removeClass('full');
			if(btn){
				btn.tooltip('На весь экран').child('.icon').update('fullscreen');
			};
			this.syncHeight();
		}
	},
	syncHeight:function(state){
		if(!this.items) return;
		if(this.isFullScreen) return;
		var el = this.getEl(),
			limit = 0.8,
			vh = Resolute.getViewHeight(),
			contentHeight = this.getHeight(true,true),
			ratio = contentHeight/vh,
			maxHeight = vh*limit,
			refs = ['caption','footer'];
		var elsHeight = this.getCompositeEl(refs).aggHeight();
		if(state !== false){
			if(Math.max(elsHeight+contentHeight,120) >= maxHeight){
				this.getEl('content').setHeight(vh*0.7-elsHeight);
			} else {
				// Место есть
				this.getEl('content').setHeight('auto');
			}
		} else {
			this.getEl('content').setHeight('auto');
		}
	},
	disable:function(opt){
		this.disabled = true;
		if(opt) opt.cls = 'transparent';
		this.getEl('body').mask(opt);
	},
	enable:function(){
		this.disabled = false;
		this.getEl('body').unmask();
	},
	setTitle: function(titleText){
		// Установка текста (или html) заголовка окна
		this.getEl('title').setHtml(titleText);
	},
	getButton:function(code, place){
		var p = place || 'footer'; // caption|footer
		var el = this.getEl(p);
		if(!el) return null;
		return el.query('.button[data-code="'+code+'"]');
	},
	disableButton:function(code, place){
		var btnEl = this.getButton(code, place);
		if(btnEl){
			btnEl.addClass('disabled');
		}
	},
	enableButton:function(code, place){
		var btnEl = this.getButton(code, place);
		if(btnEl){
			btnEl.removeClass('disabled');
		}
	},
	disableButtons: function(){
		this.el.queryAll('.button').each(function(el){
			if(el.getAttribute('data-code')){
				el.addClass('disabled');
			}
		}, this); 
	},
	enableButtons: function(){
		this.el.queryAll('.button').each(function(el){
			if(el.getAttribute('data-code')){
				el.removeClass('disabled');
			}
		}, this);
	},
	hideButton:function(code, place){
		var btnEl = this.getButton(code, place);
		if(btnEl){
			btnEl.hide();
		}
	},
	showButton:function(code, place){
		var btnEl = this.getButton(code, place);
		if(btnEl){
			btnEl.show();
		}
	}
});

Resolute.Window.create = function(cfg){
	return new Resolute.Window(cfg);
};