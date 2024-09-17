<?php
/**
 * Основной Класс операция интерфейса
 * @author Daniel Vasiliev
 *
 *		@input dbase = 'db_name'
 *		@input collection = 'collection_name'
 *		@input options = []
 */


class SM {

	private $dbase = null;
	private $collection = null;
	private $cfg = null;
	private $con = null;
	private $options = [];
	private $error = '';
	public $result = null;
	public $msg = null;

	/** 
	 * Статическая форма вызова с получением результата работы класса
	 * 
	 *	@param data - массив параметров экспорта
	 *	[
	 *		operation => 'operation_name'		// код операции (имя функции внутри класса)
	 *		dbase => 'dbase_name', 				// имя БД
	 *		collection => 'collection_name', 	// имя коллекции
	 *		...прочие параметры, которые будут записаны в this->options
	 *	]
	 */
	public static function get($data = []) {
		$success = [ 'success' => true, 'data' => null ];
		$error = ['success' => false, 'msg' => ''];

		// Базовые параметры
		$operation = Utils::xp($data, 'operation');
		$dbase = Utils::xp($data, 'dbase');
		$collection = Utils::xp($data, 'collection');
		$connect = Utils::xp($data, 'connect', true);

		if(!$operation){
			$error['msg'] = Lang::get('serverErrors.SM.004', 'Не указана операция для выполнения!');
			return $error;
		}
		if(!is_callable('self', $operation)){
			$error['msg'] = Lang::get('serverErrors.SM.005', 'Неизвестная операция!');
			return $error;
		}

		// Объект класса
		$self = new self($dbase, $collection, $data);

		// Подключение к БД
		if($connect){
			$self->connect();
			if($self->getError()){
				$error['msg'] = $self->getError();
				return $error;
			}
		}

		// Сохранение текущей БД в куки
		$self->saveDBcookie($self->getDB());

		// Выполнение операции
		$self->$operation();
		if($self->getError()){
			$error['msg'] = $self->getError();
			return $error;
		}

		// Возврат успешного ответа
		$success['data'] = $self->result;
		if($self->msg){
			$success['msg'] = $self->msg;
		}
		return $success;
	}

	/** 
	 * Инициация экземпляра объекта класса
	 * 
	 *	@param dbase <string> - имя БД
	 *	@param collection <string> - имя коллекции
	 *	@param options <array> - прочие параметры
	 */
	public function __construct($dbase = null, $collection = null, $options = []){
		// Установка БД и Коллекции
		$this->setDB($dbase);
		$this->setCollection($collection);

		// Прочие опции
		if(is_array($options) && !empty($options)){
			foreach ($options as $key => $value) {
				if(in_array($key, ['dbase', 'collection', 'operation'])){
					continue;
				}
				$this->setOption($key, $value);
			}
		}

		return $this;
	}

	/** 
	 * Установка БД
	 * 
	 *	@param dbase <string> - имя БД
	 */
	public function setDB($dbase = null){
		if(!$dbase) {
			$dbase = $_COOKIE['SM_DB'];
		}
		$this->dbase = $dbase;

		return $this;
	}

	/** 
	 * Получение текущей БД
	 * @return dbase <string>
	 */
	public function getDB(){
		return $this->dbase;
	}

	/** 
	 * сохранение текущей БД в куки
	 * 
	 *	@param dbase <string> - имя БД
	 */
	public function saveDBcookie($dbase = null){
		// сохранение текущей БД в куки
		if(!$dbase){
			return;
		}

		setcookie('SM_DB', $dbase, 0);
		$_COOKIE['SM_DB'] = $dbase;
	}

	/** 
	 * Установка текущей коллекции
	 * 
	 *	@param collection <string> - имя коллекции
	 */
	public function setCollection($collection = null){
		$this->collection = $collection;

		return $this;
	}

	/** 
	 * Установка параметра и его значения в массив параметров класса
	 * 
	 *	@param name <string> - имя параметра
	 *	@param value <mixed> - значение параметра
	 */
	public function setOption($name, $value = null){
		if(!$name || !is_string($name)){
			return $this;
		}
		$this->options[$name] = $value;

		return $this;
	}

