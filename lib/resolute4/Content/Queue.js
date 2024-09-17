// Произвольная очередь выполнения функций
// var q = new Resolute.Queue();
// q.stage(function(){})

Resolute.ns('Resolute.Queue');

Resolute.Queue = function(){
	this.items = [];
	this.labels = {};
	
	this.renew();
	
	this.finalFn = null;
	this.scope = null;
};
Resolute.Queue.prototype = {
	init:function(){
		
	},
	renew:function(){
		this.flags = {};
		this.data = {};
		this.currentStage = 0;
		this.results = [];
		this.working = false;
	},
	setScope:function(scope){
		this.scope = scope;
		return this;
	},
	flag:function(flag,value){
		if(Resolute.isEmpty(value)){
			return this.flags[flag];
		} else {
			this.flags[flag] = value;
		}
	},
	stage:function(fn,label){
		this.items.push(fn);
		if(label){
			this.labels[label] = this.items.length-1;
		}
		return this;
	},
	done:function(fn){
		this.finalFn = fn;
		return this;
	},
	setData:function(data){
		this.data = data;
		return this;
	},
	defer:function(ms){
		this.items.push(ms);
		return this;
	},
	result:function(res){
		var label = null;
		Resolute.each(this.labels,function(stageIndex,stageLabel){
			if(stageIndex == this.currentStage) label = stageLabel;
		},this);
		this.results.push({
			stage: label || this.currentStage,
			result:res
		});
	},
	getResult:function(returnLabel){
		if(this.results.length == 0) return null;
		var all = null;
		Resolute.each(this.results,function(res){
			if(res.result===false) all = false;
			if(returnLabel===true && res.result===false){
				return res.stage
			};
		},this);
		if(all==null) all = true;
		return all;
	},
	run:function(){
		this.working = true;
		if(Resolute.isNumber(this.items[this.currentStage])){
			var ms = this.items[this.currentStage];
			setTimeout(this.next.createDelegate(this),ms);
		} else {
			this.items[this.currentStage].call(this.scope||this,this);
		};
	},
	rewind:function(label){
		if(!label){
			this.currentStage = -1;
			return this;
		} else {
			if(this.labels[label]){
				this.currentStage = this.labels[label]-1;
			} else {
				this.currentStage = -1;
			};
			return this;
		};
	},
	next:function(){
		this.currentStage++;
		if(this.currentStage>=this.items.length){
			this.finalize();
		} else {
			this.run();
		};
	},
	finalize:function(){
		this.working = false;
		if(this.finalFn){
			this.finalFn.call(this.scope||this,this);
		}
	}
};
Resolute.Queue.make = function(){
	return new Resolute.Queue();
};
