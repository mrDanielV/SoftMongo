// Запросы на сервер: соединение
Resolute.Connection = function(cfg){
	this.addEvents(
		'complete',
		'error',
		'progress'
	);
	if(!this.id){
		this.id = 'resolute-connection-'+(Resolute.sequence.next('connection')+1000);
	};
	this.listeners = cfg.listeners || null;
	this.request = new XMLHttpRequest();
	this.method = cfg.method || 'POST';
	this.headers = cfg.headers || {};
	this.disableCache = cfg.disableCache || false;
	this.disableCacheParam = cfg.disableCacheParam || '_dc';
	this.request.responseType = cfg.responseType || 'text';
	this.timeout = cfg.timeout || 60000;
	if(cfg.params){
		this.setParams(cfg.params);
	};
	if(cfg.url){
		this.setUrl(cfg.url);
	};
	this.request.addEventListener('progress', this.onProgress.createDelegate(this), false);
	this.request.addEventListener('load', this.onComplete.createDelegate(this), false);
	this.request.addEventListener('error', this.onFailed.createDelegate(this), false);
	this.request.addEventListener('abort', this.onCanceled.createDelegate(this), false);
	
	Resolute.Connection.superclass.constructor.call(this);

	if(cfg.autoRun && this.url){
		this.open(this.url);
		this.send();
	};
};
// Наследуем от Observable для возможности подписываться на события и взводить их
Resolute.extend(Resolute.Connection,Resolute.Observable,{
	setUrl:function(url){
		this.url = url;
		if(this.disableCache){
			this.url += ((/\?/).test(this.url) ? "&" : "?")+(this.disableCacheParam+'=')+Date.now();
		};
	},
	setParams:function(params){
		var p = params || {};
		var formData = new FormData();
		
		for(var key in params){
			if(params.hasOwnProperty(key)){
				var param = params[key];
				if(param instanceof File){
					// Файл без изменений
					formData.append(key, param);
				} else if(param && param[0] instanceof File){
					// Массив файлов
					for (var i = 0; i < param.length; i++) {
						formData.append(key + i, param[i]);
					}
				} else if(Resolute.isObject(param)){
					formData.append(key, JSON.stringify(param));
				} else {
					formData.append(key, param);
				}
			}
		}
		
		this.params = formData;
	},
	setHeaders:function(obj){
		for(var header in obj){
			if(obj.hasOwnProperty(header)){
				this.request.setRequestHeader(header, obj[header]);
			}
		}
	},
	setHeader:function(header,value){
		this.request.setRequestHeader(header, value);
	},
	open:function(url){
		if(url){
			//this.setUrl(url);
		};
		this.request.open(this.method,this.url,true);
		this.request.timeout = this.timeout;
		return this;
	},
	abort:function(){
		this.request.abort();
	},
	send:function(payload){
		this.setHeaders(Resolute.applyIf(this.headers,Resolute.Connection.prototype.defaultHeaders));
		if(payload){
			this.request.send(payload);
		} else if(this.params){
			this.request.send(this.params);
		} else {
			this.request.send();
		}
	},
	onProgress:function(event){
		if (event.lengthComputable) {
			var percentComplete = event.loaded / event.total * 100;
			this.fireEvent('progress',this,event.total,event.loaded,percentComplete);
		} else {
			this.fireEvent('progress',this);
		}
	},
	onComplete:function(event){
		if(this.request.readyState == XMLHttpRequest.DONE && this.request.status == 200){
			this.fireEvent('complete', this, this.request.response);
		} else {
			this.fireEvent('error', this, 'httpError', this.request.response);
		};
	},
	onFailed:function(event){
		this.fireEvent('error',this,'failure');
	},
	onCanceled:function(event){
		this.fireEvent('error',this,'canceled');
	},
	destroy:function(){
		this.purgeListeners();
		delete this.request;
	}
});