	/** 
	 * Получение значения параметра класса по его имени
	 * 
	 *	@param name <string> - имя параметра
	 *	@param def <mixed> - значение по-умолчанию (если параметр с указанным именем не установлен)
	 */
	public function getOption($name = '', $def = null){
		if(!$name || !is_string($name)){
			return null;
		}
		$value = Utils::xp($this->options, $name, $def);
		return $value;
	}

	/** 
	 * Установка текущей ошибки работы класса
	 * 
	 *	@param error <string> - текст ошибки
	 */
	public function setError($error = null){
		$this->error = $error;

		return $this;
	}

	/** 
	 * Получение текущей ошибки работы класса
	 */
	public function getError(){
		return $this->error;
	}

	/** 
	 * Получение текущего подключения к БД (установленного в $this->connect())
	 * @return instanceof DB
	 */
	public function getCon(){
		return $this->con;
	}

	/** 
	 * Установка соединения с БД
	 * 
	 *	@param dbase <string> - имя БД
	 *	@param server <array> - конфиг подключения к серверу, описывается в connect.cfg.php
	 *	@param update <bool> - флаг: требуется ли переподключение, если подключените с сервером-БД уже установлено
	 *
	 *  @return instanceof DB
	 */
	public function connect($dbase = null, $server = null, $update = false){
		$this->con = null;
		if($update){
			$this->dbase = null;
		}

		// Указываем БД для подключения
		if($dbase){
			$this->setDB($dbase);
		}

		// Получаем базовый конфиг подключения к Mongo
		if(!$server){
			$server = $this->getServer();
		}
		if(!$server){
			$this->error = Lang::get('serverErrors.SM.002', 'Не удалось найти настройки подключения к серверу Mongo');
			return false;
		}

		// Строка подключения - обязательна
		$url = Utils::xp($server, 'link');
		if(!$url) {
			$this->error = Lang::get('serverErrors.SM.003', 'Не указана строка подключения к БД');
			return false;
		}

		// БД - из конфига, если не указано иное
		if(!$this->dbase && Utils::xp($server, 'dbase')) {
			$this->setDB(Utils::xp($server, 'dbase'));
		}

		// Подключаемся
		$options = Utils::xp($server, 'options');
		if($update) {
			$this->con = new DB($url, $this->dbase, $options);
		}else {
			$this->con = DB::getInstance($url, $this->dbase, $options);	
		}

		// Текущую БД получаем от подключения
		if($this->con->getDB()){
			$this->setDB($this->con->getDB());
		}

		// Ошибки подключения		
		if($this->con->getError()) {
			$name = Utils::xp($server, 'name');
			$this->error = Lang::get('serverErrors.SM.001', 'Ошибка подключения');
			$this->error = str_replace('{SERVER}', $name, $this->error);
			$this->error = str_replace('{DB}', $this->dbase, $this->error);
			$this->error = str_replace('{ERROR}', $this->con->getError(), $this->error);
			return false;
		}

		return $this->con;
	}

	/** 
	 * Получение текущего (выбранного или первого по списку) подключения к серверу Mongo
	 *  конфиг подключения к серверу, описывается в connect.cfg.php
	 *  текущий сервер: либо от COOKIE "SM_SERVER", либо первый по списку в конфиге SM_CONNECTIONS (connect.cfg.php)
	 *
	 *  @return server <array>
	 */
	public function getServer(){
		if(!session_id()){
			session_start();
		}
		
		// индекс используемого сервера из SM_CONNECTIONS
		$connections = SM_CONNECTIONS;
		if(is_string($connections)) {
			$connections = json_decode($connections, true);
		}
		$serverIndex = 0;
		if(isset($_COOKIE['SM_SERVER'])){
			$serverIndex = $_COOKIE['SM_SERVER'];
		}

		$server = isset($connections[$serverIndex])?$connections[$serverIndex]:null;

		return $server;
	}

