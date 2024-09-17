/**
	Resolute.Form
	Форма
	{
		rtype:'form',
		data:{},
		items:[
			... Компоненты (секции, поля и прочее), разметка...
		]
	}

	// Предположим, в каком-то классе есть следующие переменные:
	this.data = Resolute.observe({});	// Данные для формы. Вместо {} можно передать уже готовые данные, например {content:{contract:{number:'111',beginDate:1}}}
	this.form // экземпляр класса Resolute.Form при инициализации которой в её конфиг передано поле data: this.data

	// После инициализации формы у неё будет свойство data которая являтся ссылкой на this.data в этом примере
	this.form.data === this.data
	
	// Соответственно все примеры ниже, где есть this.data так же работают от this.form.data

	// Подписка на события изменения полей
	this.form.on('change',function(field){},this);
	// Или при инициализации формы в конфиге
	{
		rtype:'form',
		data:this.data,
		items:[
			//......
		],
		listeners:{
			change:function(field){
				
			},
			scope:this
		}
	}
	// Или при инициализации формы в конфиге со ссылкой на функцию в текущем классе
	{
		rtype:'form',
		data:this.data,
		items:[
			//......
		],
		listeners:{
			change:this.onFormFieldChange,
			scope:this
		}
	}

	// Перебор всех полей формы по функции
	this.form.eachField(function(field){},this);

	// Получение всех секций формы массивом
	this.form.getCmps({rtype:'section'})

	// Получение одной определенной секции по её коду
	this.form.getCmp({rtype:'section',code:'xxx'});


	// Поиск поля (одного)
	// По имени (name)
	this.form.findField('number');
	// По пути
	this.form.findField({path:'content.contract.number'});
	// По составному критерию
	this.form.findField({path:{'$startsWith':'content.contract'},disabled:false,rtype:{'$in':['textfield','combobox']}});


	// Получение данных всей формы
	var data = this.form.getData();
	// или 
	var data = this.data.getData();
	// или
	var data = this.form.data.getData();

	// Записать данные по какому-то пути (данные применятся на форму)
	this.data.set('content.contract.number','7788-1111-222-333');
	// или 
	this.form.data.set('content.contract.number','7788-1111-222-333');

	// Получить данные по пути
	this.data.get('content.contract.number','значение по-умолчанию если по пути нет ничего (необязательный параметр)');

	// Получить массив со всеми полями, привязанным к определенному пути
	var fields = this.data.components('content.contract');

	// Проброс состояний в поля из данных (пока только enable|disable и show|hide) - по сути это просто события, но с реакцией полей
	this.data.state('content.contract','disable'); // Все поля в namespace content.contract будут задизейблены
	this.data.state('content.contract','enable');
	// или
	this.form.state('content.contract','disable');


	// Получить массив ошибок по всем полям (или null если их нет)
	this.form.getErrors()

	// Проверка валидности формы
	this.form.isValid()

	// Запустить валидацию формы
	this.form.validate()

	// Очистить признак невалидности у всех полей
	this.form.clearInvalid()

	// Проверка данных целиком (проверка на некие критерии без начитки значений в переменные и сравнения их)
	if(this.data.matches({
		'properties.status.code':{'$in':['draft','onPay']},
		'content.object.type':{'$exists':true},
		'content.contract.beginDate':{'$gte':1690409625698}
	})){
		// Что-то делаем
	}

	// Копирование данных из одного пути в другой (данные на форме так же обновятся)
	this.data.copy('content.policyHolder','content.insuredPerson');

	// Подписка на событие изменения определенного пути
	this.data.on('set','content.policyHolder.firstName',function(path,value){},this);

	// Опции
	unsetHidden - обнулять в объекте данных скрытые изначально и скрываемые динамически поля
 */
