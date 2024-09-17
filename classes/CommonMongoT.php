<?php
/** Набор сервисных функций, подключаемых к классам Драйверов
 *	@ Daniel, 2023
 */

trait CommonMongoT {
	
	/**
	 * Получить значение отдельной опции класса
	 *
	 * @param $name <string> - имя опции
	 *
	 * @return $value / NULL
	 */
	public function getOption($name = '') {
		return isset($this->options[$name])?$this->options[$name]:null;
	}

	/**
	 * Установить значение отдельной опции класса
	 *
	 * @param $name <string> - имя опции
	 * @param $value <string> - значение
	 *
	 * @return $value
	 */
	public function setOption($name = '', $value = '') {
		return $this->options[$name] = $value;
	}

	/**
	 * Установить эксземпляр прокси-класса во внутреннюю переменную $this->parent
	 *
	 * @param $parent - instanceof \DB
	 * @param $value <string> - значение
	 *
	 * @return $value
	 */
	public function setParent($parent) {
		$this->parent = $parent;
	}

	/**
	 * Установить текущее значение (состояние) ошибки класса
	 *
	 * @param $error <string>/null - ошибка
	 *
	 * @return <string>/null
	 */
	public function setError($error) {
		$this->error = $error;

		if($this->parent && method_exists($this->parent, 'setError')) {
			$this->parent->setError($error);
		}
		
		return $this->error;
	}

	/**
	 * Получить текущее значение (состояние) ошибки класса
	 *
	 * @return <string>/null
	 */
	public function getError() {
		return $this->error;
	}

	/**
	 * ПРИВАТНЫЙ! Рекурсивный метод замены значений ($value) ключей объекта $arr, имена которых начинаются с "$" на эксземпляры класса new \stdClass($value)
	 * необходимо, например, для пустых операндов внутри массива этапов агрегации
	 *
	 * @param $arr <array>
	 *
	 * @return $arr <array>
	 */
	private function setSTDMongoParams($arr = []) {
		foreach ($arr as $key => $value) {
			if(strstr($key, '$') && is_array($value) && empty($value)) {
				$arr[$key] = new \stdClass();
			}
			else if(is_array($arr[$key])) {
				$arr[$key] = $this->setSTDMongoParams($arr[$key]);
			}
		}

		return $arr;
	}

}
?>