	// ОПЕРАЦИИ
	public function getCookie(){
		// получение из куки сохраненных индекса Сервера и БД для установки по умолчанию
		$server = Utils::xp($_COOKIE, 'SM_SERVER');
		$dbase = Utils::xp($_COOKIE, 'SM_DB');

		// Если сервер не сохранен, прекращаем процесс
		if(!is_numeric($server)){
			setcookie('SM_DB', '', time() - 3600);
			unset($_COOKIE['SM_DB']);
			$this->result = [];
			return $this->result;
		}

		// Если указана БД, надо проверить её на принадлежность серверу
		if($dbase){
			$list = $this->getDBlist();
			$databases = Utils::xp($list, 'databases', []);
			$is = Utils::findIn($databases, 'name', $dbase);
			if(!$is){
				$dbase = '';
			}
		}

		$this->result = [
			'server' => $server,
			'dbase' => $dbase
		];

		return $this->result;
	}

	public function getServerlist(){
		// Получение  списка серверов от конфига
		$servers = (!empty(SM_CONNECTIONS))?SM_CONNECTIONS:[];
		if(is_string($servers)) {
			$servers = json_decode($servers, true);
		}
		if(!is_array($servers)) {
			$servers = [];
		}
		
		$this->result = [];
		foreach ($servers as $server) {
			$name = Utils::xp($server, 'name');
			if(!$name){
				$name = Utils::xp($server, 'link');
			}

			$info = $this->getServerInfo($server);

			$this->result[] = ['name' => $name, 'data' => $info];
		}

		return $this->result;
	}

	public function getServerInfo($server = []){
		// Инфо - версия, хост, - по серверу
		// $server - массив-конфиг сервера в формате SM
		$dbase = Utils::xp($server, 'dbase');

		$this->connect($dbase, $server, true);
		if($this->error){
			$this->error = null;
			return ['connect' => false];
		}

		$info = $this->con->serverStats();
		if(Utils::xp($info, 'success') === false) {
			$this->error = null;
			return ['connect' => false];
		}

		$res = [
			'connect' => true,
			'host' => Utils::xp($info, 'host'),
			'version' => Utils::xp($info, 'version'),
			'pid' => Utils::xp($info, 'pid')
		];

		return $res;
	}

	public function setServer($index = null){
		// установка текущего сервера по его индексу
		if(!session_id()){
			session_start();
		}

		if(is_null($index)){
			$index = $this->getOption('index');
		}
		if(is_string($index)){
			$index = intval($index);
		}
		if(!$index){
			$index = 0;
		}

		// сохраняем индекс используемого сервера в куки
		setcookie('SM_SERVER', $index, 0);
		$_COOKIE['SM_SERVER'] = $index;

		// Убиваем БД из куки
		setcookie('SM_DB', '', time() - 3600);
		unset($_COOKIE['SM_DB']);
	}

	public function getDBlist(){
		// Получение  списка БД
		$this->result = $this->con->listDatabases(false);
		
		if($this->con->getError()) {
			$this->error = Lang::get('serverErrors.SM.006', 'Не удалось получить список БД сервера').': '.$this->con->getError();
			$this->result = null;
		}

		return $this->result;
	}

	public function createDB ($name = null){
		// создание БД
		if(is_null($name)){
			$name = $this->getOption('name');
		}

		// Проверка существования БД
		$is = $this->con->databaseExists($name);
		if($is){
			$this->error = Lang::get('serverErrors.SM.006', 'Такая БД уже существует на сервере');
			return null;
		}

		// Подключение к БД
		$this->connect($name);
		if($this->error){
			return null;
		}

		// создание в БД коллекции
		try {
			$r = $this->con->createCollection('init', []);
			if(!Utils::xp($r, 'ok')){
				$this->error = Lang::get('serverErrors.SM.007', 'Не удалось создать коллекцию');
				return null;
			}
		} catch (\Exception $e) {
			$this->error = Lang::get('serverErrors.SM.008', 'Не удалось создать БД').': '.$e->getMessage();
			return null;
		}

		return $this->con;
	}

