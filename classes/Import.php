<?php
/**
 * Класс обслуживащий функционал импорта записей из БД
 * @author Daniel Vasiliev
 *
 *		@input dbase = 'db_name'
 *		@input mode = 'text'/'file'
 *		@input text = '{"$selectCollection":1111}\n{запись1}\n{запись2}...'
 *		@input file = $_FILES['file'] = '.zip'
 */

use \ZipArchive as ZipArchive;

class Import {

	// PHP memory_limit
	private $memoryLimit = '2000M';
	private $uploadMaxSize = '256M';

	// PHP time limit
	private $timeLimit = 0;

	private $dbase = null;
	private $con = null;
	private $sm = null;
	private $mode = 'text';
	private $collection = null;
	private $error = '';
	private $imported = 0;
	private $collections = [];
	private $errors = [];

	/** Статическая форма вызова с получением результата работы класса
	 * 
	 *	@input data - массив параметров экспорта
	 *	[
	 *		dbase => 'dbase_name', 			// имя БД
	 *		mode => [code => file/text], 	// метод экспорта: формировать zip-файл или вернуть в виде текста
	 *	]
	 *	ожидается наличие $_FILES['file']
	 */
	public static function get($data = []) {
		$success = [ 'success' => true, 'data' => null ];
		$error = ['success' => false, 'msg' => ''];

		// Объект класса
		$self = new self();

		// БД
		$dbase = Utils::xp($data, 'dbase');
		$self->setDB($dbase);
		if(!$self->getCon()){
			$error['msg'] = Lang::get('serverErrors.Import.001', 'Не удалось подключиться к БД');
			return $error;
		}

		// Метод импорта
		$mode = Utils::xp($data, 'mode.code');
		if(!$mode || !in_array($mode, ['file', 'text'])){
			$mode = 'text';
		}
		$self->setMode($mode);

		// Обработка: Файл/Текст
		if($mode == 'text'){
			$self->processText(Utils::xp($data, 'text'));
		}
		else{
			$self->processZip();
		}

		if($self->error){
			$error['msg'] = Lang::get('serverErrors.Import.002', 'Ошибка импорта:').' '.$self->error;
			return $error;
		}

		// Параметры успешного результата
		$success['data'] = [
			'imported' => $self->imported,
			'errors' => [
				'n' => sizeof($self->errors),
				'list' => $self->errors
			],
			'collections' => [
				'n' => sizeof($self->collections),
				'name' => implode(', ', $self->collections),
				'list' => $self->collections
			]
		];
		
		return $success;
	}

	public function __construct($dbase = null, $mode = 'text', $text = ''){
		$this->setDB($dbase);
		$this->setMode($mode);

		set_time_limit($this->timeLimit);
		if($this->memoryLimit){
			ini_set('memory_limit', $this->memoryLimit);
		}
		if($this->uploadMaxSize){
			ini_set('upload_max_size', $this->uploadMaxSize );
			ini_set('upload_max_filesize', $this->uploadMaxSize );
			ini_set('post_max_size', $this->uploadMaxSize);
		}

		return $this;
	}

	public function setDB($dbase = null){
		// Установка текущей БД, подключение к БД
		$this->con = null;

		if($dbase){
			$this->dbase = $dbase;

			// Подключение к БД
			$this->sm = new SM($this->dbase);
			$this->con = $this->sm->connect();
		}

		return $this;
	}

	public function setMode($mode = 'text'){
		// Установка режима экспорта: текстом или в файл
		if(!$mode || !in_array($mode, ['file', 'text'])){
			$mode = 'text';
		}
		$this->mode = $mode;

		return $this;
	}

	public function getCon(){
		return $this->con;
	}

	public function processText($text = ''){
		// Обработка импорта из текста
		if(!$text){
			$this->error = Lang::get('serverErrors.Import.003', 'Не указаны текстовые данные для импорта');
			return null;
		}

		// Разбиваем текст на строки
		$lines = explode("\n", $text);
		if(!$lines || empty($lines) || sizeof($lines) < 2){
			$this->error = Lang::get('serverErrors.Import.004', 'Слишком мало строк в тексте для импорта');
			return null;
		}

		// Построчная обработка
		foreach ($lines as $i => $line) {
			$this->processLine($line, $i);
		}
	}

	public function processZip(){
		// Чтение и обработка файла импорта
		$fileName = Utils::xp($_FILES, 'file.tmp_name');
		if (!$fileName) {
			$this->error = Lang::get('serverErrors.Import.005', 'Не указан файл архива');
			return null;
		}

		$zip = new \ZipArchive();
		
		if ($zip->open($fileName)) {
			// чтение первого файла из архива
			$firstFilename = $zip->getNameIndex(0);
			$stream = $zip->getStream($firstFilename);
			if(!$stream) {
				$this->error = Lang::get('serverErrors.Import.006', 'Ошибка! Невозможно прочесть архив.');
				return null;
			}

			// Чтение и обработка строк
			$i = 0;
			while (!feof($stream)) {
				$line = fgets($stream);
				$this->processLine($line, $i);
				$i++;
			}
		}else{
			$this->error = Lang::get('serverErrors.Import.007', 'Не удалось прочитать файл архива');
			return null;
		}

		$zip -> close();
	}

	public function processLine($line, $i){
		// Обработка строки
		$lineErrIndex = '#'.($i + 1).' - ';
		$line = trim($line);
		if(!$line){
			return null;
		}
		
		// JSON -> Array
		$record = json_decode($line, true);
		if(!$record){
			$this->errors[] = $lineErrIndex.Lang::get('invalidJSON', 'Ошибка JSON-формата строки');
			return null;
		}

		// Если строка содержит мета-параметр $selectCollection - получим текущую коллекцию
		if(Utils::xp($record, '$selectCollection')){
			$this->selectCollection($record['$selectCollection']);
			return true;
		}

		// Проверка наличия текущей коллекции - обязательно должна быть указана в тексте/файле импорта как {"$selectCollection": "<имя коллекции>"}
		if(!$this->collection){
			$this->errors[] = $lineErrIndex.Lang::get('serverErrors.Import.008', 'Не указана коллекция для импорта!');
			return null;
		}

		// Назначить Mongo-объекты к записи
		$record = MObjects::apply($record);

		// Вставить в текущую коллекцию
		try {
			if(Utils::xp($record, '_id')){
				if(!is_object($record['_id']) && isset($record['_id']['$id']) && is_string($record['_id']['$id'])) {
					$record['_id'] = MObjects::mongoId($record['_id']['$id']);
				}
				$r = $this->con->update($this->collection, ['_id' => $record['_id']], $record, ['multi' => 0, 'upsert' => 1]);
			}
			else{
				$r = $this->con->insert($this->collection, $record);
			}

			if(!Utils::xp($r, 'ok')){
				$this->errors[] = $lineErrIndex.Lang::get('serverErrors.Import.009', 'Не удалось сохранить запись!');
				return null;
			}
		} catch (\Exception $e) {
			$this->errors[] = $lineErrIndex.Lang::get('serverErrors.Import.010', 'Ошибка добавления записи:').' '.$e->getMessage();
			return null;
		}

		// Удачное завершение операции
		$this->imported++;
	}

	public function selectCollection($collection = ''){
		// Фиксация переданной коллекции как текущей для импорта последующих строк
		$this->collection = trim($collection);
		if(!$this->collection){
			return false;
		}
		
		$this->collections[] = $this->collection;

		return true;
	}
}
?>