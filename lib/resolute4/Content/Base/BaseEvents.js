Resolute.BaseEvent = function() {
	var loadComplete = false,
		unloadListeners = {},
		retryCount = 0,
		onAvailStack = [],
		_interval,
		locked = false,
		win = window,
		doc = document,
		POLL_RETRYS = 200,
		POLL_INTERVAL = 20,
		TYPE = 0,
		FN = 1,
		OBJ = 2,
		ADJ_SCOPE = 3,
		SCROLLLEFT = 'scrollLeft',
		SCROLLTOP = 'scrollTop',
		UNLOAD = 'unload',
		MOUSEOVER = 'mouseover',
		MOUSEOUT = 'mouseout',
		doAdd = function() {
			var ret;
			if (win.addEventListener) {
				ret = function(el, eventName, fn, capture) {
					if (eventName == 'mouseenter') {
						fn = fn.createInterceptor(checkRelatedTarget);
						el.addEventListener(MOUSEOVER, fn, (capture));
					} else if (eventName == 'mouseleave') {
						fn = fn.createInterceptor(checkRelatedTarget);
						el.addEventListener(MOUSEOUT, fn, (capture));
					} else {
						el.addEventListener(eventName, fn, (capture));
					}
					return fn;
				};
			} else if (win.attachEvent) {
				ret = function(el, eventName, fn, capture) {
					el.attachEvent("on" + eventName, fn);
					return fn;
				};
			} else {
				ret = function(){};
			}
			return ret;
		}(),
		doRemove = function(){
			var ret;
			if (win.removeEventListener) {
				ret = function (el, eventName, fn, capture) {
					if (eventName == 'mouseenter') {
						eventName = MOUSEOVER;
					} else if (eventName == 'mouseleave') {
						eventName = MOUSEOUT;
					}
					el.removeEventListener(eventName, fn, (capture));
				};
			} else if (win.detachEvent) {
				ret = function (el, eventName, fn) {
					el.detachEvent("on" + eventName, fn);
				};
			} else {
				ret = function(){};
			}
			return ret;
		}();

	function checkRelatedTarget(e) {
		return !elContains(e.currentTarget, pub.getRelatedTarget(e));
	}

	function elContains(parent, child) {
	   if(parent && parent.firstChild){
		 while(child) {
			if(child === parent) {
				return true;
			}
			child = child.parentNode;
			if(child && (child.nodeType != 1)) {
				child = null;
			}
		  }
		}
		return false;
	}

	function _tryPreloadAttach() {
		var ret = false,
			notAvail = [],
			element, i, v, override,
			tryAgain = !loadComplete || (retryCount > 0);

		if(!locked){
			locked = true;
			
			for(i = 0; i < onAvailStack.length; ++i){
				v = onAvailStack[i];
				if(v && (element = doc.getElementById(v.id))){
					if(!v.checkReady || loadComplete || element.nextSibling || (doc && doc.body)) {
						override = v.override;
						element = override ? (override === true ? v.obj : override) : element;
						v.fn.call(element, v.obj);
						onAvailStack.remove(v);
						--i;
					}else{
						notAvail.push(v);
					}
				}
			}

			retryCount = (notAvail.length === 0) ? 0 : retryCount - 1;

			if (tryAgain) {
				startInterval();
			} else {
				clearInterval(_interval);
				_interval = null;
			}
			ret = !(locked = false);
		}
		return ret;
	}

	function startInterval() {
		if(!_interval){
			var callback = function() {
				_tryPreloadAttach();
			};
			_interval = setInterval(callback, POLL_INTERVAL);
		}
	}

	function getScroll() {
		var dd = doc.documentElement,
			db = doc.body;
		if(dd && (dd[SCROLLTOP] || dd[SCROLLLEFT])){
			return [dd[SCROLLLEFT], dd[SCROLLTOP]];
		}else if(db){
			return [db[SCROLLLEFT], db[SCROLLTOP]];
		}else{
			return [0, 0];
		}
	}

	function getPageCoord (ev, xy) {
		ev = ev.browserEvent || ev;
		var coord  = ev['page' + xy];
		if (!coord && coord !== 0) {
			coord = ev['client' + xy] || 0;

			if (Resolute.isIE) {
				coord += getScroll()[xy == "X" ? 0 : 1];
			}
		}

		return coord;
	}

	var pub =  {
		onAvailable : function(p_id, p_fn, p_obj, p_override) {
			onAvailStack.push({
				id:         p_id,
				fn:         p_fn,
				obj:        p_obj,
				override:   p_override,
				checkReady: false });

			retryCount = POLL_RETRYS;
			startInterval();
		},
		addListener: function(el, eventName, fn) {
			el = Resolute.getDom(el);
			if (el && fn) {
				if (eventName == UNLOAD) {
					if (unloadListeners[el.id] === undefined) {
						unloadListeners[el.id] = [];
					}
					unloadListeners[el.id].push([eventName, fn]);
					return fn;
				}
				return doAdd(el, eventName, fn, false);
			}
			return false;
		},
		removeListener: function(el, eventName, fn) {
			el = Resolute.getDom(el);
			var i, len, li, lis;
			if (el && fn) {
				if(eventName == UNLOAD){
					if((lis = unloadListeners[el.id]) !== undefined){
						for(i = 0, len = lis.length; i < len; i++){
							if((li = lis[i]) && li[TYPE] == eventName && li[FN] == fn){
								unloadListeners[el.id].splice(i, 1);
							}
						}
					}
					return;
				}
				doRemove(el, eventName, fn, false);
			}
		},
		getTarget : function(ev) {
			ev = ev.browserEvent || ev;
			return this.resolveTextNode(ev.target || ev.srcElement);
		},
		resolveTextNode : function(node){
			return node && node.nodeType == 3 ? node.parentNode : node;
		},
		getRelatedTarget : function(ev) {
			ev = ev.browserEvent || ev;
			return this.resolveTextNode(ev.relatedTarget ||
				(/(mouseout|mouseleave)/.test(ev.type) ? ev.toElement :
				 /(mouseover|mouseenter)/.test(ev.type) ? ev.fromElement : null));
		},
		getPageX : function(ev) {
			return getPageCoord(ev, "X");
		},
		getPageY : function(ev) {
			return getPageCoord(ev, "Y");
		},
		getXY : function(ev) {
			return [this.getPageX(ev), this.getPageY(ev)];
		},
		stopEvent : function(ev) {
			this.stopPropagation(ev);
			this.preventDefault(ev);
		},
		stopPropagation : function(ev) {
			ev = ev.browserEvent || ev;
			if (ev.stopPropagation) {
				ev.stopPropagation();
			} else {
				ev.cancelBubble = true;
			}
		},
		preventDefault : function(ev) {
			ev = ev.browserEvent || ev;
			if (ev.preventDefault) {
				ev.preventDefault();
			} else {
				ev.returnValue = false;
			}
		},
		getEvent : function(e) {
			e = e || win.event;
			if (!e) {
				var c = this.getEvent.caller;
				while (c) {
					e = c.arguments[0];
					if (e && Event == e.constructor) {
						break;
					}
					c = c.caller;
				}
			}
			return e;
		},
		getCharCode : function(ev) {
			ev = ev.browserEvent || ev;
			return ev.charCode || ev.keyCode || 0;
		},
		getListeners : function(el, eventName) {
			Resolute.EventManager.getListeners(el, eventName);
		},
		purgeElement : function(el, recurse, eventName) {
			Resolute.EventManager.purgeElement(el, recurse, eventName);
		},

		_load : function(e) {
			loadComplete = true;
			if (Resolute.isIE && e !== true) {
				doRemove(win, "load", arguments.callee);
			}
		},

		_unload : function(e) {
			 var EU = Resolute.BaseEvent,
				i, v, ul, id, len, scope;

			for (id in unloadListeners) {
				ul = unloadListeners[id];
				for (i = 0, len = ul.length; i < len; i++) {
					v = ul[i];
					if (v) {
						try{
							scope = v[ADJ_SCOPE] ? (v[ADJ_SCOPE] === true ? v[OBJ] : v[ADJ_SCOPE]) :  win;
							v[FN].call(scope, EU.getEvent(e), v[OBJ]);
						}catch(ex){}
					}
				}
			};

			Resolute.EventManager._unload();

			doRemove(win, UNLOAD, EU._unload);
		}
	};

	pub.on = pub.addListener;
	pub.un = pub.removeListener;
	if (doc && doc.body) {
		pub._load(true);
	} else {
		doAdd(win, "load", pub._load);
	}
	doAdd(win, UNLOAD, pub._unload);
	_tryPreloadAttach();

	return pub;
}();

