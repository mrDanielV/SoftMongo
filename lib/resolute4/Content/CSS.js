// Утилиты для работы со стилями CSS
Resolute.CSS = function(){
	var rules = null;
	var doc = document;
	var camelRe = /(-[a-z])/gi;
	var camelFn = function(m, a){ return a.charAt(1).toUpperCase(); };
	var uncamelRe = /([A-Z])/g;
	var uncamelFn = function(m, a){ return '-'+a.charAt(0).toLowerCase(); };
	return {
		selectorExists:function(sel){
			if(!document.styleSheets) return false;
			for(var i=0;i<document.styleSheets.length;i++){
				for(var j=0;j<document.styleSheets[i].cssRules.length;j++){
					try{
						if(document.styleSheets[i].cssRules[j].selectorText == sel) return true;
					} finally{
						continue;
					}
				}
			};
			return false;
		},
		value:function(v,units){
			if(Resolute.isString(v)){
				return v;
			} else if(Resolute.isNumber(v)){
				return v+(units||'px');
			};
			return v;
		},
		rule2text:function(selector,cfg){
			var res = [];
			res.push(''+selector+'{');
			for(var k in cfg){
				if(cfg.hasOwnProperty(k)) res.push(k.replace(uncamelRe,uncamelFn)+':'+cfg[k]+';');
			};
			res.push('}')
			return res.join('');
		},
		style2text:function(cfg){
			var res = [];
			for(var k in cfg){
				if(cfg.hasOwnProperty(k)) res.push(k.replace(uncamelRe,uncamelFn)+':'+cfg[k]+';');
			};
			return res.join('');
		},
		text2style:function(cfg){
			var res = {},
				st = cfg.split(';');
			Resolute.each(st,function(str){
				if(str && str!=''){
					var ss = str.split(':');
					if(ss[0] && ss[1]){
						res[ss[0].replace(camelRe, camelFn)] = ss[1];
					}
				}
			});
			return res;
		},
		createStyle:function(cfg){
			var st = cfg.styles || cfg;
			var name = ''+cfg.name;
			if(!cfg.styles){
				delete cfg.name
			};
			return Resolute.CSS.rule2text(name,cfg.styles);
		},
		addStyle:function(st,sheet){
			if(Resolute.isArray(st)){
				Resolute.each(st,function(item){
					Resolute.CSS.addStyle(item,sheet);
				});
				return;
			};
			if(!sheet) sheet = 'ResoluteCommon';
			var styleSheet = null;
			if(!Resolute.CSS.hasStyleSheet(sheet)){
				styleSheet = Resolute.CSS.create('',sheet);
			} else {
				styleSheet = Resolute.CSS.getStyleSheet(sheet);
			};
			styleSheet.insertRule(Resolute.CSS.createStyle(st));
		},
		create:function(cssText, id){
			var ss;
			var head = doc.getElementsByTagName("head")[0];
			var rules = doc.createElement("style");
			rules.setAttribute("type", "text/css");
			if (id) {
				rules.setAttribute("id", id);
			}

			try {
				rules.appendChild(doc.createTextNode(cssText));
			} catch (e) {
				rules.cssText = cssText;
			}
			head.appendChild(rules);
			ss = rules.styleSheet ? rules.styleSheet : (rules.sheet || doc.styleSheets[doc.styleSheets.length - 1]);
			ss.title = id;
			this.cacheStyleSheet(ss);
			return ss;
		},
		hasStyleSheet:function(id){
			return (doc.getElementById(id))?true:false;
		},
		getStyleSheet:function(id){
			for(var sheet of document.styleSheets){
				if (sheet.ownerNode && sheet.ownerNode.id === id) {
					return sheet;
				}
			};
			return null;
		},
		removeStyleSheet:function(id){
			var existing = doc.getElementById(id);
			if (existing) {
				existing.parentNode.removeChild(existing);
			}
		},
		getStyleSheetRule:function(ss,selector){
			if(!Resolute.CSS.hasStyleSheet(ss)) return null;
			var res = null;
			Resolute.each(Resolute.CSS.getStyleSheet(ss).cssRules,function(rule,index){
				if(rule.selectorText == selector) res = rule;
			});
			return res;
		},
		swapStyleSheet:function(id, url){
			this.removeStyleSheet(id);
			var ss = doc.createElement("link");
			ss.setAttribute("rel", "stylesheet");
			ss.setAttribute("type", "text/css");
			ss.setAttribute("id", id);
			ss.setAttribute("href", url);
			doc.getElementsByTagName("head")[0].appendChild(ss);
		},
		refreshCache:function(){
			return this.getRules(true);
		},
		cacheStyleSheet:function(ss){
			if (!rules) {
				rules = {};
			}
			try {
				var ssRules = ss.cssRules || ss.rules;
				for (var j = ssRules.length - 1; j >= 0; --j) {
					rules[ssRules[j].selectorText.toLowerCase()] = ssRules[j];
				}
			} catch (e) {}
			},
		getRules:function(refreshCache){
			if(rules === null || refreshCache){
				rules = {};
				var ds = doc.styleSheets;
				for(var i =0, len = ds.length; i < len; i++){
					try{
						this.cacheStyleSheet(ds[i]);
					}catch(e){}
				}
			}
			return rules;
		},
		getRule:function(selector, refreshCache){
			var rs = this.getRules(refreshCache);
			if(!Resolute.isArray(selector)){
				return rs[selector.toLowerCase()];
			}
			for(var i = 0; i < selector.length; i++){
				if(rs[selector[i]]){
					return rs[selector[i].toLowerCase()];
				}
			}
			return null;
		},
		updateRule:function(selector, property, value){
			if(!Resolute.isArray(selector)){
				var rule = this.getRule(selector);
				if(rule){
					rule.style[property.replace(camelRe, camelFn)] = value;
					return true;
				}
			}else{
				for(var i = 0; i < selector.length; i++){
					if(this.updateRule(selector[i], property, value)){
						return true;
					}
				}
			}
			return false;
		}
	};
}();

