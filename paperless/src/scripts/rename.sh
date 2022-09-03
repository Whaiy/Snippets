IFS=$'\r\n';
cd $1
for key in $(find . -name "*.jpg"); do
    if (( "${#key}" < 11 )) ; then
        break
    fi
    mv $key ${key:25};
done