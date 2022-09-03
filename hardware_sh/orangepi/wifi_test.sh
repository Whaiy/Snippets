nmcli connection down target_router_ssid;
nmcli connection down debug_router_ssid;

nmcli connection delete target_router_ssid;
nmcli connection delete debug_router_ssid;

reboot;
