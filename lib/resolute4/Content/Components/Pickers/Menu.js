/**
	Пикер (всплывающий компонент) меню
	Пример:
	var menu = R.Pickers.show('Menu', {
		propagationParentClick: true, 	// при клике на "родителя" не прерывать событие
		keys: true,						// Включить опцию передвижения по пукнтам меню кнопками вверх/вниз и выбор кнопкой Enter
		alignTo: this.getEl(),			// Родительский элемент, к которому будет прорисовано меню
		items: [						// Пункты меню - объекты {code: code, name: 'Наименование'} служат напрямую, элементы STRING массива служат подзаголовками, элементы "-" - разделителями
			'Заголовок',
			{code:1, name: 'Пункт 1'},
			'-',
			{code:2, name: 'Пункт 3'}
		],
		callback: this.onSelect,		// Функция, которая будет вызвана при выборе пункта меню
		scope:this
	})
 */
Resolute.ns('Resolute.Pickers');
Resolute.Pickers.Menu = Resolute.extend(Resolute.Pickers.Base, {
	initComponent:function(){
		this.width = 'auto';
		this.markup = this.getMenuMarkup();
		this.ignoreItemsMarkup = true;
		Resolute.Pickers.Menu.superclass.initComponent.call(this);
	},
	getMenuMarkup:function(){
		// Формирование макета
		var res = [], 
			hasIcon = false,
			m = {
				cls:'picker menu unselectable',
				ref:'layer',
				cn:[]
			};
		Resolute.each(this.items,function(item,index){
			var itemMarkup = null;
			if(Resolute.isString(item) && item == '-'){
				itemMarkup = {
					cls:'separator'
				};
			} else if(Resolute.isString(item) && item != '-'){
				itemMarkup = {
					cls:'header',
					cn:item
				};
			} else {
				itemMarkup = {
					cls:'item',
					attr:{code:item.code||index},
					cn:{t:'span',cn:item.name}
				};
				if(item.icon){
					hasIcon = true;
					itemMarkup.cls += ' has-icon';
					itemMarkup.cn = [
						Resolute.jsml.icon(item.icon),
						{t:'span',cls:'name',cn:item.name}
					]
				};
				if(item.cls){
					itemMarkup.cls += ' '+item.cls;
				}
			};
			m.cn.push(itemMarkup);
		},this);
		if(hasIcon) m.cls += ' has-icon';
		return m;
	},
	onKey: function(e){
		// Обработка передвижения стрелками по пунктам меню и выбора клавишей Enter
		if(!this.keys){
			return;
		}
		var key = R.xp(e, 'keyCode');
		
		if(key == 40){
			this.selectNext('down');
		}
		else if(key == 38){
			this.selectNext('up');	
		}
		else if(key == 13){
			var el = R.select('.item.hover', this.getEl()).first();
			if(el){
				this.onClick({target: el.dom});
			}
		}
	},
	onHover: function(e){
		// При наведении мыши - логика стилей текущего элемента меню
		R.select('.item.hover', this.getEl()).removeClass('hover');

		var el = R.get(e.target).up('.item');
		if(el){
			el.addClass('hover');
		}
	},
	onOut: function(e, el){
		// При потере курсора мыши - логика стилей текущего элемента меню
		var el = R.get(e.target).up('.item');
		if(!el){
			R.select('.item.hover', this.getEl()).removeClass('hover');
		}
	},
	onClick:function(event){
		// По клику - выбор пункта меню и вызов функции callback
		var el = Resolute.get(event.target).up('.item');
		if(!el) return false;

		var menuItemCode = el.getAttribute('data-code');

		var menuItem = findIn(this.items, 'code', menuItemCode);
		if(menuItem === false && isInteger(menuItemCode)){
			menuItem = this.items[menuItemCode];
		}

		if(this.callback){
			this.callback.call(this.scope||this,menuItem);
		}
		
		return true;
	},
	selectNext: function(mode){
		// Приватно: обработка передвижения по клавишам вверх/вниз
		var elements = R.select('.item', this.getEl());
		if(isEmpty(elements) || !mode){
			return;
		}

		var i = 0;
		var s = null;
		elements.each(function(el){
			if(el.hasClass('hover')){
				s = i;
			}
			i++;
		});

		if(mode == 'up'){
			if(s !== null && s > 0){
				s--;
			}
		}
		else if(mode == 'down'){
			if(s === null){
				s = 0;
			}else{
				s++;
				if(s == elements.elements.length){
					s--;
				}
			}
		}

		if(isNumber(s)){
			R.select('.item.hover', this.getEl()).removeClass('hover');
			var el = R.get(elements.elements[s]);
			el.addClass('hover');
		}
	}
});