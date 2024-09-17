<?php
/** Класс работы с MongoDB для PHP7+, Драйвер: \MongoDB\Driver\Manager
 *	@ Daniel, 2023
 *	
 *	Поддержка набора функций для работы с БД
 *	Для подключения требует строку подключения (описание формата в классе \DB)
 *	Желательно использование в контексте прокси класса \DB
 */

class Mongo7 {

	use CommonMongoT;

	public $con = null;
	private $dbase = null;
	private $collection = null;
	private $options = [];

	private $parent = null;
	private $error = null;

	private $bulk = null;
	private $wc = null;

	/**
	 * Инициализация экземпляра класса
	 *
	 * @param $connectionLink - строка подключения, описание формата см. в классе \DB
	 * @param $options - массив опций класса \DB, используются
	 *		- admin <string> - строка авторизации к БД admin
	 *		- cursorTimeout - таймаут курсора, корректней менять функцией setCursorTimeout()
	 * @param $parent - ссылка на экземпляр класса \DB
	 *
	 * @return this
	 */
	public function __construct($connectionLink = '', $options = [], $parent = null){
		$this->options = $options;

		$this->setParent($parent);

		$this->connect($connectionLink);

		return $this;
	}

	/**
	 * Подключение к серверу и БД, возвращает экземпляр класса \MongoDB\Driver\Manager
	 *
	 * @param $connectionLink - строка подключения, описание формата см. в классе \DB
	 *
	 * @return instanceof \MongoDB\Driver\Manager
	 */
	public function connect($connectionLink = ''){
		if(!$connectionLink) {
			$this->setError(Lang::get('serverErrors.Mongo.002', 'DB: Не указан URL подключения к MongoDB'));
			return false;
		}

		try {
			$this->con = new \MongoDB\Driver\Manager($connectionLink);
		} catch (\Throwable $e) {
			$this->setError($e->getMessage());
			return false;
		}

		// Осторожно, выполнение команды serverStats может замедлять работу Драйвера (подключения)
		// Но дает уже на этапе подключения выяснить - удалось ли подключиться к серверу
		if(!method_exists($this->con, 'executeCommand') || empty($this->serverStats())) {
			$this->setError(Lang::get('serverErrors.Mongo.001', 'DB: Не удалось подключиться к серверу'));
			return false;
		}

		return $this->con;
	}

	/**
	 * Установка (изменение) БД, отличной от БД в строке подключения
	 *
	 * @param $dbase - имя БД
	 *
	 * @return this
	 */
	public function setDB($dbase = null) {
		if(!$dbase) {
			$this->setError(Lang::get('serverErrors.DB.003', 'DB: Не указано имя базы данных'));
			return false;
		}

		$this->dbase = $dbase;

		return $this;
	}

	/**
	 * Установка таймаута выполнения запросов в милисекундах, для отключения таймаута: setCursorTimeout()
	 *
	 * @param $ms <int> - таймаут в милисекундах
	 */
	public function setCursorTimeout($ms = 0) {
		$this->setOption('cursorTimeout', $ms);
	}

	/**
	 * Выполнение команды в формате MongoDB
	 *
	 * @param $cmd <array> - команда в формате ['<имя команды>' => '<параметр>', ...], пример: ['collStats' => 'test']
	 * @param $dbase <string> - имя БД
	 *
	 * @return <MongoCursor>/false
	 */
	public function command($cmd = [], $dbname = '') {
		if(!$dbname) {
			$dbname = $this->dbase;
		}
		if(!$dbname) {
			$dbname = 'admin';
		}
		if(empty($cmd)) {
			$this->setError(Lang::get('serverErrors.Mongo.003', 'DB command: Не указана команда'));
			return false;
		}

		$res = null;
		
		$cmd = new MongoDB\Driver\Command($cmd, ['maxAwaitTimeMS' => $this->getOption('maxAwaitTimeMS')]);
		try {
			$res = $this->con->executeCommand($dbname, $cmd);
		} catch (\Throwable $e) {
			$this->setError($e->getMessage());
			return false;
		}

		return $res;
	}

