#!/bin/bash

# def wifi_check

wifi_check_fn(){
    while :
    do
        /var/pub_sh/wifi_init.sh > /var/pub_sh/log/wifi_init.log
        sleep 60s;
    done
}

# runner

wifi_check_fn &