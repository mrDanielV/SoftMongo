// Number

// является ли число нечётным
Number.prototype.isOdd = function(){
	return this % 2 != 0;
};

// является ли число чётным
Number.prototype.isEven = function(){
	return this % 2 == 0;
};

// Добавление перед числом ведущих нулей (либо других символов)
// (14).pad(3) >> '00014'
// (14).pad(3,'-') >> '---14'
Number.prototype.pad = function(length,chr){
	if(!length || length<=0) return ''+this;
	var str = '' + this;
	var pp = (chr)?(''+chr):'0';
	return pp.repeat(length||1)+''+str;
};


// Множественная форма слова (массив строк: один, два, пять)
// (5).form(['объект','объекта','объектов']) >> '5 объектов'
// (5).form(['объект','объекта','объектов'],true) >> 'объектов'
Number.prototype.form = function(form,formOnly){
	if(!formOnly){
		return this+' '+this.form(form,true);
	};
	var n = Math.abs(this);
	n %= 100;
	if (n >= 5 && n <= 20) return form[2];
	n %= 10;
	if(n === 1) return form[0];
	if(n >= 2 && n <= 4) return form[1];
	return form[2];
};
// Разделение числа на разряды по тысячам
Number.prototype.separate = function(separator, decSeparator){
	if(!this){
		return this;
	}
	if(typeof(separator) === 'undefined'){
		separator = ' ';
	}
	if(typeof(decSeparator) === 'undefined'){
		decSeparator = ',';
	}
	
	var str = this + '';
	var parts = str.split('.');
	var v = parts[0];
	var d = parts[1] || '';

	var c = 0;
	var res = [];
	for(var i = v.length-1; i >= 0; i--){
		res.push(v[i]);
		if(c==2 && i > 0){
			res.push(separator);
			c = 0;
		} else {
			c++;
		}
	}
	res = res.reverse().join('');

	if(d){
		res+=decSeparator + d;
	}

	return res;

	//return str;
};
// Ограничитель числа
Number.prototype.bounds = function(min,max){
	if(this<min) return min;
	if(this>max) return max;
	return this;
};
// Линейная интерполяция var x = 0.5; x.lerp(100,200); >> 150
Number.prototype.lerp = function(a, b, round){
	var n = (1 - this) * a + this * b;
	return (round)?Math.round(n):n;
}

// Экспоненциальная интерполяция между двух точек (текучее число - координата х, для которой функция возвращает y)
// (10).exp([5,8],[12,32]) >> 21.5344030821177
Number.prototype.exp = function(p1,p2,round){
	if(this>=p2[0]) return p2[1];
	if(this<=p1[0]) return p1[1];
	var r = p1[1] * Math.pow(p2[1]/p1[1],(this-p1[0])/(p2[0]-p1[0]));
	return (round)?Math.round(r):r;
};
Number.prototype.int = function(){
	return Math.round(this);
};
Number.prototype.floor = function(){
	return Math.floor(this);
};
Number.prototype.ceil = function(){
	return Math.ceil(this);
};
Number.prototype.in = function(array){
	// Содержится ли число в массиве
	if(!array || !array.length) return false;
	return (array.indexOf(this.toString())>=0)?true:false;
};
Number.prototype.between = function(a,b,type){
	var v = parseInt(this, 10);
	if(!type) return (v>=a && b<=b);
	if(type == 1 || type == 'leftEqual') return (v>=a && b<b);
	if(type == 2 || type == 'rightEqual') return (v>a && b<=b);
	if(type == 3 || type == 'noEqual') return (v>a && b<b);
	if(type == 4 || type == 'allEqual') return (v>=a && b<=b);
	return (v>=a && b<=b);
};