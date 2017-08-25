node build/build.js

mv dist/css/* dist/
mv dist/js/* dist/

rm -rf dist/css
rm -rf dist/js

sed -i 's/\/css\///g' dist/index.html
sed -i 's/\/js\///g' dist/index.html

echo 'Finished!'