	public function getCollections($listOnly = false){
		// Получение списка коллекций и их параметров (массив объектов)
		// $listOnly - получить простой индексный массив имён коллекций
		$this->result = $this->con->collectionList();
		if(isset($this->result['success']) && $this->result['success'] == false){
			$this->error = Lang::get('serverErrors.SM.010', 'Не удалось подключиться к выбранной БД').': '.$list['errMsg'];
			return null;
		}

		// Для опции получить только простой список, возвращаем его
		if($listOnly){
			return $this->result;
		}

		// Получаем полную статистику по списку коллекций
		$collections = [];
		//$nodes = ['size', 'count', 'avgObjSize', 'storageSize', 'nindexes', 'totalIndexSize', 'indexSizes'];
		$nodes = ['size', 'count', 'avgObjSize', 'storageSize', 'nindexes', 'totalIndexSize'];
		foreach ($this->result as $collection) {
			$stats = $this->con->collectionStats($collection);
			if(!$stats){
				continue;
			}

			$coll = ['code' => $collection, 'name' => $collection];
			foreach ($nodes as $param) {
				$coll[$param] = Utils::xp($stats, $param);
			}

			$collections[] = $coll;
		}
		$this->result = $collections;

		return $collections;
	}

	public function statsCollection($collection = ''){
		// получение параметров коллекции - размер, количество записей, индексов и т.п.
		$this->result = [];
		$nodes = ['size', 'count', 'avgObjSize', 'storageSize', 'nindexes', 'totalIndexSize'];
		
		if($collection) {
			$this->collection = $collection;
		}

		$stats = $this->con->collectionStats($this->collection);
		if(!$stats){
			return $this->result;
		}

		foreach ($nodes as $param) {
			$this->result[$param] = Utils::xp($stats, $param);
		}

		return $this->result;
	}

	public function createCollection($name = null){
		// Создание коллекции
		if(!$name){
			$name = $this->getOption('name');
		}
		if(!$name || !is_string($name)){
			$this->error = Lang::get('serverErrors.SM.011', 'Не указано наименование коллекции для создания');
			return null;
		}

		$r = $this->con->createCollection($name, []);
		if(!Utils::xp($r, 'ok')){
			$this->error = Lang::get('serverErrors.SM.012', 'Не удалось создать коллекцию');
			return false;
		}

		return true;
	}

	public function dropCollection($name = null){
		// Удаление коллекции
		if($name){
			$this->collection = $name;
		}

		$r = $this->con->dropCollection($this->collection);
		if(!Utils::xp($r, 'ok')){
			$this->error = Lang::get('serverErrors.SM.013', 'Ошибка удаление коллекции').': '.Utils::xp($r, 'errMsg');
			return false;
		}
		if($this->con->getError()) {
			$this->error = Lang::get('serverErrors.SM.013', 'Ошибка удаление коллекции').': '.$this->con->getError();
			return false;
		}

		return true;
	}

