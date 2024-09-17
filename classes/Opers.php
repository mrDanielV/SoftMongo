<?php
/**
 * Класс статичных функций прочих операций UI softMongo, @autor Daniel, 2023
 */

class Opers
{
	/** Формирование в поток файла с планом запроса на агрегацию
	 * 
	 *	@input data = [
	 *					'dbase' => <string> - имя БД
	 * 					'collection' => <string> - имя коллекции
	 * 					'pipeline' => <JSON string> - План этапов агрегации
	 * 				]
	 */
	public static function aggregateSave($data = null){
		$dbase = Utils::xp($data, 'dbase', 'nonDB');
		$collection = Utils::xp($data, 'collection', 'nonCol');
		$pipeline = Utils::xp($data, 'pipeline');

		if(!$pipeline || empty($pipeline)){
			die('Error: Pipeline is empty!');
		}

		$filecontent = json_encode($pipeline, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
		if(!$filecontent){
			die('Error: Pipeline JSON is uncorrect!');
		}

		$filename = $dbase.'.'.$collection.'.json';

		ob_end_clean();
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename="'.$filename.'"');
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: '.strlen($filecontent));
		echo $filecontent; 

		exit();
	}

	/** Чтение файла с планом запроса на агрегацию
	 */
	public static function aggregateLoad(){
		$success = ['success' => true, 'data' => null];
		$error = ['success' => false, 'msg' => Lang::get('serverErrors.Opers.001', 'Ошибка импорта файла')];

		// Получим файл из $_FILES
		$filename = Utils::xp($_FILES, 'file.tmp_name');
		if(!$filename){
			$error['msg'] = Lang::get('serverErrors.Opers.002', 'Не указан файл для загрузки');
			return $error;
		}

		// Содержимое файла
		$content = file_get_contents($filename);

		// Чтение в JSON
		$data = json_decode($content, true);
		if(!$data){
			$error['msg'] = Lang::get('serverErrors.Opers.003', 'Не удалось прочитать содержимое файла, ошибка JSON-формата');
			return $error;
		}

		$success['data'] = $data;
		return $success;
	}
}
?>