	/**
	 * Список БД сервера
	 * пользователь должен обладать правом доступа к коллекции "admin"!
	 *
	 * @param $listOnly <bool> - вернуть только массив-список имён БД, иначе - полный массив-ответ от БД (включая статистику по списку БД)
	 * @param $options <array> - опции команды listDatabases, см. https://www.mongodb.com/docs/manual/reference/command/listDatabases/
	 *
	 * @return <array>
	 */
	public function listDatabases($listOnly = true, $options = []) {
		$cmd = ['listDatabases' => 1];

		if(!empty($options)) {
			$cmd = array_merge($cmd, $options);
		}

		$res = $this->command($cmd, 'admin');
		$res = $this->getCursorFirst($res);

		if($listOnly) {
			$res = isset($res['databases'])?$res['databases']:[];
		}

		return $res;
	}

	/**
	 * Проверить, существует ли БД с именем $dbase в текущем подключении/сервере
	 * пользователь должен обладать правом доступа к коллекции "admin"!
	 *
	 * @param $dbase <string> - имя БД
	 *
	 * @return <bool>
	 */
	public function databaseExists($dbase = '') {
		$res = $this->command(['listDatabases' => 1, 'filter' => ['name' =>  $dbase]], 'admin');
		$res = $this->getCursorFirst($res);
		$databases = isset($res['databases'])?$res['databases']:[];

		if(empty($databases)) {
			return false;
		}

		return true;
	}

	/**
	 * Список коллекций текущей БД
	 *
	 * @param $listOnly <bool> - вернуть только массив-список имён коллекций, иначе - полный массив-ответ от БД (включая статистику по списку коллекций)
	 *
	 * @return <array> - отсортированный по алфавиту массов имён
	 */
	public function collectionList($listOnly = true) {
		// Список коллекций
		$cmd = ['listCollections' => 1];
		
		$res = $this->command($cmd, $this->dbase);
		$res = $this->getCursorArray($res);

		if($listOnly) {
			$list = [];
			foreach ($res as $v) {
				$list[] = $v['name'];
			}
			sort($list, SORT_STRING);
			$res = $list;
		}

		return $res;
	}