Resolute.ns('Resolute');
Resolute.Form = Resolute.extend(Resolute.Сontainer, {
	wrap: true,
	unsetHidden: true,
	initComponent: function(){
		// Инициализация компонента
		this.addEvents('change');
		
		var cls = 'form-panel';
		if(this.cls) {
			this.cls += ' '+cls;
		} else {
			this.cls = cls;
		};
		
		// Связывание данных
		if(this.data && Resolute.isObject(this.data) && !(this.data instanceof Resolute.Data.Observable)){
			this.data = Resolute.observe(this.data);
		};
		if(!this.data){
			// Если никаких данных не передано, делаем локальный пустой объект
			this.data = new Resolute.Data.Observable({});
		};
		Resolute.Form.superclass.initComponent.call(this);
	},
	eachField:function(fn,scope){
		// Вызвать функцию для каждого поля (Поле - любой потомок Resolute.Forms.Field)
		var cmps = this.getChildComponents({isFormField:true});
		Resolute.each(cmps,function(fld,index){
			fn.call(scope||this,fld,index);
		},this);
	},
	findField:function(nameOrQuery){
		// Поиск одного поля по имени либо по запросу (объекту)
		var query = nameOrQuery;

		if(isString(nameOrQuery)){
			query = {name: nameOrQuery}
		}
		query['isFormField'] = true;

		var fld = this.getCmp(query);

		return fld;
	},
	getField: function(nameOrQuery){
		// Алиас к findField
		return this.findField(nameOrQuery);
	},
	getFieldV: function(nameOrQuery, path){
		// получение значения поля
		// nameOrQuery - имя или запрос для поиска поля
		// path - путь внутри значения поля
		var fld = this.findField(nameOrQuery);
		
		if(!fld || !fld.getValue){
			return null;
		}

		var value = fld.getValue();
		if(path){
			value = R.xp(value, path);
		}
		
		return value;
	},
	onRender: function(){
		// Отрисовка
		Resolute.Form.superclass.onRender.call(this);
		(function(){
			Resolute.each(this.getChildComponents({rtype:'section'}),this._initSectons,this);
			this.eachField(this._initField,this);
			// Подписки на изменения
			this.data.on('set',this.onPathChange,this);
			this.data.on('state',this.onPathChange,this);
			this.data.on('unstate',this.onPathChange,this);

			this.fireEvent('render', this);
		}).createDelegate(this).defer(1);
	},
	_initSectons:function(section){
		// PRIVATE
		if(section && section.eachField) section.eachField(function(fld){
			if(fld.name && !fld.path){
				fld.path = ((section.namespace)?(section.namespace+'.'):'')+fld.name;
			}
		},this);
	},
	_initField:function(fld){
		// PRIVATE
		if(!fld.name && !fld.path) {
			return;
		}
		if(fld.name && !fld.path){
			fld.path = ((this.namespace)?(this.namespace+'.'):'')+fld.name;
		}
		
		// Если есть данные, связанные с полем, применяем их к полю
		var v = this.data.get(fld.path);
		if(v && fld.setValue){
			fld.setValue(v);
		}

		// Поле могло приобразовать данные при применении - обновляем их в объекте данных
		if(fld.getValue){
			this.data.set(fld.path, fld.getValue());
		}

		// Скрытые поля: обнуляем в данных
		if(this.unsetHidden) {
			if(fld.isHidden()) {
				this.data.set(fld.path, null);
			}
			fld.on('hide', function(fld){
				this.data.set(fld.path, null);
			}, this);
		}

		fld.on('change', this.onFieldChange, this);
		fld.on('setvalue', function(fld, value){
			this.silentField = true;
			this.onFieldChange(fld);
			this.silentField = false;
		}, this);

		// Связываем поля с данными (this.data.components('some.path') -> [{cmp1},{cmp2}]
		if(this.data){
			if(fld.path){
				this.data.attach(fld.path,fld.id);
			} else if(fld.name){
				this.data.attach(fld.name,fld.id);
			}
		}
	},
	onFieldChange:function(fld){
		// Изменение поля
		if(fld.getValue){
			var value = fld.getValue(),
				path = fld.path || fld.name;
			
			this.data.silent = true;
			if(value == '' || value == null){
				this.data.unset(path);
			} else {
				this.data.set(path,value);
			}
			this.data.silent = false;
			
			if(!this.silentField) {
				this.fireEvent('change', fld);
			}
		}
	},
	onPathChange:function(eventCode,path,value,eventObj,data){
		// Слушатель изменений путей в данных
		if(this.namespace){
			if(!Resolute.path.matches(this.namespace,path)) return;
		};
		this.eachField(function(fld){
			if(!fld.path) return;
			if(Resolute.path.matches(path,fld.path)){
				if(eventCode == 'set'){
					// Событие изменения поля
					if(value == null){
						fld.setValue(null);
					} else {
						fld.setValue(value);
					}
				} else if(eventCode == 'state'){
					// Событие проброса состояния
					switch(value){
						case 'enable': fld.enable();break;
						case 'disable': fld.disable();break;
						case 'show': fld.show();break;
						case 'hide': fld.hide();break;
					};
				}
			}
		},this);
	},
	getData:function(){
		// Возвращает объект с данными секции (клонируем, чтобы не давать менять их снаружи через ссылку)
		// Постоянно вызывать этот метод для получения данных секции не нужно, данные обновляются по мере ввода данных в полях (это не метод сбора данных с полей, как ранее было)
		return this.data.getData(true);
	},
	setData:function(obj){
		// TODO!!!! см. Resolute.Data.Observable.setData
		// Установка объекта данных
		this.data.setData(obj);

		// Применение данных к полям формы
		this.eachField(function(fld){
			var path = fld.path || fld.name;
			if(!path || !fld.setValue) return;
			var value = this.data.get(path);
			fld.setValue(value);
			this.silentField = true;
			this.onFieldChange(fld);
			this.silentField = false;
		}, this);
	},
	getErrors:function(){
		// Получить массив полей с ошибками (ссылка на поле и текст ошибки)
		var res = [];
		this.eachField(function(fld){
			if(fld.getError){
				var error = fld.getError();
				if(error){
					res.push({field:fld,error:error});
				}
			};
		},this);
		return (res.length>0)?res:null;
	},
	clearInvalid:function(){
		// Очистить сообщения об ошибках во всех полях
		this.eachField(function(fld){
			if(fld.clearInvalid){
				fld.clearInvalid();
			};
		},this);
	},
	validate:function(silent){
		// Запустить валидацию всех полей
		var valid = true;
		
		this.eachField(function(fld){
			if(fld.validate){
				if(!fld.validate(silent)){
					valid = false;
				}
			}
		}, this);

		return valid;
	},
	isValid:function(){
		// Валидна ли форма в целом
		var res = [];
		this.eachField(function(fld){
			if(fld.isValid){
				res.push((fld.isValid())?1:0);
			};
		},this);
		if(res.count(1)<res.length){
			return false;
		} else {
			return true;
		}
	},
	state:function(path,state){
		this.data.state(path,state);
	},
	disableFields: function(){
		this.eachField(function(fld){
			if(fld && fld.disable) fld.disable();
		}, this);
	},
	enableFields: function(){
		this.eachField(function(fld){
			if(fld && fld.enable) fld.enable();
		}, this);
	}
});
Resolute.reg('form', Resolute.Form);