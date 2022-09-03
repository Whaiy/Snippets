from paddleocr import PaddleOCR
from PIL import Image
from multiprocessing import Pool
import math, os, sys

os.chdir(sys.argv[1])
order = ''
if len(sys.argv) ==  3 : order = 'r'
paths = os.popen("find . -name '*.jpg' | sort -t'/' -" + order + "nk2.1").read().split('\n')
paths.pop()


def oneocr(path):
    ocr = PaddleOCR(use_angle_cls=True,det=True, rec=True, cls=True,use_gpu=False)
    ocrdata = ocr.ocr(path)

    img = Image.open(path)
    pw = img.size[0];  ph = img.size[1]
    res = "<div class='bg' style='background-size:" + str(pw) + "px;width:" + str(pw) + "px;height:" + str(ph) +"px'><img src='" + path + "'>"

    for line in ocrdata:
        pts = line[0]
        ltx = pts[0][0];  lty = pts[0][1]
        rtx = pts[1][0];  rty = pts[1][1]
        txt = line[1][0]; trs = line[1][1]
        w = ( (ltx-rtx)**2 + (lty-rty)**2 ) ** 0.5
        h = ( (ltx-pts[3][0])**2 + (lty-pts[3][1])**2) ** 0.5 # lbx = pts[3][0];  lby = pts[3][1]
        a = math.atan( (lty-rty) / (ltx-rtx) ) * 180 / math.pi
        res = res + "<p class='tx' style='font-size:" + '%.2f'%(h-1) + "px;width:" + '%.2f'%w + "px;height:" + '%.2f'%h + "px;left:" + '%.2f'%ltx + "px;top:" + '%.2f'%lty + "px;transform:rotate(" + '%.3f'%a + "deg)'>" + str(txt) + "</p>\n"

    return res + "</div>\r\n"

if __name__ == '__main__':
    with Pool(processes=4) as p:
        res = p.map(oneocr, paths)
    Book = open("Book.html",'w')
    Book.write("<head><meta charset='UTF-8'><link rel=\"stylesheet\" href=\"Book.css\"></head><body>")
    n = len(paths)
    for i in range(n):
        Book.write(res[i])
    Book.write("<script src=\"Book.js\"></script></body>")
    Book.close()

# PADDLEOCR内存占用非常高导致进程可能被杀掉，可以每个任务直接向硬盘写入数据，到主进程再合并数据，或者减少线程数