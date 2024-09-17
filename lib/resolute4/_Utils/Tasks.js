Resolute.now = function(){
	// Независимый от переключения таймзоны таймстэмп
	return performance.timeOrigin + performance.now();
};

// Периодические задания
Resolute.Task = {
	list:{},
	paused:false,
	resolution:500,
	tickId:null,
	add:function(ms,fn,scope){
		// Добавляет периодическое задание
		// ms - интервал выполнения (в миллисекундах)
		// fn - функция для выполнения
		// scope - область видимости функции
		// Возвращает уникальный идентификатор (код) задания
		var code = 'task'+Resolute.hcode();
		Resolute.Task.list[code] = {
			code:code,
			fn:fn,
			scope:scope,
			ms:ms,
			runs:0,
			nextStart:Resolute.now()+ms
		};
		return code;
	},
	stop:function(code){
		// Останавливает задание по коду и удаляет его
		if(!Resolute.Task.has(code)) return;
		delete Resolute.Task.list[code];
	},
	stopAll:function(){
		// Останавливает все задания и удаляет их
		Resolute.Task.list = null;
		delete Resolute.Task.list;
		Resolute.Task.list = {};
	},
	pause:function(code){
		// Пауза выполнения задания
		if(!Resolute.Task.has(code)) return;
		Resolute.Task.list[code].pause = true;
	},
	pauseAll:function(){
		// Пауза выполнения всех заданий
		Resolute.Task.paused = true;
	},
	resume:function(code){
		// Повторный запуск задания
		if(!Resolute.Task.has(code)) return;
		Resolute.Task.list[code].pause = false;
	},
	resumeAll:function(){
		// Повторный запуск всех заданий
		Resolute.Task.paused = false;
	},
	has:function(code){
		if(Resolute.Task.list[code]) return true;
		return false;
	},
	get:function(code){
		// Получение задания по коду
		return Resolute.Task.list[code];
	},
	tick:function(){
		// Внутренний запуск заданий
		if(Resolute.Task.paused) return;
		Resolute.each(Resolute.Task.list,function(item,code){
			if(Resolute.now()>=item.nextStart && !item.onAir){
				item.onAir = true;
				item.nextStart = Resolute.now()+item.ms;
				if(!item.pause){
					item.runs++;
					item.fn.call(item.scope||this);
				};
				item.onAir = false;
			}
		})
	},
	init:function(){
		// Инициализация
		Resolute.Task.tickId = setInterval(Resolute.Task.tick,Resolute.Task.resolution);
	}
};
Resolute.Task.init();
