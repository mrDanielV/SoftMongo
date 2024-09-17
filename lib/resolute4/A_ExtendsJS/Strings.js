String.prototype.format = function(){
	// Форматирование строки (шаблонизация):
	//	'Привет, {0}{1}'.format('мир','!') 
	// или так:
	//	'Привет, {world}{test.excl}'.format({world:'мир',test:{excl:'!'}})
	var args = arguments;

	if(args.length == 0){
		return this;
	}

	if(!args[0] || isEmpty(args[0])){
		return this;
	}

	if(args.length == 1 && Resolute.isObject(args[0])){
		var r = this.replace(/\{([^}]+)\}/g, function(m, i){
			var renderer = null;
			
			if(i.has('|')){
				var p = i.split('|');
				i = p[0];
				renderer = p[1];
			}
			
			var res = Resolute.path.get(args[0], i, '');
			if(renderer){
				res = Resolute.format.get(renderer, res);
			}
			
			return res;
		});
		
		return r;
	} else {
		return this.replace(/\{(\d+)\}/g, function(m, i){
			return args[i];
		});
	};
};
String.prototype.upperFirst=function(){
	return this.charAt(0).toUpperCase() + this.slice(1);
};
String.prototype.isUpper=function(charPos){
	var cp = (charPos>0)?charPos:0;
	var str = this.charAt(cp);
	return (str == str.toUpperCase() && str != str.toLowerCase());
};
String.prototype.has=function(str){
	return this.indexOf(str)>=0;
};
String.prototype.eq = function(str){
	return this == str;
};
String.prototype.isEmpty=function(){
	return (this.length==0 || this.trim().length==0);
};
String.prototype.right=function(str){
	if(Resolute.isString(str)){
		var ind = this.indexOf(str);
		if(ind<0) return '';
		return this.substr(ind+str.length);
	} else if(Resolute.isNumber(str)){
		return this.substr(this.length-str,str);
	} else {
		return this.valueOf();
	}
};
String.prototype.left=function(str){
	if(Resolute.isString(str)){
		var ind = this.indexOf(str);
		if(ind<0) return '';
		return this.substr(0,ind);
	} else if(Resolute.isNumber(str)){
		return this.substr(0,str);
	} else {
		return this.valueOf();
	}
};
String.prototype.startsWith=function(searchString){
	var argLen = arguments.length, position = arguments[1];
	var str, start, pos, len, searchLength;
	pos = +position || 0;
	len = this.length;
	start = Math.min(Math.max(pos, 0), len);
	searchLength = searchString.length;
	if (searchLength + start > len) {
		return false;
	}
	if (this.substr(start, searchLength) === searchString) {
		return true;
	}
	return false;
};
String.prototype.endsWith=function(searchString){
	var argLen = arguments.length,
	endPosition = arguments[1];
	var str,
	start,
	end,
	pos,
	len,
	searchLength;
	
	var len = this.length;
	var pos = len;
	if(Resolute.isDefined(endPosition)) {
		pos = +endPosition || 0;
	}
	end = Math.min(Math.max(pos, 0), len);
	searchLength = searchString.length;
	start = end - searchLength;
	if (start < 0) {
		return false;
	}
	if (this.substr(start, searchLength) === searchString) {
		return true;
	}
	return false;
};
String.prototype.reverse=function(){
	// Отзеркалить строку
	return this.split('').reverse().join('');
};
String.prototype.unpad=function(chr){
	// Убрать из строки ведущие нули (или другие символы) и преобразовать в число
	// '000012'.unpad() >> 12
	// '--12'.unpad('-') >> 12
	var c = chr || '0';
	var res = '';
	var comm = false;
	for(var i=0;i<this.length;i++){
		if(comm){
			res += this[i];
			continue;
		};
		if(this[i]!=c){
			res += this[i];
			comm = true;
		}
	};
	return parseInt(res);
};
String.prototype.shuffle=function(){
	// Случайным образом перемешивает строку
	var a = this.split(''),
		n = a.length;

	for(var i = n - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a.join('');
};
String.prototype.in=function(array){
	// Содержится ли строка в массиве
	if(!array || !array.length) return false;
	return (array.indexOf(this.toString())>=0)?true:false;
};
String.prototype.rand = function(){
	var ind = Math.floor(Math.random()*this.length);
	return this[ind.bounds(0,this.length-1)];
}