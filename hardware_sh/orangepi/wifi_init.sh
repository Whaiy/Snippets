#!/bin/bash


# DOC: this script main do:

# test target
#     - err: init target, test target
#         - err: init debug


# sleep 8s # put on backend wait for defaut network injection

# self ip

target_self_ip="target_ip"
debug_self_ip="debug_ip"


# router profile

target_router_ip="target_router_ip"
target_router_ssid="wifi_name"
target_wifi_pass="target_wifi_pass"

debug_router_ip="debug_route_ip"
debug_router_ssid="debut_route_wifi_name"
debug_wifi_pass="debug_wifi_pass"


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
    ping -c 2 -w 6 $1
}


dns_fix_fn(){
        printf "nameserver 114.114.114.114\nnameserver 8.8.8.8" > /etc/resolv.conf
}


# runner

# test target
date
echo "first test terget"
test_wifi_fn $target_router_ip > $ping_log
test_wifi_fn $debug_router_ip >> $ping_log

if [ `grep -c "$ping_suc_flag" $ping_log` -eq '0' ]; then
    date
    echo "init target"
    init_wifi_fn $target_router_ssid $target_wifi_pass $target_self_ip $target_router_ip
    dns_fix_fn
    date
    echo "test target"
    test_wifi_fn $target_router_ip > $ping_log
    if [ `grep -c "$ping_suc_flag" $ping_log` -eq '0' ]; then
        date
        echo "init debug"
        init_wifi_fn $debug_router_ssid $debug_wifi_pass $debug_self_ip $debug_router_ip
        dns_fix_fn
    fi
fi


# clear tmp storage

rm $ping_log;
