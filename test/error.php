<?php

header("HTTP/1.1 500 Internal Server Error");

echo json_encode(array("foo" => "bar"));
die;