Resolute.CSS.Forge = {
	cache:[],
	temp:[],
	snippets:{
		fixed:{
			flex:{display:'flex'},
			'border-box':{boxSizing:'border-box'},
			grid:{display:'grid'},
			columns:{display:'grid',gridTemplateRows:'repeat(1, 1fr)',gridTemplateColumns:'repeat(12, 1fr)',gap:'1rem'},
			bold:{fontWeight:'bold'},
			italic:{fontStyle:'italic'},
			scroll:{overflowY:'auto',scrollbarWidth:'thin'},
			nooverflow:{overflow:'hidden'},
			'field-border':{border:'1px solid #9b9da8',borderRadius:'3px',outline:'1px solid #9b9da84f'},
			'small-caps':{fontVariant:'small-caps'},
			stretch:{alignItems:'stretch'},
			center:{alignItems:'center',justifyContent:'center'},
			'align-items-center':{alignItems:'center'},
			'font-grey':{color:'grey'},
			'order-first':{order:-99999},
			'order-last':{order:99999},
			'order-none':{order:0},
			'w-full':{width:'100%'},
			'h-full':{height:'100%'},
			fill:{top:0,position:'absolute',bottom:0,left:0,right:0},
			'w-screen':{width:'100%'},
			'w-min':{width:'min-content'},
			'w-max':{width:'max-content'},
			'shadow-none':{boxShadow:'none'},
			'm-auto':{margin:'auto'},
			'mr-auto':{marginRight:'auto'},
			'ml-auto':{marginLeft:'auto'},
			'mb-auto':{marginBottom:'auto'},
			'mt-auto':{marginTop:'auto'},
			'static':{position:'static'},
			inline:{display:'inline-block'},
			fixed:{position:'fixed'},
			absolute:{position:'absolute'},
			relative:{position:'relative'},
			sticky:{position:'sticky'},
			'decoration-slice':{boxDecorationBreak:'slice'},
			'decoration-clone':{boxDecorationBreak:'clone'},
			'opacity-none':{opacity:0},
			'opacity-half':{opacity:0.5},
			'opacity-full':{opacity:1}
		},
		metrics:{
			'z-':{zIndex:'*'},
			'flex-':{flex:'*'},
			'border-':{border:'*px solid'},
			'border-color-':{borderColor:'#* !important'},
			'order-':{order:'*'},
			'p-':{padding:'*px'},
			'pl-':{paddingLeft:'*px'},
			'pr-':{paddingRight:'*px'},
			'pt-':{paddingTop:'*px'},
			'pb-':{paddingBottom:'*px'},
			'px-':{paddingLeft:'*px',paddingRight:'*px'},
			'py-':{paddingTop:'*px',paddingBottom:'*px'},
			'm-':{margin:'*px'},
			'ml-':{marginLeft:'*px'},
			'mr-':{marginRight:'*px'},
			'mt-':{marginTop:'*px'},
			'mb-':{marginBottom:'*px'},
			'mx-':{marginLeft:'*px',marginRight:'*px'},
			'my-':{marginTop:'*px',marginBottom:'*px'},
			'-m-':{margin:'-*px'},
			'-ml-':{marginLeft:'-*px'},
			'-mr-':{marginRight:'-*px'},
			'-mt-':{marginTop:'-*px'},
			'-mb-':{marginBottom:'-*px'},
			'-mx-':{marginLeft:'-*px',marginRight:'-*px'},
			'-my-':{marginTop:'-*px',marginBottom:'-*px'},
			'w-':{width:'*px'},
			'-w-':{width:'-*px'},
			'wp-':{width:'*%'},
			'h-':{height:'*px'},
			'-h-':{height:'-*px'},
			'hp-':{height:'*%'},
			'top-':{top:'*px'},
			'-top-':{top:'-*px'},
			'left-':{left:'*px'},
			'-left-':{left:'-*px'},
			'right-':{right:'*px'},
			'-right-':{right:'-*px'},
			'bottom-':{bottom:'*px'},
			'-bottom-':{bottom:'-*px'},
			'inset-x-':{right:'*px',left:'*px'},
			'-inset-x-':{right:'-*px',left:'-*px'},
			'inset-y-':{top:'*px',bottom:'*px'},
			'-inset-y-':{top:'-*px',bottom:'-*px'},
			'inset-':{top:'*px',right:'*px',bottom:'*px',left:'*px'},
			'-inset-':{top:'-*px',right:'-*px',bottom:'-*px',left:'-*px'},
			'size-':{fontSize:'*px'},
			'color-':{color:'#*'},
			'bgcolor-':{backgroundColor:'#*'},
			'col-':{gridColumn:'auto/span *'},
			'row-':{gridRow:'auto/span *'},
			'cols-':{gridTemplateColumns:'*px'},
			'gap-':{gap:'*px'}
		}
	},
	setValues:function(obj,val){
		Resolute.each(obj,function(value,prop){
			if(Resolute.isString(value) && value.has('*')){
				obj[prop] = value.replace('*',val);
			}
		});
	},
	hasSelector:function(name){
		var styleSheet = null;
		if(!Resolute.CSS.hasStyleSheet('ResoluteForgeStyles')){
			styleSheet = Resolute.CSS.create('','ResoluteForgeStyles');
		} else {
			styleSheet = Resolute.CSS.getStyleSheet('ResoluteForgeStyles');
		};
		if(!styleSheet) return null;
		for(var i=0;i<styleSheet.rules.length;i++){
			var rname = (styleSheet.rules[i].selectorText)?styleSheet.rules[i].selectorText.right('.'):((styleSheet.rules[i].name)?styleSheet.rules[i].name:null);
			if(rname === name){
				return true;
			}
		};
		return false;
	},
	replaceApply:function(){
		/* var regex = /--apply:(.*);/gu;
		let m;
		while ((m = regex.exec(str)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			m.forEach((match, groupIndex) => {
				console.log(`Found match, group ${groupIndex}: ${match}`);
			});
		} */
	},
	parse:function(str,noCommit){
		var styleSheet = null;
		if(!Resolute.CSS.hasStyleSheet('ResoluteForgeStyles')){
			styleSheet = Resolute.CSS.create('','ResoluteForgeStyles');
		} else {
			styleSheet = Resolute.CSS.getStyleSheet('ResoluteForgeStyles');
		};
		if(!styleSheet) return null;
		var sts = str.split(' '),f = Resolute.CSS.Forge,matchFixed = false,addedCount = 0,res = [];
		Resolute.each(sts,function(st){
			if(f.snippets.fixed[st]){
				if(!f.hasSelector(st)){
					styleSheet.insertRule(Resolute.CSS.rule2text('.'+st,f.snippets.fixed[st]));
				}
			} 
		},this);
		Resolute.each(f.snippets.metrics,function(rule,prop){
			for(var i=0;i<sts.length;i++){
				if(sts[i].startsWith(prop)){
					var m = sts[i].right(prop),r = Resolute.clone(rule);
					f.setValues(r,m);
					if(!f.hasSelector(sts[i])){
						styleSheet.insertRule(Resolute.CSS.rule2text('.'+sts[i],r));
					}
				}
			}
		},this);
	}
}

Resolute.CSS.snippets = {
	get:function(code,data){
		if(Resolute.CSS.snippets.list[code]){
			return Resolute.CSS.snippets.list[code](data);
		};
		return null;
	},
	reg:function(code,fn){
		Resolute.CSS.snippets.list[code] = fn;
	},
	list:{}
};

Resolute.CSS.snippets.reg('materialicon',function(icon){
	return {t:'span',cls:'icon material-icons',cn:icon}
});
