// Палгин для создания собственного скролла внутри элемента
Resolute.namespace('Resolute.Elements.Plugins');
Resolute.Elements.Plugins.Scroll = function(el,options){
	this.el = el; // Resolute.Element
	this.options = options;
	this.init();
};
Resolute.Elements.Plugins.Scroll.prototype = {
	init:function(){
		this.content = this.el.dom.firstElementChild;
		this.direction = window.getComputedStyle(this.el.dom).direction;
		
		this.wrapper = document.createElement('div');
		this.wrapper.setAttribute('class', 'ss-wrapper');
		
		this.contentEl = document.createElement('div');
		this.contentEl.setAttribute('class', 'ss-content');
		
		this.wrapper.appendChild(this.contentEl);
		
		while (this.el.dom.firstChild) {
			this.contentEl.appendChild(this.el.dom.firstChild);
		};
		this.el.dom.appendChild(this.wrapper);

		this.el.dom.insertAdjacentHTML('beforeend', Resolute.jsml.parse({cls:'ss-scroll'}));
		this.bar = this.el.dom.lastChild;
		
		this.dragDealer(this.bar, this);
		this.moveBar();
		
		window.addEventListener('resize', this.moveBar.createDelegate(this));
		this.contentEl.addEventListener('scroll', this.moveBar.createDelegate(this));
		this.contentEl.addEventListener('mouseenter', this.moveBar.createDelegate(this));
		this.el.dom.classList.add('ss-container');
		this.contentEl.scrollTop = 0;
		
		// el - contentEl
		// target - el.dom
	},
	dragDealer:function(el, context){
		var lastPageY;

		el.addEventListener('mousedown', function (e) {
			lastPageY = e.pageY;
			el.classList.add('ss-grabbed');
			document.body.classList.add('ss-grabbed');
			document.addEventListener('mousemove', drag);
			document.addEventListener('mouseup', stop);
			return false;
		});

		function drag(e) {
			var delta = e.pageY - lastPageY;
			lastPageY = e.pageY;
			window.requestAnimationFrame(function () {
				contResolute.contentEl.scrollTop += delta / contResolute.scrollRatio;
			});
		}

		function stop() {
			el.classList.remove('ss-grabbed');
			document.body.classList.remove('ss-grabbed');
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stop);
		}
	},
	moveBar:function (e) {
		if(!this.contentEl){
			return;
		};
		if(this.el.isMasked()){
			e.preventDefault();
			e.stopPropagation();
			return;
		};
		var totalHeight = this.contentEl.scrollHeight,
		ownHeight = this.contentEl.clientHeight,
		_this = this;

		this.scrollRatio = ownHeight / totalHeight;
		
		
		var isRtl = _this.direction === 'rtl';
		var right = isRtl ?
			(_this.el.dom.clientWidth - _this.bar.clientWidth + 14) :
			((_this.el.dom.clientWidth - _this.bar.clientWidth) * -1)+14;

		
		window.requestAnimationFrame(function () {
			if (_this.scrollRatio >= 1) {
				_this.bar.classList.add('ss-hidden')
			} else {
				var barHeight = Math.max(_this.scrollRatio * 100, 10)*_this.el.dom.clientHeight/100;
				var toppos = (_this.contentEl.scrollTop / (totalHeight-_this.el.dom.clientHeight)).lerp(0,_this.el.dom.clientHeight-barHeight);
				_this.bar.classList.remove('ss-hidden')
				_this.bar.style.cssText = 'height:' + barHeight + 'px; top:' + toppos + 'px;right:' + right + 'px;';
			}
		});
	},
	mask:function(){
		this.bar.classList.add('ss-hidden');
	},
	unmask:function(){
		this.bar.classList.remove('ss-hidden');
	},
	update:function(){
		this.init();
	},
	bindEl: function(){},
	unbindEl:function(){}
};