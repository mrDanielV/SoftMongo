/* 
Механизм всплывающих сообщений
*/

Resolute.ns('Resolute.Notices');
Resolute.Notices.init = function(){
	//Resolute.Notices.taskThreadId = setInterval(Resolute.Notices.task, 1000);
	window.addEventListener('click',Resolute.Notices.onClick,true);
};
Resolute.Notices.task = function(){
	// Автоматическое скрытие сообщений
	for(var code in Resolute.Notices.items){
		if(performance.now() - Resolute.Notices.items[code].ts >= Resolute.Notices.items[code].ms){
			Resolute.Notices.hide(code);
		}
	}
};

// Время скрытия сообщния (мс) по-умолчанию
Resolute.Notices.defaultHideTimeout = 4000;

Resolute.Notices.itemsId = 0;
Resolute.Notices.items = {};
Resolute.Notices.log = [];

Resolute.Notices.onClick = function(event){
	var el = Resolute.get(event.target),
		ntc = el.up('.notice');
	if(ntc){
		// Клик по сообщению
		var code = ntc.getAttribute('data-notice');
		if(code){
			
			Resolute.Notices.hide(code);
		}
	}
}

Resolute.Notices.show = function(ntc,log){
	if(Resolute.isString(ntc)){
		ntc = {text:ntc,type:'warning'}
	};
	var m = [];
	var n = {
		code: 'notice'+Resolute.hcode(),
		id: Resolute.Notices.itemsId++,
		ts: performance.now(),
		cfg:ntc,
		ms: ntc.ms || Resolute.Notices.defaultHideTimeout || 4000,
		payload:ntc.payload||null,
		onClick:ntc.onClick||null,
		scope:ntc.scope||null
	};
	if(Resolute.Notices.has(ntc.text,ntc.title)) return null;
	var cls = ['notice'];
	if(ntc.type){
		cls.push(ntc.type);
	} else {
		cls.push('warning');
	};
	if(ntc.cls) cls.push(ntc.cls);
	if(ntc.icon){
		cls.push('has-icon');
		m.push(Resolute.jsml.icon(ntc.icon,ntc.iconCls));
	};
	m.push({cls:'content',cn:[
		(ntc.title)?{cls:'title',cn:ntc.title}:null,
		(ntc.text)?{cls:'text',cn:ntc.text}:null
	]});
	var el = Resolute.getBody().append({cls:cls.join(' '),a:{'data-notice':n.code},cn:m},true);
	n.el = el;
	var rect = el.getRect();
	Resolute.Notices.items[n.code] = n;
	for(var code in Resolute.Notices.items){
		if(Resolute.Notices.items[code].ts<n.ts){
			var pel = Resolute.Notices.items[code].el,
				prect = pel.getRect();
			pel.setTop(prect.top + rect.height + 6);
		}
	};
	el.animate({autoRemoveClass:true,duration:0.4,opacity:[0,1],transform:['translateX(400px)','translateX(0px)']});
	setTimeout(function(){Resolute.Notices.hide(n.code)},n.ms);
	if(log){
		Resolute.Notices.log.push(ntc);
	};
	return n.code;
};
Resolute.Notices.has = function(msg,title){
	for(var ncode in Resolute.Notices.items){
		if(Resolute.Notices.items[ncode].cfg.title == title && Resolute.Notices.items[ncode].cfg.text == msg){
			return true;
		}
	};
	return false
};
Resolute.Notices.clear = function(){
	// Скрыть все сообщения
	for(var ncode in Resolute.Notices.items){
		Resolute.Notices.items.remove(ncode);
	};
};
Resolute.Notices.hideAll = Resolute.Notices.clear;

Resolute.Notices.hide = function(code){
	// Скрыть сообщение по коду
	if(code && Resolute.Notices.items[code]){
		if(Resolute.Notices.items[code].el) Resolute.Notices.items[code].el.animate({autoRemoveClass:true,duration:0.4,opacity:[1,0],transform:['translateX(0px)','translateX(400px)']},function(){
			var rect = Resolute.Notices.items[code].el.getRect();
			for(var ncode in Resolute.Notices.items){
				if(Resolute.Notices.items[ncode].id<Resolute.Notices.items[code].id){
					var pel = Resolute.Notices.items[ncode].el,
						prect = pel.getRect();
					pel.setTop(prect.top - rect.height);
				}
			};
			Resolute.Notices.remove(code);
		});
	}
};
Resolute.Notices.remove = function(code){
	if(Resolute.Notices.items[code].el) Resolute.Notices.items[code].el.remove();
	delete Resolute.Notices.items[code];
}

// Короткие вызовы (шаблоны сообщений)

// Внутреннее оповещение
// Resolute.Notices.event('Договор №R77043 000239912 одобрен андеррайтером. Вы можете продолжить оформление договора. Для перехода в договор, нажмите на данное сообщение','Оповещение')
Resolute.Notices.event = function(msg,title,callback,scope){
	return Resolute.Notices.show({icon:'mi-notifications_active',type:'blue',title:title||'Оповещение',text:msg,ms:8000,onClick:callback,scope:scope||window},true);
};
// Информация об успешности операции
Resolute.Notices.success = function(msg,title,ms){
	return Resolute.Notices.show({icon:'mi-task_alt',type:'success',title:title,text:msg,ms:ms});
};
// Предупреждение
Resolute.Notices.warning = function(msg,title,ms){
	return Resolute.Notices.show({icon:'mi-warning_amber',type:'warning',title:title,text:msg,ms:ms});
};
// Ошибка
Resolute.Notices.error = function(msg,title,ms){
	return Resolute.Notices.show({icon:'mi-report_gmailerrorred',type:'error',title:title,text:msg,ms:ms});
};
// alert
Resolute.Notices.alert = function(msg,title,ms){
	return Resolute.Notices.show({icon:'mi-task_alt',type:'blue',title:title,text:msg,ms:ms});
};
// Новое сообщение
Resolute.Notices.message = function(payload,callback,scope){
	if(!payload) return;
	if(!payload.user) return;
	if(!payload.message) return;
	var msg = payload.message;
	if(msg.text.length>64) msg = msg.text.left(64)+'...';
	return Resolute.Notices.show({
		cls:'message',
		text:[
			{t:'img',cls:'user-avatar',st:'background-image:url(assets/resources/images/'+payload.user.avatar+');'},
			{cls:'body flex-1',cn:[
				{cls:'sm',cn:'Сообщение от:'},
				{cls:'user-name',cn:payload.user.name},
				{cls:'message',cn:msg}
			]}
		],
		payload:payload,
		onClick:callback,
		scope:scope||window,
		type:'blue',
		ms:8000
	});
};
//Resolute.Notices.message({user:{code:'1',name:'Уилхафф Таркин',avatar:'sample-avatar.png'},message:{code:123,date:111111,text:'Etiam euismod, lorem vel consequat rhoncus, lorem urna ultricies sem, pellentesque scelerisque odio orci vel elit.'}})

Resolute.Notices.init();