Resolute.EventManager = function(){
	var docReadyEvent,
		docReadyProcId,
		docReadyState = false,
		DETECT_NATIVE = Resolute.isGecko || Resolute.isWebKit || Resolute.isSafari,
		E = Resolute.BaseEvent,
		DOC = document,
		WINDOW = window,
		DOMCONTENTLOADED = "DOMContentLoaded",
		COMPLETE = 'complete',
		propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/,
		specialElCache = [];

	function getId(el){
		var id = false,
			i = 0,
			len = specialElCache.length,
			skip = false,
			o;

		if (el) {
			if (el.getElementById || el.navigator) {
				for(; i < len; ++i){
					o = specialElCache[i];
					if(o.el === el){
						id = o.id;
						break;
					}
				}
				if(!id){
					id = Resolute.id(el);
					specialElCache.push({
						id: id,
						el: el
					});
					skip = true;
				}
			}else{
				id = Resolute.id(el);
			}
			if(!Resolute.cache.items.elements[id]){
				Resolute.Element.addToCache(new Resolute.Element(el), id);
				if(skip){
					Resolute.cache.items.elements[id].skipGC = true;
				}
			}
		}
		return id;
	 }
	function addListener(el, ename, fn, task, wrap, scope){
		el = Resolute.getDom(el);
		var id = getId(el),
			es = Resolute.cache.items.elements[id].events,
			wfn;

		wfn = E.on(el, ename, wrap);
		es[ename] = es[ename] || [];

		/* 0 = Original Function,
		   1 = Event Manager Wrapped Function,
		   2 = Scope,
		   3 = Adapter Wrapped Function,
		   4 = Buffered Task
		*/
		es[ename].push([fn, wrap, scope, wfn, task]);

		if(el.addEventListener && ename == "mousewheel"){
			var args = ["DOMMouseScroll", wrap, false];
			el.addEventListener.apply(el, args);
			Resolute.EventManager.addListener(WINDOW, 'unload', function(){
				el.removeEventListener.apply(el, args);
			});
		}

		// fix stopped mousedowns on the document
		if(el == DOC && ename == "mousedown"){
			Resolute.EventManager.stoppedMouseDownEvent.addListener(wrap);
		}
	}
	function doScrollChk(){
		if(window != top){
			return false;
		}

		try{
			DOC.documentElement.doScroll('left');
		}catch(e){
			 return false;
		}
		fireDocReady();
		return true;
	}
	function checkReadyState(e){

		if(Resolute.isIE && doScrollChk()){
			return true;
		}
		if(DOC.readyState == COMPLETE){
			fireDocReady();
			return true;
		}
		docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
		return false;
	}

	var styles;
	function checkStyleSheets(e){
		styles || (styles = Resolute.queryAll('style, link[rel=stylesheet]'));
		if(styles.length == DOC.styleSheets.length){
			fireDocReady();
			return true;
		}
		docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
		return false;
	}

	function OperaDOMContentLoaded(e){
		DOC.removeEventListener(DOMCONTENTLOADED, arguments.callee, false);
		checkStyleSheets();
	}

	function fireDocReady(e){
		if(!docReadyState){
			docReadyState = true;

			if(docReadyProcId){
				clearTimeout(docReadyProcId);
			}
			if(DETECT_NATIVE) {
				DOC.removeEventListener(DOMCONTENTLOADED, fireDocReady, false);
			}
			if(Resolute.isIE && checkReadyState.bindIE){
				DOC.detachEvent('onreadystatechange', checkReadyState);
			}
			E.un(WINDOW, "load", arguments.callee);
		}
		if(docReadyEvent && !Resolute.isReady){
			Resolute.isReady = true;
			docReadyEvent.fire();
			docReadyEvent.listeners = [];
		}

	}

	function initDocReady(){
		docReadyEvent || (docReadyEvent = new Resolute.Event());
		if (DETECT_NATIVE) {
			DOC.addEventListener(DOMCONTENTLOADED, fireDocReady, false);
		}
		/*
		 * Handle additional (exceptional) detection strategies here
		 */
		if (Resolute.isIE){
			//Use readystatechange as a backup AND primary detection mechanism for a FRAME/IFRAME
			//See if page is already loaded
			if(!checkReadyState()){
				checkReadyState.bindIE = true;
				DOC.attachEvent('onreadystatechange', checkReadyState);
			}

		}else if(Resolute.isOpera){
			/* Notes:
			   Opera needs special treatment needed here because CSS rules are NOT QUITE
			   available after DOMContentLoaded is raised.
			*/

			//See if page is already loaded and all styleSheets are in place
			(DOC.readyState == COMPLETE && checkStyleSheets()) ||
				DOC.addEventListener(DOMCONTENTLOADED, OperaDOMContentLoaded, false);

		}else if (Resolute.isWebKit){
			//Fallback for older Webkits without DOMCONTENTLOADED support
			checkReadyState();
		}
		// no matter what, make sure it fires on load
		E.on(WINDOW, "load", fireDocReady);
	}

	function createTargeted(h, o){
		return function(){
			console.log('createTargeted');
			var args = Ext.toArray(arguments);
			if(o.target == Resolute.EventObject.setEvent(args[0]).target){
				h.apply(this, args);
			}
		};
	}

	function createBuffered(h, o, task){
		return function(e){
			// create new event object impl so new events don't wipe out properties
			task.delay(o.buffer, h, null, [new Resolute.EventObjectImpl(e)]);
		};
	}

	function createSingle(h, el, ename, fn, scope){
		return function(e){
			Resolute.EventManager.removeListener(el, ename, fn, scope);
			h(e);
		};
	}

	function createDelayed(h, o, fn){
		return function(e){
			var task = new Ext.util.DelayedTask(h);
			if(!fn.tasks) {
				fn.tasks = [];
			}
			fn.tasks.push(task);
			task.delay(o.delay || 10, h, null, [new Resolute.EventObjectImpl(e)]);
		};
	}

	function listen(element, ename, opt, fn, scope){
		var o = (!opt || typeof opt == "boolean") ? {} : opt,
			el = Resolute.getDom(element), task;

		fn = fn || o.fn;
		scope = scope || o.scope;

		if(!el){
			throw "Error listening for \"" + ename + '\". Element "' + element + '" doesn\'t exist.';
		}
		function h(e){
			if(!window.Resolute){
				return;
			};
			e = Resolute.EventObject.setEvent(e);
			var t;
			if (o.delegate) {
				if(!(t = e.getTarget(o.delegate, el))){
					return;
				}
			} else {
				t = e.target;
			}
			if (o.stopEvent) {
				e.stopEvent();
			}
			if (o.preventDefault) {
			   e.preventDefault();
			}
			if (o.stopPropagation) {
				e.stopPropagation();
			}
			if (o.normalized === false) {
				e = e.browserEvent;
			}

			fn.call(scope || el, e, t, o);
		}
		if(o.target){
			h = createTargeted(h, o);
		}
		if(o.delay){
			h = createDelayed(h, o, fn);
		}
		if(o.single){
			h = createSingle(h, el, ename, fn, scope);
		}
		if(o.buffer){
			task = new Ext.util.DelayedTask(h); //!!!!
			h = createBuffered(h, o, task);
		}

		addListener(el, ename, fn, task, h, scope);
		return h;
	}

	var pub = {
		addListener : function(element, eventName, fn, scope, options){
			if(typeof eventName == 'object'){
				var o = eventName, e, val;
				for(e in o){
					val = o[e];
					if(!propRe.test(e)){
						if(Resolute.isFunction(val)){
							// shared options
							listen(element, e, o, val, o.scope);
						}else{
							// individual options
							listen(element, e, val);
						}
					}
				}
			} else {
				listen(element, eventName, options, fn, scope);
			}
		},
		removeListener : function(el, eventName, fn, scope){
			el = Resolute.getDom(el);
			var id = getId(el),
				f = el && (Resolute.cache.items.elements[id].events)[eventName] || [],
				wrap, i, l, k, len, fnc;

			for (i = 0, len = f.length; i < len; i++) {

				/* 0 = Original Function,
				   1 = Event Manager Wrapped Function,
				   2 = Scope,
				   3 = Adapter Wrapped Function,
				   4 = Buffered Task
				*/
				if (Resolute.isArray(fnc = f[i]) && fnc[0] == fn && (!scope || fnc[2] == scope)) {
					if(fnc[4]) {
						fnc[4].cancel();
					}
					k = fn.tasks && fn.tasks.length;
					if(k) {
						while(k--) {
							fn.tasks[k].cancel();
						}
						delete fn.tasks;
					}
					wrap = fnc[1];
					E.un(el, eventName, wrap);

					// fix stopped mousedowns on the document
					if(wrap && el == DOC && eventName == "mousedown"){
						Resolute.EventManager.stoppedMouseDownEvent.removeListener(wrap);
					}

					f.splice(i, 1);
					if (f.length === 0) {
						delete Resolute.cache.items.elements[id].events[eventName];
					}
					for (k in Resolute.cache.items.elements[id].events) {
						return false;
					}
					Resolute.cache.items.elements[id].events = {};
					return false;
				}
			}
		},

		/**
		 * Removes all event handers from an element.  Typically you will use {@link Ext.Element#removeAllListeners}
		 * directly on an Element in favor of calling this version.
		 * @param {String/HTMLElement} el The id or html element from which to remove all event handlers.
		 */
		removeAll : function(el){
			el = Resolute.getDom(el);
			var id = getId(el),
				ec = Resolute.cache.items.elements[id] || {},
				es = ec.events || {},
				f, i, len, ename, fn, k, wrap;

			for(ename in es){
				if(es.hasOwnProperty(ename)){
					f = es[ename];
					/* 0 = Original Function,
					   1 = Event Manager Wrapped Function,
					   2 = Scope,
					   3 = Adapter Wrapped Function,
					   4 = Buffered Task
					*/
					for (i = 0, len = f.length; i < len; i++) {
						fn = f[i];
						if(fn[4]) {
							fn[4].cancel();
						}
						if(fn[0] && fn[0].tasks && (k = fn[0].tasks.length)) {
							while(k--) {
								fn[0].tasks[k].cancel();
							}
							delete fn.tasks;
						}
						wrap =  fn[1];
						E.un(el, ename, wrap);

						// fix stopped mousedowns on the document
						if(wrap && el == DOC &&  ename == "mousedown"){
							Resolute.EventManager.stoppedMouseDownEvent.removeListener(wrap);
						}
					}
				}
			}
			if (Resolute.cache.items.elements[id]) {
				Resolute.cache.items.elements[id].events = {};
			}
		},

		getListeners : function(el, eventName) {
			el = Resolute.getDom(el);
			var id = getId(el),
				ec = Resolute.cache.items.elements[id] || {},
				es = ec.events || {},
				results = [];
			if (es && es[eventName]) {
				return es[eventName];
			} else {
				return null;
			}
		},
		
		removeFromSpecialCache: function(o) {
			var i = 0,
				len = specialElCache.length;
				
			for (; i < len; ++i) {
				if (specialElCache[i].el == o) {
					specialElCache.splice(i, 1); 
				}
			}
		},

		purgeElement : function(el, recurse, eventName) {
			el = Resolute.getDom(el);
			var id = getId(el),
				ec = Resolute.cache.items.elements[id] || {},
				es = ec.events || {},
				i, f, len;
			if (eventName) {
				if (es && es.hasOwnProperty(eventName)) {
					f = es[eventName];
					for (i = 0, len = f.length; i < len; i++) {
						Resolute.EventManager.removeListener(el, eventName, f[i][0]);
					}
				}
			} else {
				Resolute.EventManager.removeAll(el);
			}
			if (recurse && el && el.childNodes) {
				for (i = 0, len = el.childNodes.length; i < len; i++) {
					Resolute.EventManager.purgeElement(el.childNodes[i], recurse, eventName);
				}
			}
		},

		_unload : function() {
			var el;
			for (el in Resolute.cache.items.elements) {
				Resolute.EventManager.removeAll(el);
			}
			delete Resolute.cache.items.elements;
			delete Resolute.Element._flyweights;

			// Abort any outstanding server requests (Resolute.Connection) !!!
			
		},
		onDocumentReady : function(fn, scope, options){
			if (Resolute.isReady) {
				docReadyEvent || (docReadyEvent = new Resolute.Event());
				docReadyEvent.addListener(fn, scope, options);
				docReadyEvent.fire();
				docReadyEvent.listeners = [];
			} else {
				if (!docReadyEvent) {
					initDocReady();
				}
				options = options || {};
				options.delay = options.delay || 1;
				docReadyEvent.addListener(fn, scope, options);
			}
		},
		fireDocReady  : fireDocReady
	};
	pub.on = pub.addListener;
	pub.un = pub.removeListener;

	pub.stoppedMouseDownEvent = new Resolute.Event();
	return pub;
}();

