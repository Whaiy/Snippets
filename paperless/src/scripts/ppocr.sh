cd $1

if (($#<2)); then
    printf "Ussage :\n$0 imgs_dir max_proc_num"
    exit 0;
fi

echo "Processing ......";

task_size=`cat imgs.ary | wc -l`; pool_size=$2;
run_pool_size=$2;
min_pool_size=`expr $task_size % $run_pool_size`;
threshold=`expr $task_size - $min_pool_size`

for ((m=0; m<task_size; )); do
    if ((m==threshold)); then
        run_pool_size=$min_pool_size;
    fi
    for ((t=0; t<run_pool_size; t++, m++)); do {
        ppocr $(awk NR==$m+1 imgs.ary);
    } & done ; wait;
done