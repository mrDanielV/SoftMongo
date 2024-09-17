<?php
require_once 'includer.php';
session_start();
Auth::checkKey();

// Автозагрузка CSS стилей
$cssLinks = '';
$cssFolder = './lib/css';
if(is_dir($cssFolder)){
	$cssList = scandir($cssFolder);
	foreach ($cssList as $uri) {
		if($uri == '.' || $uri == '..' || !mb_strstr($uri, '.css')){
			continue;
		}
		$cssLinks.= '<link href="'.$cssFolder.'/'.$uri.'?_dc='.time().'" rel="stylesheet" type="text/css">'.PHP_EOL;
	}
}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>RI SoftMongo</title>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="description" content="Resolute Insurance SoftMongo">
	<link type="image/png" rel="icon" href="./images/panda.png">
	<?=$cssLinks?>
	<link href="./css/sm.css?_dc=<?=time()?>" rel="stylesheet" type="text/css">
	<script src="./lib/Functions.js?<?=time()?>"></script>
	<script src="./app.php?<?=time()?>"></script>
</head>
<body>
</body>
</html>