Resolute.apply(Resolute.EventManager, function(){
	var resizeEvent,
		resizeTask,
		textEvent,
		textSize,
		D = Resolute.Dom,
		propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/,
		curWidth = 0,
		curHeight = 0,
		// note 1: IE fires ONLY the keydown event on specialkey autorepeat
		// note 2: Safari < 3.1, Gecko (Mac/Linux) & Opera fire only the keypress event on specialkey autorepeat
		// (research done by @Jan Wolter at http://unixpapa.com/js/key.html)
		useKeydown = Resolute.isWebKit ?
					Resolute.num(navigator.userAgent.match(/AppleWebKit\/(\d+)/)[1]) >= 525 :
					!((Resolute.isGecko && !Resolute.isWindows) || Resolute.isOpera);

	return {
		doResizeEvent: function(){
			var h = D.getViewHeight(),
				w = D.getViewWidth();

			//whacky problem in IE where the resize event will fire even though the w/h are the same.
			if(curHeight != h || curWidth != w){
				resizeEvent.fire(curWidth = w, curHeight = h);
			}
		},
		onWindowResize : function(fn, scope, options){
			if(!resizeEvent){
				resizeEvent = new Resolute.Event();
				resizeTask = new Ext.util.DelayedTask(this.doResizeEvent);
				Resolute.EventManager.on(window, "resize", this.fireWindowResize, this);
			}
			resizeEvent.addListener(fn, scope, options);
		},
		fireWindowResize : function(){
			if(resizeEvent){
				resizeTask.delay(100);
			}
		},
		onTextResize : function(fn, scope, options){
			if(!textEvent){
				textEvent = new Resolute.Event();
				var textEl = new Resolute.Element(document.createElement('div'));
				textEl.dom.className = 'x-text-resize';
				textEl.dom.innerHTML = 'X';
				textEl.appendTo(document.body);
				textSize = textEl.dom.offsetHeight;
				setInterval(function(){
					if(textEl.dom.offsetHeight != textSize){
						textEvent.fire(textSize, textSize = textEl.dom.offsetHeight);
					}
				}, this.textResizeInterval);
			}
			textEvent.addListener(fn, scope, options);
		},
		removeResizeListener : function(fn, scope){
			if(resizeEvent){
				resizeEvent.removeListener(fn, scope);
			}
		},
		fireResize : function(){
			if(resizeEvent){
				resizeEvent.fire(D.getViewWidth(), D.getViewHeight());
			}
		},
		textResizeInterval : 50,
		ieDeferSrc : false,
		getKeyEvent : function(){
			return useKeydown ? 'keydown' : 'keypress';
		},
		useKeydown: useKeydown
	};
}());

