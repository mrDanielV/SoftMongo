/* 
Механизм подсказок (тултипы)
 
У любого элемента разметки можно добавить атрибут data-tooltip со строкой подсказки. 
	При наведении мыши на такой элемент система автоматически покажет его, при ухоже мыши с элемента система скроет подсказку.
	Варианты добавления тултипа в разметку:
	a) При указании jsml разметки: 
			{t:'span',cn:'...',attr:{tooltip:'Текст подсказки'}} 
			или так 
			{t:'span',cn:'...',a:{'data-tooltip':'Текст подсказки'}}
	б) Для добавления тултипа к существующему элементу: 
			Resolute.get('element-id').setAttribute('data-tooltip','текст подсказки')
			или кратко:
			Resolute.get('element-id').tooltip('текст подсказки')
			или внутри компонента:
			this.getEl().setAttribute('data-tooltip','текст подсказки');
			или всё тоже самое, но через метод Resolute.Element:
			this.getEl().tooltip('текст подсказки');
			
TODO:
	- Автозакрытие тултипа если он открыт дольше N секунд
	- Тултипы с возможностью закрытия пользователем (кнопка с крестиком в тултипе)
	- Сложная разметка внутри тултипа (таблицы, картинки и прочее)
 
*/

Resolute.ns('Resolute.Tooltips');

Resolute.Tooltips.offsets = [8,12];

Resolute.Tooltips.init = function(){
	Resolute.CSS.addStyle({
		name:'.tooltip',
		styles:{
			position: 'absolute',
			fontSize: '12px',
			backgroundColor: '#ffe37a',
			padding: '4px',
			maxWidth: '280px',
			boxSizing: 'border-box',
			border: '1px solid rgb(176, 131, 84)',
			borderRadius: '3px',
			boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.2)'
		}
	},'ResoluteTooltips');
	Resolute.CSS.addStyle({
		name:'.tooltip .header',
		styles:{
			fontSize: '12px',
			fontWeight:'bold'
		}
	},'ResoluteTooltips');
	window.addEventListener('mouseenter',Resolute.Tooltips.onMouseEnter,true);
	window.addEventListener('mousemove',Resolute.Tooltips.onMouseMove,true);
	window.addEventListener('mouseleave',Resolute.Tooltips.onMouseLeave,true);
};
Resolute.Tooltips.onMouseEnter = function(event){
	var node = Resolute.get(event.target);
	if(!node) return;
	var tt = node.getAttribute('data-tooltip');
	if(tt && tt != ''){
		if(tt.length <= 13 && Resolute.Tooltips.exists(tt)){
			var tooltipCfg = Resolute.Tooltips.get(tt);
			Resolute.Tooltips.show(node,{
				cn:tooltipCfg.cfg,
				top: event.clientY+window.scrollY,
				left: event.clientX+window.scrollX
			});
		} else {
			Resolute.Tooltips.show(node,{
				cn:node.getAttribute('data-tooltip'),
				cls:node.getAttribute('data-tooltip-cls')||'',
				top: event.clientY+window.scrollY,
				left: event.clientX+window.scrollX
			});
		}
	}
};
Resolute.Tooltips.onMouseMove = function(event){
	if(Resolute.Tooltips.isScheduledMouseMove) return;
	Resolute.Pickers.isScheduledMouseMove = true;
	requestAnimationFrame(function(){
		var node = Resolute.get(event.target);
		if(!node) return;
		if(node.hasAttribute('data-tooltip') || node.parent('[data-tooltip]')){
			if(Resolute.Tooltips.active && (Resolute.Tooltips.active.alignEl.dom == node.dom || Resolute.Tooltips.active.alignEl.contains(node))){
				var offsets = Resolute.Tooltips.offsets,
					pos = Resolute.Tooltips.reposition(Resolute.Tooltips.active.tooltipEl,[event.x+window.scrollX,event.y+window.scrollY],offsets);
				Resolute.Tooltips.active.tooltipEl.setRect({top:pos[1],left:pos[0]});
			};
		}
		Resolute.Pickers.isScheduledMouseMove = false;
	});
};
Resolute.Tooltips.reposition = function(el,coord,offsets){
	var offset = offsets || Resolute.Tooltips.offsets || [0,0],
		c = coord,
		w = el.getWidth(),
		h = el.getHeight(),
		res = [c[0]+offset[0],c[1]+offset[1]];
	
	if((res[0]+w)>=Resolute.getViewportWidth()){
		res[0] = res[0] - w;
	};
	if((res[1]+h)>=Resolute.getViewportHeight()){
		res[1] = res[1] - h;
	};
	return res;
};
Resolute.Tooltips.onMouseLeave = function(event){
	var node = Resolute.get(event.target);
	if(node.hasAttribute('data-tooltip')){
		Resolute.Tooltips.hide();
	};
};
Resolute.Tooltips.active = null;

Resolute.Tooltips.show = function(el,tip){
	if(tip == '' || tip == null) return;
	var cfg = {};
	if(Resolute.isObject(tip)) cfg = tip;
	if(Resolute.isString(tip)){
		cfg.cn = tip;
	};
	var offsets = Resolute.Tooltips.offsets;
	Resolute.Tooltips.active = null;
	Resolute.Tooltips.active = {alignEl:el};
	Resolute.Tooltips.active.tooltipEl = Resolute.getBody().append({t:'span',cn:cfg.text||cfg.cn,cls:'tooltip'+((cfg.cls)?' '+cfg.cls:'')},true);
	if(Resolute.isString(cfg.cls) && cfg.cls!=''){
		Resolute.Tooltips.active.tooltipEl.addClass(cfg.cls);
	};
	var pos = Resolute.Tooltips.reposition(Resolute.Tooltips.active.tooltipEl,[cfg.left+offsets[1],cfg.top+offsets[0]],offsets);
	Resolute.Tooltips.active.tooltipEl.setRect({top:pos[1],left:pos[0]}).setStyle('z-index',el.getZ()+1);
};
Resolute.Tooltips.hide = function(){
	if(Resolute.Tooltips.active){
		Resolute.Tooltips.active.tooltipEl.remove();
		Resolute.Tooltips.active = null;
	};
	// foreach Resolute.Tooltips.items if visible для закрываемых пользователем тултипов
};

// Методы для сложных тултипов (с разметкой, отличной от простого текста) - TODO
Resolute.Tooltips.items = {};
Resolute.Tooltips.reg = function(cfg,cls){
	var code = 't'+Resolute.hcode()
	Resolute.Tooltips.items[code] = {
		code:code,
		cfg:cfg,
		cls:cls
	};
	return code;
};
Resolute.Tooltips.unreg = function(code){
	if(Resolute.Tooltips.exists(code)){
		delete Resolute.Tooltips.items[code];
	}
};
Resolute.Tooltips.get = function(code){
	if(Resolute.Tooltips.exists(code)){
		return Resolute.Tooltips.items[code];
	};
	return null;
};
Resolute.Tooltips.exists = function(code){
	return Resolute.isDefined(Resolute.Tooltips.items[code]);
};

Resolute.Tooltips.message = function(title,msg,cls){
	return Resolute.Tooltips.reg([
		{cls:'header',cn:title},
		{cn:msg}
	],cls||null);
}


Resolute.Tooltip = Resolute.Tooltips.reg;

Resolute.Tooltips.init();