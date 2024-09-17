<?php
/**
 * Класс утилитарных функций внутреннего пользования softMongo, @autor Daniel, 2022
 */

class Utils
{

	/** получение GET-параметра
	 */
	public static function getUrlParam($param_name, $default = null){
		return (isset($_GET[$param_name]))?$_GET[$param_name]:$default;
	}

	/** получение POST-параметра
	 */
	public static function getPostParam($param_name, $default = null){
		return (isset($_POST[$param_name]))?$_POST[$param_name]:$default;
	}

	/** получение Хоста из пути
	 */
	public static function getHostURL($host = ''){
		if(!is_string($host) || !$host){
			return '';
		}
		if(!mb_strstr($host, ':')){
			return $host;
		}

		$arr = explode(':', $host);
		return $arr[0];
	}

	/** Построение адреса (connectionLink mongoDB) по его частям
	 */
	public static function buildURL($parts = []) {
		return (isset($parts['scheme']) ? "{$parts['scheme']}:" : '') .
			((isset($parts['user']) || isset($parts['host'])) ? '//' : '') .
			(isset($parts['user']) ? "{$parts['user']}" : '') .
			(isset($parts['pass']) ? ":{$parts['pass']}" : '') .
			(isset($parts['user']) ? '@' : '') .
			(isset($parts['host']) ? "{$parts['host']}" : '') .
			(isset($parts['port']) ? ":{$parts['port']}" : '') .
			(isset($parts['path']) ? "{$parts['path']}" : '') .
			(isset($parts['query']) ? "?{$parts['query']}" : '') .
			(isset($parts['fragment']) ? "#{$parts['fragment']}" : '');
	}

	/** получение порта из пути
	 */
	public static function getHostPort($host = ''){
		if(!is_string($host) || !$host){
			return '';
		}
		if(!mb_strstr($host, ':')){
			return '';
		}

		$arr = explode(':', $host);
		return $arr[1];
	}

	/** Получение значения массива по указанному пути в нём
	 */
	public static function xp($arr = [], $path = '', $default = null) {
		if(!is_array($arr)) {
			return $default;
		}

		// Обработка пути - строка node.node1.node2 разбивается на массив
		if (is_int($path)) $path = (string)$path;
		if(!is_string($path)){
			throw new Exception('bad $path argument');
		}
		$path = explode('.', $path);

		// перебор составляющих пути в массиве
		$tokensCount = count($path);
		for ($i = 0; $i < $tokensCount; $i++) {
			$token = $path[$i];
			if(is_array($arr)) {
				if (array_key_exists($token, $arr)) {
					$arr = $arr[$token];
				} else {
					return $default;
				}
			} else {
				return $default;
			}
		}

		return $arr;
	}

	/** Запись значения в массив по указанному пути
	 */
	public static function put(&$arr, $path = '', $value = null) {
		if (!is_array($arr)) {
			throw new Exception('bad $arr argument');
		}

		// Обработка пути - строка node.node1.node2 разбивается на массив
		if (is_int($path)) $path = (string)$path;
		if(!is_string($path) && !is_array($path)){
			throw new Exception('bad $path argument');
		}
		if(is_string($path)){
			$path = explode('.', $path);
		}

		// инициализация
		$intermediate = &$arr;
		$length = count($path);

		// перебор массива по частям его пути
		for ($i = 0; $i < $length; $i++) {
			$token = $path[$i];

			if ($i + 1 === $length) {
				$intermediate[$token] = $value;				
				return null;
			}
			if (isset($intermediate[$token])) {
				if (is_array($intermediate[$token])) {
					$intermediate = &$intermediate[$token];
				} else {
					return null;
				}
			} else {
				$intermediate[$token] = array();
				$intermediate = &$intermediate[$token];
			}
		}

		return null;
	}

	/** Удаление значения из ассоциативного массива-объекта по переданному пути
	 */
	public static function remove(&$arr, $path = '', $delete = true) {
		if (is_int($path)) $path = (string)$path;
		if(!is_string($path) && !is_array($path)){
			throw new Exception('bad $path argument');
		}
		if(is_string($path)){
			$path = explode('.', $path);
		}

		// поиск и удаление элемента
		$length = count($path);
		$intermediate = &$arr;
		for ($i = 0; $i < $length; $i++) {
			$token = $path[$i];
			if(!isset($intermediate[$token])){
				return null;
			}else{
				if($i + 1 < $length){
					$intermediate = &$intermediate[$token];
				}
			}
			if($i + 1 === $length){
				if($delete){
					unset($intermediate[$token]);
				}else{
					$intermediate[$token]=null;
				}
			}
		}
	}

	/** Поиск в ассоциативном массиве (любой структуры) элемента по пути-значению
	 */
	public static function findIn(&$arr, $path, $value, $indexReturn = false){
		if(!is_array($arr)){
			return null;
		}
		foreach ($arr as $i => $item) {
			if(self::xp($item, $path) == $value){
				if($indexReturn){
					return $i;
				}
				return $item;
			}
		}
		return null;
	}

	/** Анализ структуры массива с формированием результата в виде ['path', 'parent', 'type']
	 */
	public static function pathes($arr, &$result = [], $parent = null){
		$parentPath = [];
		if($parent){
			$parentPath[] = $parent['path'];
			unset($parent['parent']);
		}


		foreach ($arr as $key => $item) {
			$path = $key;
			if(!empty($parentPath)){
				$path = implode('.', $parentPath);
				if(!is_int($key)){
					$path.= '.'.$key;
				}
			}

			if(is_array($item)){
				$type = 'object';
				if(isset($item[0])){
					$type = 'array';
				}

				$current = [
					'path' => $path,
					'parent' => $parent,
					'type' => $type
				];

				if(!self::xp($parent, 'type') == 'array'){
					if(!self::findIn($result, 'path', $path)){
						$result[] = $current;
					}
				}

				self::pathes($item, $result, $current);
				continue;
			}


			$current = [
				'path' => $path,
				'parent' => $parent,
				'type' => 'value'
			];
			if(!self::findIn($result, 'path', $path)){
				$result[] = $current;
			}
		}

		return $result;
	}

	public static function temp($str = '', $replaces = []) {
		if(is_scalar($replaces)) {
			$replaces = [$replaces];
		}
		if(empty($replaces) || !$str || !mb_strstr($str, '{')) {
			return $str;
		}
		$l = sizeof($str);

		for ($i = 0; $i < $l; $i++) { 
			$str = str_replace('{'.$i.'}', $replaces[$i], $str);
		}

		return $str;
	}

}
?>