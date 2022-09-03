## 这个脚本做了什么

适用于无显示器的开发板，自动连接wifi，防止掉线

每一分钟检测一次是否与目标wifi路由器，掉线重连，重连错误时连接debug路由器。

开机自启过程如上

## 环境

orangepi zero2
nmcli crontab

## 部署

```bash
mkdir -p /var/pub_sh/log
cp wifi_check.sh wifi_init.sh /var/pub_sh/

echo '* * * * * /var/pub_sh/wifi_check.sh' >> /etc/crontab

```
