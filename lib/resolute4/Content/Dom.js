/*#
Получение элемента DOM модели по его идентификатору
Возвращает Resolute.Element
#*/
Resolute.get = function(el){
	var elem = document.getElementById(el);
	// TODO: проверить в кэше...
	if(elem){
		return new Resolute.Element(elem);
	};
	return null;
};

Resolute.getClassByName = function (className) {
	var parts = className.split('.'),
		cls = Resolute,
		n = parts.length,
		i;
	for (i = 0; cls && i < n; ++i) {
		cls = cls[parts[i]];
	}
	return cls || null;
};

// TODO Remove !!!Вынести в отдельный класс!!!
Resolute.removeNode = function(n){
	if(n && n.parentNode && n.tagName != 'BODY'){
		(Resolute.enableNestedListenerRemoval) ? Resolute.EventManager.purgeElement(n, true) : Resolute.EventManager.removeAll(n);
		n.parentNode.removeChild(n);
		delete Resolute.cache.elements[n.id];
	}
}

Resolute.Dom = {
	isAncestor : function(p, c) {
		var ret = false;
		
		p = Resolute.getDom(p);
		c = Resolute.getDom(c);
		if (p && c) {
			if (p.contains) {
				return p.contains(c);
			} else if (p.compareDocumentPosition) {
				return !!(p.compareDocumentPosition(c) & 16);
			} else {
				while (c = c.parentNode) {
					ret = c == p || ret;
				}
			}
		}	
		return ret;
	},
	getViewWidth : function(full) {
		return full ? this.getDocumentWidth() : this.getViewportWidth();
	},
	getViewHeight : function(full) {
		return full ? this.getDocumentHeight() : this.getViewportHeight();
	},
	getDocumentHeight: function() {
		return Math.max(!(document.compatMode == "CSS1Compat") ? document.body.scrollHeight : document.documentElement.scrollHeight, this.getViewportHeight());
	},
	getDocumentWidth: function() {
		return Math.max(!(document.compatMode == "CSS1Compat") ? document.body.scrollWidth : document.documentElement.scrollWidth, this.getViewportWidth());
	},
	getViewportHeight: function(){
		return Resolute.isIE ? 
			   (Resolute.isStrict ? document.documentElement.clientHeight : document.body.clientHeight) :
			   self.innerHeight;
	},
	getViewportWidth : function() {
		return !Resolute.isStrict && !Resolute.isOpera ? document.body.clientWidth :
			   Resolute.isIE ? document.documentElement.clientWidth : self.innerWidth;
	},
	getY : function(el) {
		return this.getXY(el)[1];
	},
	getX : function(el) {
		return this.getXY(el)[0];
	},
	getXY : function(el) {
		var p,
			pe,
			b,
			bt,
			bl,
			dbd,
			x = 0,
			y = 0, 
			scroll,
			hasAbsolute, 
			bd = (document.body || document.documentElement),
			ret = [0,0];
			
		el = Resolute.getDom(el);

		if(el != bd){
			if (el.getBoundingClientRect) {
				b = el.getBoundingClientRect();
				scroll = Resolute.fly(document).getScroll();
				ret = [Math.round(b.left + scroll.left), Math.round(b.top + scroll.top)];
			} else {
				p = el;
				hasAbsolute = Resolute.fly(el).isStyle("position", "absolute");
	
				while (p) {
					pe = Resolute.fly(p);
					x += p.offsetLeft;
					y += p.offsetTop;
	
					hasAbsolute = hasAbsolute || pe.isStyle("position", "absolute");
							
					if (Resolute.isGecko) {
						y += bt = parseInt(pe.getStyle("borderTopWidth"), 10) || 0;
						x += bl = parseInt(pe.getStyle("borderLeftWidth"), 10) || 0;
	
						if (p != el && !pe.isStyle('overflow','visible')) {
							x += bl;
							y += bt;
						}
					}
					p = p.offsetParent;
				}
	
				if (Resolute.isSafari && hasAbsolute) {
					x -= bd.offsetLeft;
					y -= bd.offsetTop;
				}
	
				if (Resolute.isGecko && !hasAbsolute) {
					dbd = Resolute.fly(bd);
					x += parseInt(dbd.getStyle("borderLeftWidth"), 10) || 0;
					y += parseInt(dbd.getStyle("borderTopWidth"), 10) || 0;
				}
	
				p = el.parentNode;
				while (p && p != bd) {
					if (!Resolute.isOpera || (p.tagName != 'TR' && !Resolute.fly(p).isStyle("display", "inline"))) {
						x -= p.scrollLeft;
						y -= p.scrollTop;
					}
					p = p.parentNode;
				}
				ret = [x,y];
			}
		}
		return ret
	},
	setXY : function(el, xy) {
		(el = Ext.fly(el, '_setXY')).position();
		var pts = el.translatePoints(xy),
			style = el.dom.style,
			pos;
		for (pos in pts) {
			if(!isNaN(pts[pos])) style[pos] = pts[pos] + "px"
		}
	},
	setX : function(el, x) {
		this.setXY(el, [x, false]);
	},
	setY : function(el, y) {
		this.setXY(el, [false, y]);
	}
};