Resolute.EventManager.on = Resolute.EventManager.addListener;
Resolute.onReady = Resolute.EventManager.onDocumentReady;

(function(){
	var initExtCss = function() {
		var bd = document.body || document.getElementsByTagName('body')[0];
		if (!bd) {
			return false;
		}

		var cls = [' ',
				Resolute.isIE ? "resolute-ie"
				: Resolute.isGecko ? "resolute-gecko"
				: Resolute.isFirefox ? "resolute-firefox"
				: Resolute.isOpera ? "resolute-opera"
				: Resolute.isWebKit ? "resolute-webkit" : ""];

		if (Resolute.isSafari) {
			cls.push("resolute-safari");
		} else if(Resolute.isChrome) {
			cls.push("resolute-chrome");
		}
		if (Resolute.isMac) {
			cls.push("resolute-mac");
		}
		if (Resolute.isLinux) {
			cls.push("resolute-linux");
		}
		return true;
	};

	if (!initExtCss()) {
		Resolute.onReady(initExtCss);
	}
})();



Resolute.EventObject = function(){
	var E = Resolute.BaseEvent,
		clickRe = /(dbl)?click/,
		safariKeys = {
			3 : 13, // enter
			63234 : 37, // left
			63235 : 39, // right
			63232 : 38, // up
			63233 : 40, // down
			63276 : 33, // page up
			63277 : 34, // page down
			63272 : 46, // delete
			63273 : 36, // home
			63275 : 35  // end
		},
		btnMap = {0:0,1:1,2:2};

	Resolute.EventObjectImpl = function(e){
		if(e){
			this.setEvent(e.browserEvent || e);
		}
	};

	Resolute.EventObjectImpl.prototype = {
		BACKSPACE: 8,
		TAB: 9,
		NUM_CENTER: 12,
		ENTER: 13,
		RETURN: 13,
		SHIFT: 16,
		CTRL: 17,
		CONTROL : 17,
		ALT: 18,
		PAUSE: 19,
		CAPS_LOCK: 20,
		ESC: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGEUP : 33,
		PAGE_DOWN: 34,
		PAGEDOWN : 34,
		END: 35,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		PRINT_SCREEN: 44,
		INSERT: 45,
		DELETE: 46,
		ZERO: 48,
		ONE: 49,
		TWO: 50,
		THREE: 51,
		FOUR: 52,
		FIVE: 53,
		SIX: 54,
		SEVEN: 55,
		EIGHT: 56,
		NINE: 57,
		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		G: 71,
		H: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,
		CONTEXT_MENU: 93,
		NUM_ZERO: 96,
		NUM_ONE: 97,
		NUM_TWO: 98,
		NUM_THREE: 99,
		NUM_FOUR: 100,
		NUM_FIVE: 101,
		NUM_SIX: 102,
		NUM_SEVEN: 103,
		NUM_EIGHT: 104,
		NUM_NINE: 105,
		NUM_MULTIPLY: 106,
		NUM_PLUS: 107,
		NUM_MINUS: 109,
		NUM_PERIOD: 110,
		NUM_DIVISION: 111,
		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,
		isNavKeyPress : function(){
		   var me = this,
			   k = this.normalizeKey(me.keyCode);
		   return (k >= 33 && k <= 40) ||  // Page Up/Down, End, Home, Left, Up, Right, Down
		   k == me.RETURN ||
		   k == me.TAB ||
		   k == me.ESC;
		},
		isSpecialKey : function(){
		   var k = this.normalizeKey(this.keyCode);
		   return (this.type == 'keypress' && this.ctrlKey) ||
		   this.isNavKeyPress() ||
		   (k == this.BACKSPACE) || // Backspace
		   (k >= 16 && k <= 20) || // Shift, Ctrl, Alt, Pause, Caps Lock
		   (k >= 44 && k <= 46);   // Print Screen, Insert, Delete
		},
		getPoint : function(){
		   return new Ext.lib.Point(this.xy[0], this.xy[1]);
		},
		hasModifier : function(){
		   return ((this.ctrlKey || this.altKey) || this.shiftKey);
		},
		setEvent : function(e){
			var me = this;
			if(e == me || (e && e.browserEvent)){ // already wrapped
				return e;
			}
			me.browserEvent = e;
			if(e){
				// normalize buttons
				me.button = e.button ? btnMap[e.button] : (e.which ? e.which - 1 : -1);
				if(clickRe.test(e.type) && me.button == -1){
					me.button = 0;
				}
				me.type = e.type;
				me.shiftKey = e.shiftKey;
				// mac metaKey behaves like ctrlKey
				me.ctrlKey = e.ctrlKey || e.metaKey || false;
				me.altKey = e.altKey;
				// in getKey these will be normalized for the mac
				me.keyCode = e.keyCode;
				me.charCode = e.charCode;
				// cache the target for the delayed and or buffered events
				me.target = E.getTarget(e);
				// same for XY
				me.xy = E.getXY(e);
			}else{
				me.button = -1;
				me.shiftKey = false;
				me.ctrlKey = false;
				me.altKey = false;
				me.keyCode = 0;
				me.charCode = 0;
				me.target = null;
				me.xy = [0, 0];
			}
			return me;
		},
		stopEvent : function(){
			var me = this;
			if(me.browserEvent){
				if(me.browserEvent.type == 'mousedown'){
					Resolute.EventManager.stoppedMouseDownEvent.fire(me);
				}
				E.stopEvent(me.browserEvent);
			}
		},
		preventDefault : function(){
			if(this.browserEvent){
				E.preventDefault(this.browserEvent);
			}
		},
		stopPropagation : function(){
			var me = this;
			if(me.browserEvent){
				if(me.browserEvent.type == 'mousedown'){
					Resolute.EventManager.stoppedMouseDownEvent.fire(me);
				}
				E.stopPropagation(me.browserEvent);
			}
		},
		getCharCode : function(){
			return this.charCode || this.keyCode;
		},
		getKey : function(){
			return this.normalizeKey(this.keyCode || this.charCode);
		},
		normalizeKey: function(k){
			return Resolute.isSafari ? (safariKeys[k] || k) : k;
		},
		getPageX : function(){
			return this.xy[0];
		},
		getPageY : function(){
			return this.xy[1];
		},
		getXY : function(){
			return this.xy;
		},
		getTarget : function(selector, maxDepth, returnEl){
			return selector ? Resolute.fly(this.target).findParent(selector, maxDepth, returnEl) : (returnEl ? Resolute.get(this.target) : this.target);
		},
		getRelatedTarget : function(){
			return this.browserEvent ? E.getRelatedTarget(this.browserEvent) : null;
		},
		getWheelDelta : function(){
			var e = this.browserEvent;
			var delta = 0;
			if(e.wheelDelta){ /* IE/Opera. */
				delta = e.wheelDelta/120;
			}else if(e.detail){ /* Mozilla */
				delta = -e.detail/3;
			}
			return delta;
		},
		within : function(el, related, allowEl){
			if(el){
				var t = this[related ? "getRelatedTarget" : "getTarget"]();
				return t && ((allowEl ? (t == Resolute.getDom(el)) : false) || Resolute.fly(el).contains(t));
			}
			return false;
		}
	 };
	return new Resolute.EventObjectImpl();
}();