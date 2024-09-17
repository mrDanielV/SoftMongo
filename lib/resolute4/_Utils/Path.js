
Resolute.path = {
	get:function(obj,path,defVal){
		defVal = (typeof defVal === 'undefined') ? null : defVal;
		if (!obj || typeof path !== 'string') return defVal;

		var tokens = path.split('.');
		var s = obj;
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (!token) return defVal;
			
			if (s==null || !Resolute.isDefined(s)) return defVal;
			s = s[token];
		};

		if (typeof s === 'undefined') return defVal;

		return s;
	},
	set:function(obj,path,value){
		if(obj===undefined){
			obj = {};
		}
		var a = path.split('.'); 
		var s = obj;
		for(var i=0;i<a.length;i++){
			if(Resolute.isEmpty(s[a[i]])){
				if(i==(a.length-1)){
					s[a[i]] = value;
				} else {
					s[a[i]] = {};
				};
				s = s[a[i]];
			} else {
				if(i==(a.length-1)){
					s[a[i]] = value;
				} else {
					s = s[a[i]];
				}
			}
		}
	},
	unset:function(obj,path){
		if(obj===undefined){
			obj = {};
		}
		var a = path.split('.'); 
		var s = obj;
		for(var i=0;i<a.length;i++){
			if(i==(a.length-1)){
				if(s) delete s[a[i]];
				return;
			} else {
				s = s[a[i]];
			}
		}
	},
	matches:function(pathA,pathB){
		// Возвращает true если pathB является подмножеством pathA
		// Resolute.path.matches('content.contract','content.contract.issueDate') >> true
		// Resolute.path.matches('content','content.contract.issueDate') >> true
		// Resolute.path.matches('content.contract.beginDate','content.contract') >> false
		// Resolute.path.matches('logic.results','content.contract.issueDate') >> false
		var pa = pathA.split('.');
		var pb = pathB.split('.');
		for(var i=0;i<pa.length;i++){
			if(pb[i] && (pa[i] == pb[i])){
				continue;
			} else {
				return false;
			}
		};
		return true;
	}
};
Resolute.xp = Resolute.path.get;
Resolute.put = Resolute.path.set;
