<?php
$files = array_diff(scandir('.'), array('.', '..')); // Exclude . and ..
echo json_encode(array_values($files));
?>
