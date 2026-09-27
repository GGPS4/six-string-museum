#!/bin/sh
# Builds index.html (GitHub Pages) from page.html (the Claude artifact page body).
set -e
cd "$(dirname "$0")"
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%%}</style>\n</head>\n<body>\n'; cat page.html; printf '</body>\n</html>\n'; } > index.html
echo "built index.html"
