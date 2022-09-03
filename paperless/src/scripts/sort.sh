cd $1

order=''

if (($# > 1)); then
    if (( $2 == "r" )) ; then
        order='r';
    fi
fi

printf "" > imgs.ary;

for img in $(find . -name "*.jpg" | sort -t'/' -${order}nk2.1); do
    printf "${img:2}\n" >> imgs.ary;
done