	public function query(){
		// Выполнение запроса
		// Запрос, тип запроса и другие параметры ожидаются только в $this->options
		$this->result = [];
		$this->result['records'] = [];

		$time0 = microtime(true);

		// Параметры запроса
		$type = $this->getOption('type.code');
		$query = $this->getOption('query');
		$querySet = $this->getOption('querySet');
		$sort = $this->getOption('sort');
		$fields = $this->getOption('fields.items');
		$limit = $this->getOption('limit', 10);
		$skip = $this->getOption('skip', 0);

		if(!in_array($type, ['select', 'modify', 'remove'])){
			$this->error = Lang::get('serverErrors.SM.query.001', 'Недопустимый тип запроса');
			return false;
		}

		// Запрос
		if(!$query){
			$query = '{}';
		}
		if(is_string($query)){
			$query = json_decode($query, true);
		}
		if(!is_array($query)){
			$this->error = Lang::get('serverErrors.SM.query.002', 'Невалидный JSON-формат запроса');
			return false;
		}

		// Обработка MongoID в запросе
		if(Utils::xp($query, '_id') || isset($query['_id.$oid']) || isset($query['_id.$id'])){
			$oid = isset($query['_id.$oid'])?$query['_id.$oid']:$query['_id'];
			if(!$oid) {
				$oid = isset($query['_id.$id'])?$query['_id.$id']:null;
			}
			if($oid && is_string($oid)){
				unset($query['_id']);
				unset($query['_id.$oid']);
				unset($query['_id.$id']);
				$query['_id'] = MObjects::mongoId($oid);
			}
		}

		// Применение Mongo-объектов
		$query = MObjects::apply($query);

		// Запрос на изменение - обработка, проверка
		if($type == 'modify'){
			if(is_string($querySet)){
				$querySet = json_decode($querySet, true);
			}
			if(!$querySet || !is_array($querySet) || !Utils::xp($querySet, '$set') || !is_array(Utils::xp($querySet, '$set')) || empty(Utils::xp($querySet, '$set'))){
				$this->error = Lang::get('serverErrors.SM.query.003', 'Невалидный JSON-формат запроса на изменение ($set ...)');
				return false;
			}
		}

		// сортировка
		$sort = $this->prepareSort($sort);

		// Поля
		$fields = $this->prepareFields($fields);

		// Select
		if($type == 'select') {
			$count = $this->con->count($this->collection, $query);
			$this->result['count'] = $count;

			$r = $this->con->find($this->collection, $query, $fields, $sort, $limit, $skip);
			if(!$r) {
				$this->error = Lang::get('serverErrors.SM.query.004', 'Ошибка выполнения запроса').': '.$this->con->getError();
				return false;
			}
			$this->result['records'] = $this->con->getCursorArray($r);
		}

		// Modify / Remove
		if($type == 'modify' || $type == 'remove') {
			// Сначала получение общего количества записей по запросу
			$count = $this->con->count($this->collection, $query);
			if(!$count){
				$this->error = Lang::get('serverErrors.SM.query.005', 'Нет записей для обновления!');
				if($type == 'remove'){
					$this->error = Lang::get('serverErrors.SM.query.006', 'Нет записей для удаления!');
				}
				if($this->con->getError()) {
					$this->error = $this->con->getError();
				}
				return false;
			}

			// Выполнение запроса
			if($type == 'modify'){
				$r = $this->con->update($this->collection, $query, $querySet, [ 'multi' => 1, 'upsert' => 0 ]);
			}
			else if($type == 'remove'){
				$r = $this->con->delete($this->collection, $query);
			}

			// Обработка ошибок
			if(!$r) {
				$this->error = $this->con->getError();
				return false;
			}
			if($r && !Utils::xp($r, 'ok')){
				$err = Utils::xp($r, 'err', Lang::get('serverErrors.SM.query.007', 'Ошибка выполнения запроса...'));
				$this->error = $err;
				return false;
			}

			// Подготовка возврата
			if($type == 'modify'){
				$this->result['updated'] = $count;
				$this->msg = Lang::get('serverErrors.SM.query.008', 'Обновлено записей:').' '.$count;
			}
			else if($type == 'remove'){
				$this->result['deleted'] = $count;
				$this->msg = Lang::get('serverErrors.SM.query.009', 'Удалено записей:').' '.$count;
			}

			// Для Modify - вернем все записи, затронутые запросом
			if($type == 'modify'){
				$this->result['count'] = $count;

				$r = $this->con->find($this->collection, $query);
				if($r){
					$this->result['records'] = $this->con->getCursorArray($r);
				}
			}
		}

		// Время выполнения
		$time1 = microtime(true);
		$time = $time1 - $time0;
		$this->result['time'] = round($time, 5);

		return $this->result;
	}

	public function upsert($record = null){
		// Изменение/Добавление записи в коллекцию
		if(!$record){
			$record = $this->getOption('record');
		}
		if(!$record || !is_array($record) || empty($record)){
			$this->error = Lang::get('serverErrors.SM.014', 'Не указана запись для сохранения или неверный формат объекта записи');
			return null;
		}

		// MongoID как критерий - изменение/создание
		$oid = Utils::xp($record, '_id.$oid', Utils::xp($record, '_id.$id'));

		// Применение Mongo-объектов
		$record = MObjects::apply($record);

		// Сохранение
		if($oid){
			$id = MObjects::mongoId($oid);
			$record['_id'] = $id;
			$r = $this->con->update($this->collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 1]);
		}
		// Добавление 
		else{
			$r = $this->con->insert($this->collection, $record);
		}

		// Обработка ошибок
		if(!$r) {
			$this->error = $this->con->getError();
			return false;
		}
		if(!Utils::xp($r, 'ok')){
			$this->error = Lang::get('serverErrors.SM.015', 'Не удалось сохранить запись!');
			return false;
		}

