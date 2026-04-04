<?php
// Temporaneo — cancellare dopo il test
header('Content-Type: text/plain');
echo 'PHP: ' . phpversion() . "\n";
echo 'GD: ' . (extension_loaded('gd') ? 'yes' : 'no') . "\n";
echo 'fileinfo: ' . (extension_loaded('fileinfo') ? 'yes' : 'no') . "\n";
echo 'upload_max: ' . ini_get('upload_max_filesize') . "\n";
echo 'post_max: ' . ini_get('post_max_size') . "\n";
