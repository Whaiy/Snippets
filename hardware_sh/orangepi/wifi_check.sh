#!/bin/bash

# def wifi_check

wifi_check_fn(){
        date > /var/pub_sh/log/wifi_check.log;
        echo "wifi checked !" >> /var/pub_sh/log/wifi_check.log
       /var/pub_sh/wifi_init.sh > /var/pub_sh/log/wifi_init.log
}

# runner
wifi_check_fn
