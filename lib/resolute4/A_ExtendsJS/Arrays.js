// Работа с массивами

Array.prototype.match = function(query,value){
	var q = query;
	if(Resolute.isString(query)){
		q = {};
		q[query] = value;
	};
	var res = [];
	Resolute.each(this,function(item){
		if(Resolute.match(item,q)){
			res.push(item);
		}
	});
	return res;
};
/*doc
Проверяет, есть ли значение в массиве
=>value : проверяемое значение
=>index : [true|false] true = вернуть индекс значения, если есть в массиве; false = вернуть true или false
<=mixed : [true|false][number:-1,Infinity]
doc*/
Array.prototype.present = function(value,index){
	if(this.length==0) return false

	if(Resolute.isArray(value)){
		var cnt = 0, ind = [];
		for(var i=0;i<value.length;i++){
			if(this.indexOf(value[i])>=0){
				cnt++
				if(index){
					ind.push(i);
				};
			}
		};
		return (index)?ind:cnt>0;
	} else {
		return (index)?this.indexOf(value):(this.indexOf(value)>=0);
	}

};
if(!Array.prototype.remove){
	Array.prototype.remove = function(value){
		var i = this.present(value,true);
		if(i>=0){
			this.splice(i,1);
		}
	}
}
// Есть ли в массиве объект, удовлетворяющий критериям поиска
Array.prototype.has = function(query,index){
	if(this.length==0) return false;
	if(!query) return false;
	for(var i=0;i<this.length;i++){
		if(Resolute.match(this[i],query)) return (index===true)?i:true;
	};
	return false;
};

Array.prototype.eq = function(s){
	return (this.indexOf(s)>=0);
};

// Подсчет числа элементов, равных value
// [1,0,0,1,1].count(1); // 3 - равных 1
// [1,0,0,1,1].count(1,true); // 2 - не равных 1
Array.prototype.count = function(value,invert){
	if(this.length==0){
		return 0
	} else {
		if(Resolute.isArray(value)){
			var cnt = 0;
			for(var z=0;z<value.length;z++){
				cnt += this.count(value[z])
			};
			return (invert)?(this.length-cnt):cnt;
		} else {
			var cnt = 0;
			for(var i=0;i<this.length;i++){
				if(this[i]==value){
					cnt++;
				}
			};
			return (invert)?(this.length-cnt):cnt;
		}
	}
};

// Из массива с объектами возвращает значения по переданному пути
// [{code:1},{code:2}].flatten('code') >> [1,2]
Array.prototype.flatten = function(path,uniq){
	var res = [];
	for(var i=0;i<this.length;i++){
		if(this[i]){
			var r = Resolute.clone(Resolute.path.get(this[i],path));
			if(uniq && res.indexOf(r)>=0){
				continue;
			};
			res.push(r);
		}
	};
	return res
};

// Пустой ли массив
Array.prototype.isEmpty = function(){
	return this.length === 0;
}

// Сумма значений
Array.prototype.sum = function(path){
	var sum = 0;
	for(var i=0;i<this.length;i++){
		if(Resolute.isObject(this[i])){
			sum += Resolute.path.get(this[i],path,0);
		} else if(Resolute.isNumber(this[i])){
			sum += this[i];
		}
	};
	return sum;
}

Array.prototype.rand = function(min,max){
	var res = [],s = (max)?Math.floor(Math.random()*((max-min)+1)+min):min;
	for(var i=0;i<s;i++){
		var ind = Math.floor(Math.random()*this.length);
		var pp = this[ind.bounds(0,this.length-1)];
		if(res.indexOf(pp)<0) res.push(pp);
	};
	return res;
}
Array.prototype.joinRand = function(s){
	var q = '';
	for(var i=0;i<this.length;i++){
		if(i>this.length-3){
			q += this[i]+' ';
		} else {
			var sep = s.rand();
			if(sep != ' ') sep += ' ';
			q += this[i]+sep;
		}
	};
	return q.trim();
}
Array.prototype.each = function(fn,scope){
	Resolute.each(this,fn,scope);
}