		return true;
	}

	public function aggregate($pipeline = null, $checkLimit = true){
		// Выполнение запроса агрегации
		$this->result = [];
		if(!$pipeline){
			$pipeline = $this->getOption('pipeline');
		}

		$this->result = $this->con->aggregate($this->collection, $pipeline);
		if(!$this->result) {
			$this->error = $this->con->getError();
			return false;
		}

		// Курсор результата в массив
		$this->result = $this->con->getCursorArray($this->result);

		// Ограничение на объем записей
		// Rem: вероятно корректней было сделать foreach по результату и по достижению N-ой записи - возвращать ошибку ограничения записей
		if($checkLimit && sizeof($this->result) > 500){
			$this->error = Lang::get('serverErrors.SM.016', 'Результат запроса агрегации содержит больше 500 записей. Используйте операторы $limit и $skip, чтобы поделить общее количество на составные части.');
			return false;
		}

		return $this->result;
	}

	public function explain($query = [], $sort = []){
		// Explain (для FIND, общего типа (allPlansExecution)) запроса
		$this->result = [];

		if(empty($query)){
			$query = $this->getOption('query');
		}
		if(empty($sort)){
			$sort = $this->getOption('sort');
			if(!empty($sort)){
				$sort = $this->prepareSort($sort);
			}
		}

		$this->result = $this->con->explain($this->collection, $query, $sort);
		if(!$this->result) {
			$this->error = $this->con->getError();
			return false;
		}

		return $this->result;
	}

	public function updatePath($oid = null, $path = '', $value = null){
		// Обновление значения узла в БД записи
		if(!$oid) $oid = $this->getOption('oid');
		if(!$path) $path = $this->getOption('path');
		if(!$value) $value = $this->getOption('value');

		if(!$oid || !$path){
			$this->error = Lang::get('serverErrors.SM.017', 'Недостаточно данных для совершения операции!');
			return null;
		}

		$record = $this->getRecord($oid);
		if(!$record){
			$this->error = Lang::get('serverErrors.SM.018', 'Не удалось найти запись в БД!');
			return null;
		}

		$querySet = ['$set' => [$path => $value]];
		$r = $this->con->update($this->collection, ['_id' => $record['_id']], $querySet, ['multi' => 0, 'upsert' => 0]);
		if(!$r) {
			$this->error = Lang::get('serverErrors.SM.019', 'Не удалось сохранить запись').': '.$this->con->getError();
			return false;
		}

		return true;
	}

	public function deletePath($oid = null, $path = ''){
		// Удаление узла записи по указанному пути
		if(!$oid) $oid = $this->getOption('oid');
		if(!$path) $path = $this->getOption('path');

		if(!$oid || !$path){
			$this->error = Lang::get('serverErrors.SM.017', 'Недостаточно данных для совершения операции!');
			return null;
		}

		$record = $this->getRecord($oid);
		if(!$record){
			$this->error = Lang::get('serverErrors.SM.018', 'Не удалось найти запись в БД!');
			return null;
		}

		Utils::remove($record, $path);

		$r = $this->con->update($this->collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 0]);
		if(!$r) {
			$this->error = Lang::get('serverErrors.SM.019', 'Не удалось сохранить запись').': '.$this->con->getError();
			return false;
		}
		
		$this->result = $record;

		return true;
	}

	public function renamePath($oid = null, $path = '', $newpath = ''){
		// Переименование узла записи по указанному пути на новый путь
		if(!$oid) $oid = $this->getOption('oid');
		if(!$path) $path = $this->getOption('path');
		if(!$newpath) $newpath = $this->getOption('newpath');

		if(!$oid || !$path || !$newpath){
			$this->error = Lang::get('serverErrors.SM.017', 'Недостаточно данных для совершения операции!');
			return null;
		}

		$record = $this->getRecord($oid);
		if(!$record){
			$this->error = Lang::get('serverErrors.SM.018', 'Не удалось найти запись в БД!');
			return null;
		}

		// Значение по пути
		$value = Utils::xp($record, $path);

		// Опеределим родственность путей - если изменения только в последней части, то попытаемся сохранить местоположение узла внутри родителя
		$arr1 = explode('.', $path);
		$arr2 = explode('.', $newpath);
		$last1 = $arr1[sizeof($arr1)-1];
		$last2 = $arr2[sizeof($arr2)-1];
		unset($arr1[sizeof($arr1)-1]);
		unset($arr2[sizeof($arr2)-1]);
		$parent1 = implode('.', $arr1);
		$parent2 = implode('.', $arr2);
		$sames = false;
		if($parent1 == $parent2){
			$sames = true;
		}

		// Переименование внутри одного родителя
		if($sames){
			$parent = Utils::xp($record, $parent1);
			if($parent1 === ''){
				$parent = $record;
			}
			$new = [];
			foreach ($parent as $p => $v) {
				if($p == $last1){
					$new[$last2] = $v;
				}else{
					$new[$p] = $v;
				}
			}
			if($parent1){
				Utils::put($record, $parent1, $new);
			}else{
				$record = $new;
			}
		}
		// Перемещение по новому пути
		else{
			Utils::remove($record, $path);
			Utils::put($record, $newpath, $value);
		}

		// Сохранение записи
		$r = $this->con->update($this->collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 0]);
		if(!$r) {
			$this->error = Lang::get('serverErrors.SM.019', 'Не удалось сохранить запись').': '.$this->con->getError();
			return false;
		}

		$this->result = $record;

		return true;
	}

	public function getRecord($oid = null, $fields = null){
		// Получение записи коллекции по MongoID
		if(!$oid){
			$oid = $this->getOption('id.$oid');
		}
		if(!$oid){
			$oid = $this->getOption('id.$id');
		}
		if(!$fields){
			$fields = $this->getOption('fields.items');
		}
		if(!$oid){
			$this->error = Lang::get('serverErrors.SM.020', 'Не удалось получить MongoID записи!');
			return false;
		}

		$fields = $this->prepareFields($fields);

		// получение записи в БД
		$id = MObjects::mongoId($oid);
		$this->result = $this->con->findOne($this->collection, ['_id' => $id], $fields);
		if(!$this->result){
			$this->error = Lang::get('serverErrors.SM.018', 'Не удалось найти запись в БД!');
			if($this->con->getError()) {
				$this->error.= ' '.Lang::get('serverErrors.SM.022', 'Ошибка').': '.$this->con->getError();
			}
			return null;
		}

		return $this->result;
	}

	public function removeRecord($oid = null){
		// Получение записи коллекции по MongoID
		if(!$oid){
			$oid = $this->getOption('id.$oid');
		}
		if(!$oid){
			$oid = $this->getOption('id.$id');
		}
		if(!$oid){
			$this->error = Lang::get('serverErrors.SM.020', 'Не удалось получить MongoID записи!');
			return false;
		}

		// получение записи в БД
		$id = MObjects::mongoId($oid);
		$record = $this->con->findOne($this->collection, ['_id' => $id], []);
		if(!$record){
			$this->error = Lang::get('serverErrors.SM.018', 'Не удалось найти запись в БД!');
			if($this->con->getError()) {
				$this->error.= ' '.$this->con->getError();
			}
			return null;
		}

		// Удаление записи
		$r = $this->con->delete($this->collection, ['_id' => $id]);
		if(!$r) {
			$this->error = Lang::get('serverErrors.SM.021', 'Ошибка выполнения запроса').': '.$this->con->getError();
			return false;
		}
		if(!Utils::xp($r, 'ok')){
			$err = Utils::xp($r, 'err', Lang::get('serverErrors.SM.021', 'Ошибка выполнения запроса'));
			$this->error = $err;
			return false;
		}

		return true;
	}

	public function getIndexes(){
		// Получение индексов по коллекции
		$this->result = [];

		$list = $this->con->listIndexes($this->collection);
		$stats = $this->con->getIndexes($this->collection);
		if($this->con->getError()) {
			$this->error = Lang::get('serverErrors.SM.023', 'Ошибка получения индексов').': '.$this->con->getError();
			return false;
		}

		if(is_array($list)){
			foreach ($list as $index) {
				$name = Utils::xp($index, 'name');
				$stat = Utils::findIn($stats, 'name', $name);
				if($stat){
					$index = array_merge($index, $stat);
				}
				$this->result[] = $index;
			}
		}

		// сортируем по дате создания
		usort($this->result, [self::class, 'sortIndexes']);

		return $this->result;
	}

	public function createIndex($index = null){
		// Создание индекса
		// $index = [name => 'имя индекса', items => [['path1' => ord], ['path2' => ord], ...], 'unique' => true/false]
		if(!$index){
			$index = $this->getOption('index');
		}
		if(!$index || !is_array($index)){
			$this->error = Lang::get('serverErrors.SM.024', 'Не указаны параметры индекса');
			return null;
		}

		// Параметры индекса
		$name = Utils::xp($index, 'name', '');
		$unique = Utils::xp($index, 'unique', '');
		$items = Utils::xp($index, 'items', []);
		if(!$items || !is_array($items) ||  empty($items)){
			$this->error = Lang::get('serverErrors.SM.025', 'Недостаточно параметров (ключей) для создания индекса');
			return false;
		}

		$options = ['background' => true];
		if($unique){
			$options['unique'] = true;
		}

		// Формирования ключей индекса
		$keys = [];
		foreach ($items as $item) {
			$path = Utils::xp($item, 'path');
			$ord = Utils::xp($item, 'ord');
			$keys[$path] = $ord;
		}

		// Создание индекса
		$res = $this->con->createIndex($this->collection, $keys, $options, $name);
		if($this->con->getError()) {
			$this->error = Lang::get('serverErrors.SM.026', 'Ошибка создания индекса').': '.$this->con->getError();
			return false;
		}

		return true;
	}

	public function dropIndex($name = null){
		// Удаление индекса
		if(!$name){
			$name = $this->getOption('name');
		}
		if(!$name || !is_string($name)){
			$this->error = Lang::get('serverErrors.SM.027', 'Не указано наименование индекса для удаления');
			return null;
		}

		// Удаление индекса
		$res = $this->con->dropIndex($this->collection, $name);
		if($this->con->getError()) {
			$this->error = Lang::get('serverErrors.SM.028', 'Ошибка удаление индекса').': '.$this->con->getError();
			return false;
		}

		return true;
	}

	public function getPathes(){
		// получение массива путей по объектам коллекции
		$this->result = [];

		if(!$this->collection || !$this->con){
			return $this->result;
		}

		// Получим первые 10 записей
		$r = $this->con->find($this->collection, [], [], ['_id' => -1], 10, 0);
		$this->result = self::mergePathes($r, $this->result);

		// Получим последние 10 записей
		$r = $this->con->find($this->collection, [], [], ['_id' => 1], 10, 0);
		$this->result = self::mergePathes($r, $this->result);

		return $this->result;
	}

	public function prepareFields($fields = null){
		// Подготовка "Полей" запроса из формата UI в формат запроса
		if(!$fields){
			$fields = [];
		}

		// Если поля просто перечисленны массивом, то нужно привести их к виду ['имя поля' => 1, ...]
		if(isset($fields[0])){
			$newFields = [];
			foreach ($fields as $fld) {
				if($fld) $newFields[$fld] = 1;
			}
			$fields = $newFields;
		}

		return $fields;
	}

	public function prepareSort($sort = null){
		// Подготовка "Сортировки" запроса из формата UI в формат запроса
		$sortItems = Utils::xp($sort, 'items');
		
		$sort = [];
		if($sortItems && is_array($sortItems)) {
			foreach ($sortItems as $srt) {
				$sort[$srt['path']] = $srt['ord'];
			}
		}
		if(empty($sort)){
			// по умолчанию сортировка по _Id (DESC)
			$sort['_id'] = -1;
		}

		return $sort;
	}

	// ПРОЧЕЕ
	private static function sortIndexes($a, $b){
		$as = Utils::xp($a, 'name');
		$bs = Utils::xp($b, 'name');

		if($as > $bs) {
			return 1;
		}

		return 0;
		/*if(PHP_VERSION_ID < 70000){
			return ($as > $bs);
		}
		return $as <=> $bs;*/
	}

	private static function mergePathes($rcur, $result = []){
		foreach ($rcur as $record) {
			$pathes = Utils::pathes($record);
			
			if($pathes && is_array($pathes) && !empty($pathes)){
				foreach ($pathes as $item) {
					$path = $item['path'];

					if(!in_array($path, $result)){
						$result[] = $path;
					}
				}
			}
		}

		return $result;
	}

}
?>