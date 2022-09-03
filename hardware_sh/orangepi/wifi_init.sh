#!/bin/bash


# DOC: this script main do:

# test target
#     - err: init target, test target
#         - err: init debug


# sleep 8s # put on backend wait for defaut network injection

# self ip

target_self_ip="x.x.x.x"
debug_self_ip="x.x.x.x"


# router profile

target_router_ip="x.x.x.x"
target_router_ssid="yy"
target_wifi_pass="*****"

debug_router_ip="x.x.x.x"
debug_router_ssid="yyyyyyy"
debug_wifi_pass="****"


# network test tmp data profile

ping_log="/tmp/connection_114514.log"
ping_suc_flag="bytes from"


# def init_wifi

init_wifi_fn(){ # ssid password ipv4addr ipvsgw
    nmcli connect delete $1
    nmcli device wifi connect $1 password $2
    nmcli connection modify $1 ipv4.addr "$3/24" ipv4.gateway $4 ipv4.method manual
    nmcli connection reload $1
    nmcli connection up $1
}

# def test_wifi

test_wifi_fn(){ # router_ip
    ping -c 2 -w 8 $1 > $ping_log
}


# runner

# test target
echo "test terget"
test_wifi_fn $target_router_ip
if [ `grep -c "$ping_suc_flag" $ping_log` -eq '0' ]; then
    # init target
echo "init target"
    init_wifi_fn $target_router_ssid $target_wifi_pass $target_self_ip $target_router_ip
echo "test target"
    # test target
    test_wifi_fn $target_router_ip
    elif [ `grep -c "$ping_suc_flag" $ping_log` -eq '0' ]; then
echo "init debug"
        # init debug
        init_wifi_fn $debug_router_ssid $debug_wifi_pass $debug_self_ip $debug_router_ip
fi


# clear tmp storage

rm $ping_log;
