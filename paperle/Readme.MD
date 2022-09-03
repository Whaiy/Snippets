## 工具链

扫描全能王：提供免费批量裁剪和去阴影的功能

Paddleocr C++版：文字识别

Linux-bash：并行任务处理



## Python版使用

按照[Paddleocr官方提供的方法](https://gitee.com/paddlepaddle/PaddleOCR/blob/release/2.2/doc/doc_ch/whl.md)安装。需要linux环境

```
python3 ./src/ocr_system.py img_dir r
```



## C++版安装和使用

```
cd my_packages_storage/
```

再根据[Paddleocr的这篇文档](https://gitee.com/paddlepaddle/PaddleOCR/blob/release/2.0-rc1-0/deploy/cpp_infer/readme.md)的1.1和1.2.2步骤安装完opencv和预测库

```
cd my_apps_storage/
git clone https://gitee.com/paddlepaddle/PaddleOCR.git
cd PaddleOCR/deploy/cpp_infer
```

再将本目录src下的代码覆盖到 `PaddleOCR/deploy/cpp_infer/scr/`下

再根据[Paddleocr的这篇文档](https://gitee.com/paddlepaddle/PaddleOCR/blob/release/2.0-rc1-0/deploy/cpp_infer/readme.md)的2.2步骤进行编译

```
./build/ocr_system ./tools/config.txt ./imgs/img1.jpg 8 # 单张图像识别
./build/ocr_system ./tools/config.txt ./imgs/imgs.ary 8 # 多张图像识别
```

`./imgs/images.ary`的文件内容

```
img1.jpg
img2.jpg
img3.jpg
```

识别多张图象时可能会崩溃，多运行几次就好了。我也不知道为什么。。。

