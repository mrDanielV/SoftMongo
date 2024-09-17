<?php
/**
 * Класс (статический) Авторизации SoftMongo
 * @author Daniel Vasiliev
 */

class Auth
{
	/** Основная статическая функция авторизации
	 * 
	 *	@input data - массив параметров экспорта
	 *	[
	 *		login => 'username',
	 *		password => 'password',
	 *	]
	 */
	public static function login($data = []){
		$result = ['success' => true];
		$error = ['success' => false, 'msg' => Lang::get('serverErrors.Auth.001', 'Ошибка авторизации')];

		if(!session_id()){
			session_start();
		}

		// Защита от авто-перебора
		sleep(1);

		// проверка логина/пароля
		if(SM_LOGIN != Utils::xp($data, 'login') || SM_PASSWORD != Utils::xp($data, 'password')){
			$error['msg'] = Lang::get('serverErrors.Auth.002', 'Неверное сочетание логина/пароля!');
			return $error;
		}

		// Создание сессии
		$_SESSION['SMAuth'] = SM_LOGIN;

		return $result;
	}

	public static function logged(){
		// Проверка авторизации
		if(!isset($_SESSION['SMAuth']) || $_SESSION['SMAuth'] != SM_LOGIN){
			return false;
		}
		return true;
	}

	public static function checkKey(){
		// Проверка GET-ключа доступа
		if(!defined('SM_GET_KEY')){
			return true;
		}

		if(SM_GET_KEY && !isset($_GET[SM_GET_KEY])){
			http_response_code(404);
		}
	}

	public static function logout(){
		// Сброс сессии
		if(!session_id()){
			session_start();
		}

		$_SESSION['SMAuth'] = null;
		unset($_SESSION['SMAuth']);

		session_regenerate_id(true);
		session_destroy();
	}

	public static function ping(){
		if(!self::logged()){
			return ['success' => false];
		}
		return ['success' => true, 'data' => time()];
	}

}
?>