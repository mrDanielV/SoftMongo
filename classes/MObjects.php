<?php
/**
 * Класс назначения Mongo Объектов в объект-массив записи или запроса
 * @author Daniel Vasiliev
 */

class MObjects {

	// Обрабатываемые типы в терминологии объекта-массива
	private $types = ['$oid', '$date', '$timestamp', '$numberLong', '$numberDecimal', '$binary'];

	private $data = [];
	private $path = [];

	//***********************************************************************************************************************************
	/* Инициализация
	 * @input data - массив объекта для обработки и назначения Mongo Объектов
	 */
	public function __construct($data = []){
		$this->set($data);

		return $this;
	}
	//***********************************************************************************************************************************
	// Статическая форма вызова с получением результата работы класса
	public static function apply($data = []) {
		return (new self($data))->get();
	}
	//***********************************************************************************************************************************
	// Установка обрабатывамого массива-объекта
	public function set($data = []){
		$this->data = $data;
		return $this;
	}
	//***********************************************************************************************************************************
	// Получение результата обработки
	public function get(){
		if(!$this->data || is_null($this->data) || empty($this->data)){
			return $this->data;
		}

		if(!class_exists('MongoDB\BSON\ObjectID')){
			return $this->data;
		}

		$this->process($this->data);

		return $this->data;
	}
	//***********************************************************************************************************************************
	// Обработка объекта-массива, рекурсия
	public function process($data = null){
		if(!is_array($data)){
			return $data;
		}

		foreach ($data as $key => $value) {
			// Обновляем текущий путь до узла
			$this->path[] = $key;

			// Обработка ключей текущего уровня рекурсии
			$r = $this->setMongoObject($key, $value);

			// Углубление в следующий уровень
			if(is_array($value) && !$r){
				$this->process($value);
			}

			// Убираем текущий узел из узла
			$r = array_splice($this->path, count($this->path) - 1, 1);
		}

		return $data;
	}
	//***********************************************************************************************************************************
	// Установка Mongo Объекта в $this->data
	public function setMongoObject($key, $value){
		if(!is_string($key)){
			return false;
		}
		if(!in_array($key, $this->types) && !mb_strstr($key, '.$')){
			return false;
		}

		// определение типа ключа - полноценный ключ или путь
		$type = 'key';
		$mongoType = $key;
		if(!in_array($key, $this->types)){
			$type = 'path';
		}

		// если путь, то парс пути
		if($type == 'path'){
			$pathArr = explode('.', $key);

			// Есть ли вообще в этом пути обрабатываемые типы объектов
			$isObject = false;
			$befors = [];
			$afters = [];
			foreach ($pathArr as $key1) {
				if(in_array($key1, $this->types)){
					$isObject = true;
				}

				if(!$isObject){
					$befors[] = $key1;
				}else{
					$afters[] = $key1;
				}
			}
			if(!$isObject){
				return false;
			}

			// Если есть, выделим путь до Mongo-объекта, а всё, что после - приведем к значению
			$path = implode('.', $befors);
			for ($i = (count($afters) - 1); $i >= 0; $i--) {
				$key1 =  $afters[$i];
				$value = ["$key1" => $value];
			}

			$mongoType = $afters[0];
		}

		// путь в глобальном объекте до родителя узла
		$parentPath = $this->path;
		if($type == 'path'){
			$last = count($parentPath) - 1;
			$lastNode = $parentPath[$last];
			$parentPath[$last] = implode('.', $befors);
		}else{
			array_splice($parentPath, count($parentPath) - 1, 1);
		}


		// обработка по типам
		// ObjectId
		if($mongoType === '$oid'){
			if(is_array($value) && Utils::xp($value, '$oid')){
				$value = Utils::xp($value, '$oid');
			}
			if(!is_string($value)){
				$value = '';
			}

			// Установка значения
			$value = new MongoDB\BSON\ObjectID($value);
			
		}
		// Date
		else if($mongoType === '$date'){
			$timestamp = Utils::xp($value, '$date.$numberLong');
			if(is_null($timestamp)){
				$timestamp = Utils::xp($value, '$numberLong');
			}
			if(is_null($timestamp)){
				$timestamp = Utils::xp($value, '$date');
				if(!is_scalar($timestamp)){
					$timestamp = null;
				}
			}
			if(is_null($timestamp)){
				$timestamp = $value;
			}
			if(!is_scalar($timestamp)){
				$timestamp = null;
			}
			$timestamp = intval($timestamp);
			$value = new \MongoDB\BSON\UTCDateTime($timestamp);
		}
		// timestamp
		else if($mongoType === '$timestamp'){
			$timestamp = Utils::xp($value, 't');
			$increment = Utils::xp($value, 'i');

			if(is_null($timestamp)){
				$timestamp = $value;
				if(!is_scalar($timestamp)){
					$timestamp = null;
				}
			}

			if(is_null($timestamp) || !is_int($timestamp)){
				$timestamp = time();
			}
			if(is_null($increment) || !is_int($increment)){
				$increment = 0;
			}

			$timestamp = self::intval32bits($timestamp);
			$increment = self::intval32bits($increment);

			$value = new \MongoDB\BSON\Timestamp($increment, $timestamp);
		}
		// numberLong
		else if($mongoType === '$numberLong'){
			$value = floatval($value);
		}
		// binary
		else if($mongoType === '$binary'){
			$binData = Utils::xp($value, '$binary');
			$binType = Utils::xp($value, '$type', 0);
			
			if(is_null($binData)){
				$binData = $value;
			}
			if(is_null($binData) || !is_string($binData)){
				$binData = '';
			}
			
			$value = new \MongoDB\BSON\Binary($binData, $binType);
		}
		// numberDecimal
		else if($mongoType === '$numberDecimal'){
			$num = Utils::xp($value, '$numberDecimal');
			if(is_null($num)){
				$num = $value;
			}
			if(!is_scalar($num)){
				$num = '0';
			}
			if(is_numeric($num)){
				$num = strval($num);
			}
			$value = new \MongoDB\BSON\Decimal128($num);
		}

		// Обновление значения
		if($type == 'path'){
			Utils::remove($this->data, $this->path);
		}
		Utils::put($this->data, $parentPath, $value);

		return true;
	}
	//***********************************************************************************************************************************
	// Получение объекта mongoID
	public static function mongoId($oid = ''){
		if(!is_string($oid)){
			$oid = '';
		}
		if(class_exists('MongoDB\BSON\ObjectID')){
			return new MongoDB\BSON\ObjectID($oid);
		}
		else if(class_exists('MongoId')){
			return new MongoId($oid);	
		}

		return null;
	}
	//***********************************************************************************************************************************
	public static function intval32bits($value){
		$value = ($value & 0xFFFFFFFF);

		if ($value & 0x80000000)
		$value = -((~$value & 0xFFFFFFFF) + 1);

		return $value;
	}
	//***********************************************************************************************************************************
}
?>