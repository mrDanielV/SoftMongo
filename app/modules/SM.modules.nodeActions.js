// Обработка действий контекстного меню узла
SM.modules.nodeActions = {
	do: function(action, record, node){
		this.record = record;
		this.node = node;
		this.view = SM.modules.collection.view;

		if(this[action]){
			this[action]();
		}else{
			R.Msg.alert(SM.lang('nodeActions.alerts.001', 'Действие недоступно'));
		}
	},
	update: function(){
		var parent = this;
		var node = this.node;

		// Изменение значения узла
		var form = new Resolute.Window({
			width: 520,
			title: SM.lang('nodeActions.update.form.title', 'Редактировать значение поля'),
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						rtype: 'display',
						ref: 'path',
						label: SM.lang('nodeActions.update.form.path', 'Путь'),
						labelPosition: 'left',
						labelWidth: 80,
						value: '<b>' + R.xp(node, 'path') +'</b>',
					},
					{
						rtype: 'combobox',
						ref: 'type',
						label: SM.lang('nodeActions.update.form.type.label', 'Тип данных'),
						labelPosition: 'left',
						labelWidth: 80,
						clearIcon: null,
						listIcon: null,
						hideClear: true,
						data: [
							{code: 'string', name: SM.lang('nodeActions.update.form.type.string', 'Строка / Текст')},
							{code: 'number', name: SM.lang('nodeActions.update.form.type.number', 'Число')},
							{code: 'mixed', name: SM.lang('nodeActions.update.form.type.mixed', 'Объект / Массив')},
							{code: 'boolean', name: SM.lang('nodeActions.update.form.type.boolean', 'Булевое')},
							{code: 'null', name: SM.lang('nodeActions.update.form.type.null', 'NULL')}
						]
					},
					{
						rtype: 'textarea',
						ref: 'text_value',
						label: SM.lang('nodeActions.update.form.value', 'Значение'),
						labelPosition: 'left',
						labelWidth: 80,
						attr: { spellcheck:'false' },
						grow: true,
						growMax: 300,
						tab: true,
						height: 80
					},
					{
						rtype: 'numberfield',
						ref: 'number_value',
						label: SM.lang('nodeActions.update.form.value', 'Значение'),
						labelPosition: 'left',
						labelWidth: 80,
						dec: 15
					},
					{
						rtype: 'list',
						cls: 'sm_list',
						ref: 'bool_value',
						label: SM.lang('nodeActions.update.form.value', 'Значение'),
						labelPosition: 'left',
						labelWidth: 80,
						data: [
							{code: true, name: 'TRUE'},
							{code: false, name: 'FALSE'}
						],
						value: true
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('apply', 'Применить')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onAfterRender: function(){
				this.setData();

				var type = R.xp(this.components, 'type');
				type.on('change', this.onChange, this);
			},
			onChange: function(fld){
				if(fld.ref == 'type'){
					this.sync();
				}
			},
			sync: function(){
				// установка поля значение от типа данных
				this.valueFld = null;
				var fldName = null;
				var type = R.xp(this.components, 'type').getValue();

				if(type && (type.code == 'string' || type.code == 'mixed')){
					fldName = 'text_value';
				}
				else if(type && type.code == 'number'){
					fldName = 'number_value';
				}
				else if(type && type.code == 'boolean'){
					fldName = 'bool_value';
				}

				if(fldName){
					this.valueFld = R.xp(this.components, fldName);
				}

				if(this.valueFld && type.code == 'mixed'){
					this.valueFld.codding = true;
				}

				R.each(this.components, function(cmp, code){
					if(code == 'type' || code == 'path'){
						return;
					}
					cmp.show();
					if(code != fldName){
						cmp.hide();
					}
				}, this);
			},
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					R.Msg.ask(SM.lang('nodeActions.update.form.confirm', 'Сохранить изменения?'), this.save, this);
				}
			},
			save: function(){
				// Применение действия
				if(!this.validate()){
					return;
				}

				this.getData();

				// применение значения узла к объекту записи
				parent.record.setNodeValue(node.path, this.data);
				this.close();
			},
			validate: function(){
				// валидация данных
				var type = R.xp(this.components, 'type').getValue();
				if(!this.valueFld){
					return true;
				}
				var value = this.valueFld.getValue();

				if(type.code == 'mixed'){
					value = SM.fn.toJSON(value);
					if(!value){
						R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
						return false;
					}
				}

				return true;
			},
			getData: function(){
				// сбор данных с формы
				this.data = {};
				var type = R.xp(this.components, 'type').getValue();

				if(!this.valueFld){
					this.data = null;
					return this.data;
				}

				var value = this.valueFld.getValue();
				if(inArray(type.code, ['number', 'mixed']) && !value){
					this.data = null;
					return this.data;
				}

				if(type.code == 'mixed'){
					value = SM.fn.toJSON(value);
				}

				if(type.code == 'boolean'){
					value = value.code;
				}
				
				this.data = value;
			},
			setData: function(data){
				// установка данных на форму от параметров узла
				var typeFld = R.xp(this.components, 'type');
				if(node.type == 'string'){
					typeFld.setValue('string');
				}
				else if(node.typeC == 'mixed'){
					typeFld.setValue('mixed');
				}
				else if(node.type == 'number'){
					typeFld.setValue('number');
				}
				else if(node.type == 'boolean'){
					typeFld.setValue('boolean');
				}
				if(node.value === null){
					typeFld.setValue('null');
				}

				this.sync();

				var value = node.value;
				if(node.typeC == 'mixed'){
					value = R.clone(node.value);
					value = JSON.stringify(value, null, '\t');
				}

				if(this.valueFld){
					this.valueFld.setValue(value);
				}
			}
		});
	},
	query: function(currentQuery){
		// построить запрос по пути узла
		var parent = this;
		var path = R.xp(this.node, 'path') + '';
		var qw = {};

		// Применение запроса, пришедшего извне
		if(isDefined(currentQuery) && isObject(currentQuery)){
			qw = currentQuery;
		}

		// Добавление к запросу текущего узла
		qw[path] = R.xp(this.node, 'value');

		// Особое построение запроса для MongoId
		if(inArray(R.xp(this.node, 'name'), ['_id', '$oid'])){
			var oid = R.xp(this.record, 'record._id.$oid', R.xp(this.record, 'record._id.$id'));
			qw = {'_id': oid};
		}

		var qwStr = JSON.stringify(qw, null, '\t');


		// Изменение значения узла
		var form = new Resolute.Window({
			width: 600,
			parent: parent,
			title: SM.lang('nodeActions.query.form.title', 'Запрос для поля') + ' ' + path,
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						rtype: 'textarea',
						ref: 'query',
						value: qwStr,
						attr: { spellcheck:'false' },
						style: 'max-height: 300px',
						grow: true,
						tab: true,
						codding: true,
						height: 150
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('execute', 'Выполнить')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					this.save();
				}
			},
			save: function(){
				// Применение действия

				// Получим и проверим запрос
				var query = R.xp(this.components, 'query').getValue();
				queryO = SM.fn.toJSON(query);
				if(!queryO){
					R.Msg.alert(SM.lang('invalidJSON', 'Невалидный JSON!'));
					return false;
				}

				// Применим к основному полю текушего запроса и запустим выполнение
				var mainQueryFld = R.xp(this.parent, 'view.cmps.query');
				if(mainQueryFld){
					mainQueryFld.setValue(query);
					this.parent.view.clearPages();
					this.parent.view.query();
				}
				
				this.close();
			}
		});
	},
	queryAdd: function(){
		// Добавление к существующему запросу
		var qw = {};
		var qwText = '';

		// Получим текущий запрос
		var mainQueryFld = R.xp(this, 'view.cmps.query');
		if(mainQueryFld){
			qwText = mainQueryFld.getValue();
		}

		// Преобразуем в объект JSON
		var qwObj = SM.fn.toJSON(qwText);
		if(qwObj){
			qw = qwObj;
		}

		// Вызов формы запроса для текущего узла
		this.query(qw);
	},
	rename: function(){
		// Изменение пути узла (переименование-перемещение)
		var parent = this;
		var path = R.xp(this.node, 'path') + '';

		// Изменение значения узла
		var form = new Resolute.Window({
			width: 520,
			parent: parent,
			title: SM.lang('nodeActions.rename.form.title', 'Переименовать') + ' ' + path,
			closeByMaskClick: true,
			titleButtons:[
				{code:'close', icon:'mi-close', tooltip: SM.lang('closeWin', 'Закрыть окно')}
			],
			autoShow: true,
			markup:{
				cls: 'form',
				cn: [
					{
						rtype: 'textfield',
						ref: 'path',
						value: path
					}
				]
			},
			buttons:[
				{code: 'ok', name: SM.lang('execute', 'Выполнить')},
				{code: 'close', name: SM.lang('cancel', 'Отмена')}
			],
			onButtonClick: function(btn) {
				if(btn == 'ok'){
					this.save();
				}
			},
			save: function(){
				// Применение действия
				var newpath = R.xp(this.components, 'path').getValue();
				newpath = SM.fn.preparePath(newpath);
				if(!newpath){
					R.Msg.alert(SM.lang('nodeActions.rename.alerts.001', 'Не указан новый путь узла'));
					return false;
				}

				parent.record.renameNode(path, newpath);

				this.close();
			}
		});
	},
	remove: function(){
		// Удаление узла
		var parent = this;
		var path = R.xp(this.node, 'path');

		// Конфирм и удаление
		var msg = SM.lang('nodeActions.remove', 'Удалить {0}?');
		msg = msg.format(path);
		R.Msg.ask(msg, function(){
			parent.record.deleteNode(path);
		}, this);
	},
	clear: function(){
		// Очистить значение узла
		var path = R.xp(this.node, 'path');
		var msg = SM.lang('nodeActions.clear.001', 'Значение узла {0} уже равно NULL! Действие бесмысленно.');
		msg = msg.format(path);

		if(R.xp(this.node, 'value') === null){
			R.Msg.alert(msg);
			return;
		}

		// Конфирм и обнуление
		msg = SM.lang('nodeActions.clear.002', 'Сделать значение {0} = NULL?');
		msg = msg.format(path);
		R.Msg.ask(msg, function(){
			this.record.setNodeValue(path, null);
		}, this);
	},
	copyPath: function(){
		// Копирование пути узла в буфер
		var path = R.xp(this.node, 'path');
		
		var r = SM.fn.copyBuffer(path);
		if(r){
			R.Msg.alert(SM.lang('nodeActions.copyPath.001', 'Скопировано в буфер') + ': ' + path);
		}else{
			R.Msg.alert(SM.lang('nodeActions.copyPath.002', 'Не удалось скопировать в буфер путь') + ': ' + path);
		}
	},
	addIndex: function(){
		// создать индекс по пути узла - вызов формы создания
		var path = R.xp(this.node, 'path');

		SM.modules.collection.indexes.addForm(false, path);
	}
};
