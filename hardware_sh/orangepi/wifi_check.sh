#!/bin/bash

# def wifi_check

wifi_check_fn(){
    /var/pub_sh/wifi_init.sh > /var/pub_sh/log/wifi_init.log
}

# runner

wifi_check_fn &