	/**
	 * Проверка существования коллекции с указанным именем
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <bool>
	 */
	public function collectionExists($collection = '') {
		// Проверка коллекции на существование
		if(!$collection) {
			$this->setError('DB collectionExists: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['listCollections' => 1, 'filter' => ['name' => $collection]];
		$res = $this->command($cmd, $this->dbase);

		$res = $this->getCursorFirst($res);

		if(empty($res)) {
			return false;
		}

		return true;
	}

	/**
	 * Статистика по коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>
	 */
	public function collectionStats($collection = '') {
		if(!$collection) {
			$this->setError('DB collectionStats: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$res = $this->command(['collStats' => $collection]);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Создание коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $options <array> - опции создания коллекции
	 *
	 * @return <array>/false
	 */
	public function createCollection($collection = '', $options = []) {
		if(!$collection) {
			$this->setError('DB createCollection: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['create' => $collection];

		if (!empty($options)) {
			$cmd = array_merge($cmd, $options);
		}

		$res = $this->command($cmd, $this->dbase);
		$res = $this->getCursorFirst($res);
		
		return $res;
	}

	/**
	 * Удаление коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function dropCollection($collection = '') {
		if(!$collection) {
			$this->setError('DB dropCollection: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['drop' => $collection];
		$res = $this->command($cmd, $this->dbase);
		$res = $this->getCursorFirst($res);
		
		return $res;
	}

	/**
	 * Статистика по серверу
	 *
	 * @return <array>
	 */
	public function serverStats() {
		$res = $this->command(['serverStatus' => 1]);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Статистика по текущей БД
	 *
	 * @return <array>
	 */
	public function stats() {
		$res = $this->command(['dbStats' => 1]);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Получение индексов коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function listIndexes($collection = '') {
		if(!$collection) {
			$this->setError('DB listIndexes: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = ['listIndexes' => $collection];
		$res = $this->command($cmd, $this->dbase);
		$res = $this->getCursorArray($res);
		
		return $res;
	}

	/**
	 * Получение индексов коллекции, включая статистику
	 *
	 * @param $collection <string> - имя коллекции
	 *
	 * @return <array>/false
	 */
	public function getIndexes($collection = '') {
		if(!$collection) {
			$this->setError('DB getIndexes: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$res = $this->aggregate($collection, [
			[
				'$indexStats' => new stdClass()
			]
		]);
		$res = $this->getCursorArray($res);

		// Когда индекс один, он возвращается в другом формате
		if (is_array($res) && !empty($res) && is_string($res[0]) && $res[0] == '_id_') {
			$res = [[
				'name' => $res[0],
				'key' => isset($res[1])?$res[1]:[],
				'host' => isset($res[2])?$res[2]:null,
				'accesses' => isset($res[3])?$res[3]:null,
			]];
		}

		return $res;
	}

	/**
	 * Создание индекса в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $key <string>/<array> - ключи (пути) полей индекса
	 *			могут быть строкой ('path.path1') или массивом (['path.path1' => 1, 'path3' => -1]) с указанием направления индексирования (убывание/возрастание)
	 * @param $options <array> - опции создаваемого индекса, например - уникальность значений: ['unique' => true]
	 *			см. https://www.mongodb.com/docs/current/reference/command/createIndexes/
	 * @param $name <string> - имя индекса, 
	 *			если имя не указано, то формируется автоматически от ключа. 
	 *			именно поэтому $name - последний параметр функции
	 *
	 * @return <array>/false
	 */
	public function createIndex($collection = '', $key = '', $options = [], $name = '') {
		if(!$collection) {
			$this->setError('DB createIndex: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!$key) {
			$this->setError(Lang::get('serverErrors.Mongo.004', 'DB createIndex: Не указан ключ (путь) индекса'));
			return false;
		}

		// Формирование ключа
		if (is_string($key)) {
			$path = $key;
			$key = [];
			$key[$path] = 1;
		}
		if (!is_array($key)) {
			$this->setError(Lang::get('serverErrors.Mongo.005', 'DB createIndex: Некорректный ключ индекса'));
			return false;
		}

		// Автоматическое формирование наименования индекса
		if (!$name) {
			$names = [];
			foreach ($key as $keyName => $value) {
				$names[] = $keyName;
				$names[] = $value;
			}
			$name = implode('_', $names);
		}

		// Формирование индекса
		$index = [
			'key'	=> $key,
			'name'	=> $name,
		];
		if(!empty($options)){
			$index = array_merge($options, $index);
		}

		$cmd = ['createIndexes' => $collection, 'indexes' => [$index]];

		$res = $this->command($cmd);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Удаление индекса по его наименованию
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $name <string> - имя индекса
	 *
	 * @return <array>/false
	 */
	public function dropIndex($collection = '', $name = '') {
		if(!$collection) {
			$this->setError('DB dropIndex: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!$name) {
			$this->setError(Lang::get('serverErrors.Mongo.006', 'DB dropIndex: Не указано наименование индекса'));
			return false;
		}


		$cmd = ['dropIndexes' => $collection, 'index' => $name];

		$res = $this->command($cmd);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Запрос количества записей в коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 *
	 * @return <int>/null/false
	 */
	public function count($collection = '', $filter = []) {
		if(!$collection) {
			$this->setError('DB count: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$cmd = [
			'count'	=> $collection,
		];
		if (!empty($filter)) {
			$cmd['query'] = $filter;
		}

		$res = $this->command($cmd, $this->dbase);
		$res = $this->getCursorFirst($res);

		if($res && isset($res['n'])){
			return $res['n'];
		}

		return null;
	}

	/**
	 * Полный запрос записей коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 * @param $fields <array> - массив ключей полей, отображаемых в ответе. 
	 *		По умолчанию = [] -> возврат полного объекта записи БД
	 *		могут быть перечислены в формате (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
	 * @param $sort <array> - массив ключей сортировки результата, формат ['path' => 1/-1, ...]
	 * @param $limit <int> - ограничение на количество записей, возвращаемых по запросу. 
	 *		По умолчанию не ограничено
	 * @param $skip <int> - массив-фильтр запроса
	 *		По умолчанию не ограничено
	 *
	 * @return \MongoCursor/false
	 */
	public function find($collection = '', $filter = [], $fields = [], $sort = [], $limit = false, $skip = 0) {
		// выполнение запроса по коллекции
		if(!$collection) {
			$this->setError('DB find: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$limit = intval($limit);
		$skip = intval($skip);

		// поля: могут быть перечислены в формате проекта (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
		// второй вариант нужно перевести в формат проекта
		if(!empty($fields) && isset($fields[0]) && is_string($fields[0])) {
			$flds = [];
			if(!in_array('_id', $fields)) {
				$flds['_id'] = 0;
			}
			foreach ($fields as $key => $name) {
				$flds[$name] = 1;
			}
			$fields = $flds;
		}
		
		// Проект запроса
		$opts = [
			'projection'	=> $fields,
			'sort'	=> $sort,
			'limit'	=> $limit,
			'skip'	=> $skip,
			'maxTimeMS' => $this->getOption('cursorTimeout'),
			'modifiers'	=> ['maxTimeMS' => $this->getOption('cursorTimeout')],
			'noCursorTimeout'	=> true,
		];
		
		$query = new MongoDB\Driver\Query($filter, $opts);
		$cur = $this->con->executeQuery($this->dbase.'.'.$collection, $query);
		
		unset($query);
		
		$cur->setTypeMap(['root' => 'array', 'document' => 'array', 'array' => 'array']);
		
		return $cur;
	}

	/**
	 * Запрос на получение 1 записи коллекции по заданному фильтру
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр запроса
	 * @param $fields <array> - массив ключей полей, отображаемых в ответе. 
	 *		По умолчанию = [] -> возврат полного объекта записи БД
	 *		могут быть перечислены в формате (['f1' => 1, 'f2' => 1]), а могут быть массивом имён полей (['f1', f2])
	 * @param $sort <array> - массив ключей сортировки результата, формат ['path' => 1/-1, ...]
	 * @param $decode <bool> - вернуть результат в виде ассоциативного массива
	 *
	 * @return <array>/<object>/false
	 */
	public function findOne($collection = '', $filter = [], $fields = [], $sort = [], $decode = false) {
		$cur = $this->find($collection, $filter, $fields, $sort, 1, 0);
		if($cur === false) {
			return false;
		}

		$res = $this->getCursorFirst($cur, $decode);

		return $res;
	}

	/**
	 * Добавить запись в коллекцию
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $record <array> - массив объекта записи
	 *
	 * @return <array>/false
	 */
	public function insert($collection = '', $record = []) {
		if(!$collection) {
			$this->setError('DB insert: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(!is_array($record) || empty($record)) {
			$this->setError(Lang::get('serverErrors.Mongo.008', 'DB insert: Ошибка формата объекта записи'));
			return false;
		}

		$r = $this->_bulk('insert', [$record]);
		if($r === false) {
			return false;
		}

		$res = $this->_commit($collection, $r);

		return $res;
	}

	/**
	 * Обновить запись в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $object <array> - массив объекта обновления
	 * @param $options <array> - массив опций операции: ['multi' => 0/1, 'upsert' => 0/1]
	 *
	 * @return <array>/false
	 */
	public function update($collection = '', $filter = [], $object = null, $options = []) {
		if(!$collection) {
			$this->setError('DB update: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$options = array_merge(['multi' => 1, 'upsert' => 0], $options);

		$r = $this->_bulk('update', [$filter, $object, $options]);
		if($r === false) {
			return false;
		}

		$res = $this->_commit($collection);

		return $res;
	}

	/**
	 * Сохранить запись в коллекции
	 *	Сохранение существующей / создание новой записи (UPSERT)
	 *	Идентификация существования записи осуществляется по MongoID в объекте записи ($record['_id'] = instanceof \MongoDB\BSON\ObjectID)
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $record <array> - массив объекта записи
	 *
	 * @return <array>/false
	 */
	public function save($collection = '', $record = []) {
		$oid = isset($record['_id']['$oid'])?$record['_id']['$oid']:null;
		if($oid){
			$record['_id'] = new MongoDB\BSON\ObjectID($oid);
		}

		if (isset($record['_id'])) {
			return $this->update($collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 1]);
		} else {
			return $this->insert($collection, $record);
		}
	}

	/**
	 * Удаление записей в коллекции
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $options <array> - ['limit' => 0/n] - удалить всё или только первые n записей
	 *
	 * @return <array>/false
	 */
	public function delete($collection = '', $filter = [], $options = []) {
		if(!$collection) {
			$this->setError('DB delete: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}

		$r = $this->_bulk('delete', [$filter, $options]);
		if($r === false) {
			return false;
		}

		$res = $this->_commit($collection);

		return $res;
	}

	/**
	 * Удаление записей в коллекции (алиас к delete)
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтр критерия поиска записи
	 * @param $options <array> - ['limit' => 0/n] - удалить всё или только первые n записей
	 *
	 * @return <array>/false
	 */
	public function remove($collection = '', $filter = [], $options = []) {
		return $this->delete($collection, $filter, $options);
	}

	/**
	 * Запрос на агрегацию в коллекции $collection по массиву этапов $pipeline
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $pipeline <array> - массив запросов-этапов агрегации
	 		см. https://www.mongodb.com/docs/manual/core/aggregation-pipeline/
	 		см. https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
	 * @param $raw <bool> - вернуть первую запись результата в виде массива
	 * @param $options <array> - массив опций команды агрегации, по умолчанию = ['cursor' => ['batchSize' => 1024]]
	 *
	 * @return <array>/false
	 */
	public function aggregate($collection = '', $pipeline = [], $raw = false, $options = ['cursor' => ['batchSize' => 1024]]) {
		if(!$collection) {
			$this->setError('DB aggregate: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(empty($pipeline)) {
			$this->setError(Lang::get('serverErrors.Mongo.009', 'DB aggregate: Не указана последовательность этапов агрегации (pipeline)'));
			return false;
		}

		$pipeline = $this->setSTDMongoParams($pipeline);

		$cmd = ['aggregate' => $collection, 'pipeline' => $pipeline];

		if (!empty($options)) {
			$cmd = array_merge($cmd, $options);
		}

		$res = $this->command($cmd, $this->dbase);

		if($raw){
			$res = $this->getCursorFirst($res);
		}
		
		return $res;
	}

	/**
	 * Аналитика запроса
	 *	Только для типа FIND, общего плана (allPlansExecution)) запроса
	 *
	 * @param $collection <string> - имя коллекции
	 * @param $filter <array> - массив-фильтра запроса - аналогично функции find()
	 * @param $sort <array> - сортировка, применяемая к запросу (влияет на выбираемый план запроса) - аналогично функции find()
	 *
	 * @return <array>/false
	 */
	public function explain($collection, $filter = [], $sort = []) {
		// Explain (только для типа FIND, общего плана (allPlansExecution)) запроса
		if(!$collection) {
			$this->setError('DB explain: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if(empty($filter)) {
			$filter = new \stdClass($filter);
		}

		$explain = [
			'find' => $collection,
			'filter' => $filter
		];
		if(!empty($sort)){
			$explain['sort'] = $sort;
		}

		$cmd = [ 'explain' => $explain ];
		$res = $this->command($cmd);
		$res = $this->getCursorFirst($res);

		return $res;
	}

	/**
	 * Выполнение MongoScript в контексте БД
	 *
	 * @param $script <string> - MongoScript JS программый код
	 * @param $args <array> - массив аргументов выполняемого кода
	 *
	 * @return <array>/false
	 */
	public function execute($script = '', $args = []) {
		if(!$script) {
			$this->setError(Lang::get('serverErrors.Mongo.010', 'DB execute: пустая команда на выполнение'));
			return false;
		}

		$cmd = ['eval' => $script, 'args' => $args];
		$res = $this->command($cmd);
		$res = $this->getCursorArray($res);

		return $res;
	}

	/**
	 * Утилитарная. Представить курсор Mongo в виде массива
	 * @param $cur <instanceof \MongoCursor> - курсор MongoDB
	 * @param $first <bool> - вернуть только первый элемент массива результатов
	 * @param $decode <bool> - декодировать из объекта в массив
	 *
	 * @return <array>/null
	 */
	public function getCursorArray($cur = null, $first = false, $decode = true) {
		// утилитарная: представить курсор Mongo в виде массива
		if(!$cur){
			return null;
		}

		$res = $cur->toArray();
		if($first && is_array($res)) {
			$res = $res[0];
		}

		if($res && $decode){
			$res = json_decode(json_encode($res), true);
		}

		return $res;
	}

	/**
	 * Утилитарная. Получить в виде массива первую запись из курсора Mongo
	 * @param $cur <instanceof \MongoCursor> - курсор MongoDB
	 * @param $decode <bool> - декодировать из объекта в массив
	 *
	 * @return <array>/null
	 */
	public function getCursorFirst($cur = null, $decode = true) {
		// утилитарная: получить в форме массива первую запись курсора Mongo
		return $this->getCursorArray($cur, true, $decode);
	}

	private function _getWc() {
		if ($this->wc === null) {
			$this->wc = new MongoDB\Driver\WriteConcern(1, $this->getOption('cursorTimeout'));
		}
		return $this->wc;
	}

	private function _bulk($operation = '', $arguments = []) {
		if(!$operation) {
			$this->setError(Lang::get('serverErrors.Mongo.011', 'DB bulk: Не указана операция'));
			return false;
		}

		if ($this->bulk === null) {
			$this->bulk = new MongoDB\Driver\BulkWrite;
		}

		if(!method_exists($this->bulk, $operation)) {
			$err = Lang::get('serverErrors.Mongo.012', 'DB bulk: Неизвестная операция {0} (BulkWrite)');
			$err = Utils::temp($err, $operation);
			$this->setError($err);
			return false;
		}

		try {
			$res = call_user_func_array([$this->bulk, $operation], $arguments);
		} catch (\Throwable $e) {
			$this->setError($e->getMessage());
			return false;
		}

		if($res === false) {
			$this->setError(Lang::get('serverErrors.Mongo.013', 'DB bulk: Ошибка выполнения запроса'));
		}
		
		return $res;
	}

	private function _commit($collection = '', $returnId = false) {
		// Совершение действия в БД для открытого MongoDB\Driver\BulkWrite
		if(!$collection) {
			$this->setError('DB commit: '.Lang::get('serverErrors.Mongo.coll', 'Не указана коллекция'));
			return false;
		}
		if ($this->bulk === null) {
			$this->setError(Lang::get('serverErrors.Mongo.014', 'DB commit: Попытка вызова commit без открытого BulkWrite'));
			return false;
		}

		$result = ['ok' => 0, 'err' => 0];
		$res = null;

		try {
			$res = $this->con->executeBulkWrite($this->dbase.'.'.$collection, $this->bulk, $this->_getWc());
		} catch (\Throwable $e) {
			$this->bulk = null;
			$this->setError($e->getMessage());
			return false;
		}

		$this->bulk = null;
		$errors = $res->getWriteErrors();
		if(!empty($errors)) {
			$result['errmsg'] = $errors[0];
			return $result;
		}

		$result['ok'] = 1;
		$result['i'] = $res->getInsertedCount();
		$result['u'] = $res->getModifiedCount();
		$result['d'] = $res->getDeletedCount();
		if ($returnId) {
			$result['id'] = $returnId;
		}

		return $result;
	}
}
?>