// Дефолтные заголовки запроса на сервер
Resolute.Connection.prototype.defaultHeaders = {
	'Resolute-Version':'4.0'
};
// Установить дефолный заголовок/заголовки
Resolute.Connection.setDefaultHeader = function(name,value){
	if(Resolute.isObject(name)){
		for(var k in name){
			if(name.hasOwnProperty(k)){
				Resolute.Connection.setDefaultHeader(k,name[k]);
			}
		}
	} else if(Resolute.isDefined(value)){
		Resolute.Connection.prototype.defaultHeaders[name] = value;
	}
};
// Удалить дефолтный заголовок
Resolute.Connection.unsetDefaultHeader = function(name,value){
	if(Resolute.Connection.prototype.defaultHeaders[name]){
		delete Resolute.Connection.prototype.defaultHeaders[name];
	}
};


Resolute.Connection.fileTypes = {
	list:[
		{type:'audio/aac', name:'AAC аудио', ext:'aac', icon:'',group:'sound'},
		{type:'application/x-freearc', name:'Архив ARC', ext:'arc', icon:'',group:'archive'},
		{type:'video/x-msvideo', name:'Видео AVI', ext:'avi', icon:'',group:'video'},
		{type:'application/octet-stream', name:'Бинарный файл', ext:'bin', icon:'',group:'binary'},
		{type:'image/bmp', name:'Изображение BMP', ext:'bmp', icon:'',group:'image'},
		{type:'application/x-bzip', name:'Архив BZip', ext:'bz', icon:'',group:'archive'},
		{type:'application/x-bzip2', name:'Архив BZip2', ext:'bz2', icon:'',group:'archive'},
		{type:'text/css', name:'CSS стили', ext:'css', icon:'',group:'text'},
		{type:'text/csv', name:'CSV данные', ext:'csv', icon:'',group:'text'},
		{type:'application/msword', name:'Microsoft Word', ext:'doc', icon:'',group:'document'},
		{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name:'Microsoft Word (OpenXML)', ext:'docx', icon:'',group:'document'},
		{type:'application/vnd.ms-fontobject', name:'MS Embedded OpenType fonts', ext:'eot', icon:'',group:'font'},
		{type:'application/epub+zip', name:'Электронная публикация EPUB', ext:'epub', icon:'',group:'document'},
		{type:'application/gzip', name:'Архив GZ', ext:'gz', icon:'',group:'archive'},
		{type:'image/gif', name:'Изображение GIF', ext:'gif', icon:'',group:'image'},
		{type:'text/html', name:'HTML документ', ext:'htm', icon:'',group:'text'},
		{type:'text/html', name:'HTML документ', ext:'html', icon:'',group:'text'},
		{type:'image/vnd.microsoft.icon', name:'Изображение ICO', ext:'ico', icon:'',group:'image'},
		{type:'text/calendar', name:'iCalendar формат', ext:'ics', icon:'',group:'document'},
		{type:'application/java-archive', name:'Java Archive (JAR)', ext:'jar', icon:'',group:'binary'},
		{type:'image/jpeg', name:'Изображение JPEG', ext:'jpeg', icon:'',group:'image'},
		{type:'image/jpeg', name:'Изображение JPEG', ext:'jpg', icon:'',group:'image'},
		{type:'text/javascript', name:'JavaScript', ext:'js', icon:'',group:'text'},
		{type:'application/json', name:'JSON файл', ext:'json', icon:'',group:'text'},
		{type:'audio/x-midi', name:'MIDI файл', ext:'mid', icon:'',group:'sound'},
		{type:'audio/midi', name:'MIDI файл', ext:'midi', icon:'',group:'sound'},
		{type:'text/javascript', name:'JavaScript модуль', ext:'mjs', icon:'',group:'text'},
		{type:'audio/mpeg', name:'Аудио MP3', ext:'mp3', icon:'',group:'sound'},
		{type:'video/mpeg', name:'MPEG Video', ext:'mpeg', icon:'',group:'video'},
		{type:'application/vnd.apple.installer+xml', name:'Apple Installer Package', ext:'mpkg', icon:'',group:'binary'},
		{type:'application/vnd.oasis.opendocument.presentation', name:'OpenDocument презентация', ext:'odp', icon:'',group:'document'},
		{type:'application/vnd.oasis.opendocument.spreadsheet', name:'OpenDocument электронная таблица', ext:'ods', icon:'',group:'document'},
		{type:'application/vnd.oasis.opendocument.text', name:'OpenDocument текстовый документ', ext:'odt', icon:'',group:'document'},
		{type:'audio/ogg', name:'OGG аудио', ext:'oga', icon:'',group:'sound'},
		{type:'video/ogg', name:'OGG видео', ext:'ogv', icon:'',group:'video'},
		{type:'application/ogg', name:'OGG', ext:'ogx', icon:'',group:'video'},
		{type:'audio/opus', name:'Opus аудио', ext:'opus', icon:'',group:'sound'},
		{type:'font/otf', name:'OpenType шрифт', ext:'otf', icon:'',group:'font'},
		{type:'image/png', name:'Изображение PNG', ext:'png', icon:'',group:'image'},
		{type:'application/pdf', name:'Документ PDF', ext:'pdf', icon:'',group:'document'},
		{type:'application/php', name:'PHP скрипт', ext:'php', icon:'',group:'text'},
		{type:'application/vnd.ms-powerpoint', name:'Microsoft PowerPoint презентация', ext:'ppt', icon:'',group:'document'},
		{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation', name:'Microsoft PowerPoint презентация', ext:'pptx', icon:'',group:'document'},
		{type:'application/vnd.rar', name:'RAR архив', ext:'rar', icon:'',group:'archive'},
		{type:'application/rtf', name:'Документ RTF', ext:'rtf', icon:'',group:'document'},
		{type:'application/x-sh', name:'Скрипт shell', ext:'sh', icon:'',group:'text'},
		{type:'image/svg+xml', name:'Векторное изображение SVG', ext:'svg', icon:'',group:'image'},
		{type:'application/x-tar', name:'Архив TAR', ext:'tar', icon:'',group:'archive'},
		{type:'image/tiff', name:'Изображение TIFF', ext:'tif', icon:'',group:'image'},
		{type:'image/tiff', name:'Изображение TIFF', ext:'tiff', icon:'',group:'image'},
		{type:'video/mp2t', name:'MPEG transport stream', ext:'ts', icon:'',group:'video'},
		{type:'font/ttf', name:'TrueType шрифт', ext:'ttf', icon:'',group:'font'},
		{type:'text/plain', name:'Текстовый файл', ext:'txt', icon:'',group:'text'},
		{type:'application/vnd.visio', name:'Microsoft Visio', ext:'vsd', icon:'',group:'document'},
		{type:'audio/wav', name:'Waveform Audio Format', ext:'wav', icon:'',group:'sound'},
		{type:'audio/webm', name:'WEBM audio', ext:'weba', icon:'',group:'sound'},
		{type:'video/webm', name:'WEBM video', ext:'webm', icon:'',group:'video'},
		{type:'image/webp', name:'WEBP image', ext:'webp', icon:'',group:'image'},
		{type:'font/woff', name:'Web Open Font Format (WOFF)', ext:'woff', icon:'',group:'font'},
		{type:'font/woff2', name:'Web Open Font Format (WOFF)', ext:'woff2', icon:'',group:'font'},
		{type:'application/xhtml+xml', name:'XHTML', ext:'xhtml', icon:'',group:'text'},
		{type:'application/vnd.ms-excel', name:'Microsoft Excel', ext:'xls', icon:'',group:'document'},
		{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name:'Microsoft Excel (OpenXML)', ext:'xlsx', icon:'',group:'document'},
		{type:'application/xml', name:'XML', ext:'xml', icon:'',group:'text'},
		{type:'application/zip', name:'ZIP архив', ext:'zip', icon:'',group:'archive'},
		{type:'video/3gpp', name:'3GPP аудио/видео контейнер', ext:'3gp', icon:'',group:'video'},
		{type:'audio/3gpp', name:'3GPP аудио/видео контейнер', ext:'3gp', icon:'',group:'sound'},
		{type:'video/3gpp2', name:'3GPP2  аудио/видео контейнер', ext:'3g2', icon:'',group:'video'},
		{type:'audio/3gpp2', name:'3GPP2  аудио/видео контейнер', ext:'3g2', icon:'',group:'sound'},
		{type:'application/x-7z-compressed', name:'7-zip архив', ext:'7z', icon:'',group:'archive'}
	],
	get:function(t){
		for(var i=0;i<Resolute.Connection.fileTypes.list.length;i++){
			if(Resolute.Connection.fileTypes.list[i].type == t){
				return Resolute.Connection.fileTypes.list[i];
			}
		};
		return {type:t,name:t};
	},
	getByExt:function(ext){
		for(var i=0;i<Resolute.Connection.fileTypes.list.length;i++){
			if(Resolute.Connection.fileTypes.list[i].ext == ext){
				return Resolute.Connection.fileTypes.list[i];
			}
		};
		return null;
	}
};

Resolute.ConnectionPool = {
	items:[],
	add:function(connection){
		
	},
	get:function(id){
		
	}
};

// Функция выполнения запроса на сервер
// аналог Resolute.ServerRequest, но на другой архитектуре
Resolute.request = function(cfg){
	var connection = new Resolute.Connection({
		url:cfg.url,
		params:cfg.params||{},
		headers:cfg.headers||{},
		responseType:cfg.type||'json',
		disableCache:cfg.disableCache||false,
		autoRun:(Resolute.isDefined(cfg.autoRun))?cfg.autoRun:true,
		listeners:{
			'complete':function(conn,data){
				connection.destroy();
				connection = null;
				delete connection;
				var callSuccess = false;
				if(data){
					if(cfg.disableSuccessCheck===true){
						callSuccess = true;
					} else {
						if(data.success===true){
							callSuccess = true;
						}
					}
				};
				if(callSuccess){
					if(cfg.onSuccess){
						cfg.onSuccess.call(cfg.scope||this,data);
					}
				} else {
					if(cfg.onFailure){
						cfg.onFailure.call(cfg.scope||this,data);
					}
				}
			},
			'error':function(conn, errorType, data){ 
				connection.destroy();
				connection = null;
				delete connection;
				if(cfg.onFailure){
					cfg.onFailure.call(cfg.scope||this, data);
				}
			},
			'progress':function(conn,data){
				if(cfg.onProgress){
					cfg.onProgress.call(cfg.scope||this,connection,total,loaded,percent);
				}
			},
			scope:this
		}
	});
	return connection;
};

// Функция для имитация "submit" формы по пути path с данными params с вызовом в новое окно
// Для обеспечения функционала "скачивания"
Resolute.download = function(path, params, method, noCache) {
	method = method || "post";
	if(noCache){
		path += '?_dc='+(new Date()).getTime();
	};

	var form = {id: 'resolute-hidden-form-wrap', cn:[
		{t: 'form', id: 'resolute-hform', a: {method: method, action: path, target:'_blank'}, cn: [
			{t:'input',a: {type:'hidden', name:'quoted', value:'1'}}
		]}
	]};

	for(var key in params) {
		var kp = params[key];
		if(isObject(kp)){
			kp = R.encode(kp)
		}
		kp = kp + '';
		kp = kp.replace(/"/g,"'");
		form.cn[0].cn.push({t:'input',a: {type:'hidden', name:key, value:kp}});
	}

	var tmp = new Resolute.Markup.Template({markup: form});
	tmp.apply(R.getBody());

	var wrapEl = R.get('resolute-hidden-form-wrap');
	var formEl = R.get('resolute-hform');

	var n = R.xp(formEl, 'dom.children.length');
	if(n){
		for (var i = 0; i < n; i++) {
			var input = formEl.dom.children[i];
			var value = R.xp(params, R.xp(input, 'name'), 'empty');
			if(value != 'empty'){
				input.value = value;
			}
		}
	}

	formEl.dom.submit();
	wrapEl.remove();
};