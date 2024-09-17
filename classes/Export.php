<?php
/**
 * Класс обслуживащий функционал экспорта записей из БД
 * @author Daniel Vasiliev
 *
 *		@input dbase = 'db_name'
 *		@input collections = ['collection_name' => query, ...]
 *		@input mode = 'text'/'file'
 */

use \ZipArchive as ZipArchive;

class Export {

	// PHP memory_limit
	private $memoryLimit = '2000M';

	// PHP time limit
	private $timeLimit = 0;

	// Максимальное количество экспортируемых записей для метода экспорта = текст
	private $maxTextCount = 500;

	// Путь к каталогу для ZIP-архива экспорта
	private $zipDir = '../export/';

	private $dbase = null;
	private $sm = null;
	private $con = null;
	private $collections = [];
	private $mode = 'text';
	private $exported = 0;
	private $collection = null;
	private $query = [];
	private $limit = false;
	private $skip = 0;
	private $data = null;
	private $error = '';
	private $zip = null;
	private $file = null;
	private $filename = null;
	private $zipname = null;

	//***********************************************************************************************************************************
	/** Статическая форма вызова с получением результата работы класса
	 * 
	 *	@input data - массив параметров экспорта
	 *	[
	 *		dbase => 'dbase_name', 			// имя БД
	 *		mode => [code => file/text], 	// метод экспорта: формировать zip-файл или вернуть в виде текста
	 *		type => [code => all/one/list], // Область экспорта: все коллекции, одна коллекция, список коллекций
	 *		query => [], 					// запрос-фильтр, если коллекция одна
	 *		collection => [code => collection_name], // коллекция экспорта
	 *		collections => [data => [[name => collection1_name], [name => collection2_name], ...]] // коллекции экспорта
	 *	]
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
			$error['msg'] = Lang::get('serverErrors.Export.001', 'Не удалось подключиться к БД');
			return $error;
		}

		// Метод экспорта
		$mode = Utils::xp($data, 'mode.code');
		$self->setMode($mode);

		// Коллекции
		$collections = [];
		$type = Utils::xp($data, 'type.code');
		if($type == 'one'){
			$collection = Utils::xp($data, 'collection.code');
			$query = Utils::xp($data, 'query');
			if(is_string($query)){
				$query = json_decode($query, true);
			}

			if(!$collection){
				$error['msg'] = Lang::get('serverErrors.Export.002', 'Не указана коллекция экспорта');
				return $error;
			}
			if(!$query || !is_array($query)){
				$query = [];
			}

			// Диапазон записей (от-до)
			$limit = Utils::xp($data, 'limit');
			$skip = Utils::xp($data, 'skip');
			if($skip){
				$self->setSkip($skip);
				if($limit){
					$limit = $limit - $skip;
				}
			}
			if($limit){
				$self->setLimit($limit);
			}

			$collections[$collection] = $query;
		}
		else if($type == 'list'){
			$list = Utils::xp($data, 'collections.data', []);
			if(!$list || empty($list) || !is_array($list)) {
				$error['msg'] = Lang::get('serverErrors.Export.003', 'Не указаны коллекции экспорта');
				return $error;
			}
			foreach ($list as $item) {
				$collection = Utils::xp($item, 'name');
				if($collection){
					$collections[$collection] = [];
				}
			}
		}
		$self->setCollections($collections);

		// Экспорт агрегации
		if($mode == 'aggregate'){
			$pipeline = Utils::xp($data, 'pipeline');
			$collection = Utils::xp($data, 'collection');
			$self->setCollection($collection);
			$self->exportAggregate($pipeline);
			if($self->error){
				$error['msg'] = Lang::get('serverErrors.Export.004', 'Ошибка экспорта:').' '.$self->error;
				return $error;
			}
			$self->downloadFile();
		}

		// Экспорт
		$self->process();
		if($self->error){
			$error['msg'] = Lang::get('serverErrors.Export.004', 'Ошибка экспорта:').' '.$self->error;
			return $error;
		}

		if($mode == 'file'){
			$self->downloadFile();
		}

		$success['data'] = $self->getData();
		return $success;
	}
	//***********************************************************************************************************************************
	public function __construct($dbase = null, $collections = [], $mode = 'text'){
		$this->setDB($dbase);
		$this->setCollections($collections);
		$this->setMode($mode);

		set_time_limit($this->timeLimit);
		if($this->memoryLimit){
			ini_set('memory_limit', $this->memoryLimit);
		}

		return $this;
	}
	//***********************************************************************************************************************************
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
	public function setCollections($collections = []){
		// Установка списка коллекций экспорта
		$this->collections = [];

		if(!empty($collections)){
			$this->collections = $collections;
		}else{
			$all = $this->getDBCollections();
			if($all){
				foreach ($all as $collection) {
					$this->collections[$collection] = [];
				}
			}
		}
		
		return $this;
	}
	public function setCollection($collection = null){
		$this->collection = $collection;
	}
	public function setMode($mode = 'text'){
		// Установка режима экспорта: текстом или в файл
		if(!$mode || !in_array($mode, ['file', 'text', 'aggregate'])){
			$mode = 'text';
		}
		$this->mode = $mode;

		return $this;
	}
	public function setLimit($limit = false){
		$this->limit = $limit;
	}
	public function setSkip($skip = 0){
		$this->skip = $skip;
	}
	//***********************************************************************************************************************************
	public function getCon(){
		return $this->con;
	}
	public function getData(){
		return $this->data;
	}
	//***********************************************************************************************************************************
	public function process($mode = ''){
		// Основная функция экспорта записей
		if($mode){
			$this->setMode($mode);
		}
		if(empty($this->collections) || !$this->dbase || !$this->con){
			$this->error = Lang::get('serverErrors.Export.005', 'Ошибка полноты исходных параметров экспорта');
			return null;
		}

		// Создание файла для экспорта
		if($this->mode == 'file'){
			$this->openFile();
			if(!$this->file){
				return null;
			}
		}else{
			$this->data = '';
		}
		
		// Цикл по коллекциям
		foreach ($this->collections as $collection => $query) {
			$this->collection = $collection;
			$this->query = $query?$query:[];

			// Регистрируем коллекцию
			$this->regCollection();

			$records = $this->con->find($this->collection, $this->query, [], [], $this->limit, $this->skip);
			foreach ($records as $record) {
				$this->exported++;

				// Проверка на максимум записей для экспорта в виде текста
				if($this->mode == 'text' && $this->exported > $this->maxTextCount){
					$this->error = Lang::get('serverErrors.Export.006', 'Количество экспортируемых записей больше допустимого для экспорта в виде текста! Используйте экспорт в файл.');
					return null;
				}

				// Регистрируем запись
				$this->regRecord($record);
			}
		}

		// Закрытие файла и создание архива
		if($this->mode == 'file'){
			fclose($this->file);
			$this->makeZIP();
		}
	}
	//***********************************************************************************************************************************
	public function exportAggregate($pipeline = []){
		// Экспорт агрегации
		if(!$this->collection || empty($pipeline)){
			$this->error = Lang::get('serverErrors.Export.007', 'Ошибка полноты исходных параметров экспорта агрегации');
			return null;
		}

		$this->sm->setCollection($this->collection);
		$records = $this->sm->aggregate($pipeline, false);
		if($this->sm->getError()){
			$this->error = $this->sm->getError();
			return null;
		}

		$this->setMode('file');
		$this->openFile();
		$this->regCollection();
		foreach ($records as $record) {
			$this->regRecord($record);
		}

		fclose($this->file);
		$this->makeZIP();
	}
	//***********************************************************************************************************************************
	private function regCollection(){
		// Регистрация коллекции в результатах импорта в форме технической строки {"$selectCollection": "collection_name"}
		$d = ['$selectCollection' => $this->collection];
		$this->regRecord($d);
	}
	private function regRecord($record = []){
		// Регистрация записи в результатах импорта в форме JSON-строки
		$j = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
		$s = $j . "\n";

		if($this->mode == 'file'){
			fwrite($this->file, $s);
		}else{
			$this->data.= $s;
		}
	}
	//***********************************************************************************************************************************
	public function getDBCollections($dbase = null){
		// Получение списка всех коллекций БД
		if(!$dbase){
			$dbase = $this->dbase;
		}
		if(!$dbase){
			return null;
		}

		$list = $this->sm->getCollections(true);
		if(!$list || empty($list)){
			return null;
		}

		return $list;
	}
	//***********************************************************************************************************************************
	private function openFile(){
		// Создание файла для записи дампа, возвращает указатель на файл
		$this->tryDir();
		$this->filename = $this->dbase.'.sm.dump';

		@ $this->file = fopen($this->zipDir.$this->filename, 'w+');
		if(!$this->file){
			$this->error = Lang::get('serverErrors.Export.008', 'Не удалось создать файл в папке {0}. Возможно, нет прав на запись в эту папку.');
			$this->error = Utils::temp($this->error, $this->zipDir);
			return false;
		}
		return true;
	}
	private function makeZIP(){
		// Создание ZIP-архива экспорта
		$content = file_get_contents($this->zipDir.$this->filename);
		$this->zipname = $this->dbase.'_'.date('dmY').'.zip';

		$this->zip = new ZipArchive();

		$res = $this->zip->open($this->zipDir.$this->zipname, \ZIPARCHIVE::CREATE);
		if(!$res){
			$this->error = Lang::get('serverErrors.Export.009', 'Не удалось создать архив в папке {0}. Возможно, нет прав на запись в эту папку.');
			$this->error = Utils::temp($this->error, $this->zipDir);
			$this->zip->close();
			return false;
		}

		$this->zip->addFromString($this->filename, $content);
		$this->zip->close();

		// Удаление рабочего файла (не архива)
		@ unlink($this->zipDir.$this->filename);

		return true;
	}
	private function tryDir(){
		// Создание директории для файлов экспорта, если её нет
		$permission = 0775;
		if(!is_dir($this->zipDir)){
			$old = umask(0);
			@ $r = mkdir($this->zipDir, $permission, true);
			umask($old);
		}
	}
	//***********************************************************************************************************************************
	public function downloadFile(){
		// Возврат файла архива экспорта в HTTP-поток на скачивание
		$filecontent = file_get_contents($this->zipDir.$this->zipname);
		$filename = str_replace('/', '-', $this->zipname);
		
		// возврат файла
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename="'.$filename.'"');
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: '.strlen($filecontent));
		echo $filecontent; 

		@ unlink($this->zipDir.$this->zipname);

		exit();
	}
	//***********************************************************************************************************************************
}
?>