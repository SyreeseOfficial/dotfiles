#!/bin/bash

# You might need to adjust the path if curl or awk are not found,
# but usually, /usr/bin is enough. Keeping it simple here.

WEATHER_DATA=$(curl -s "wttr.in/Lynnwood?format=%t+%c&u" | tr -d '+')
TEMPERATURE=$(echo "$WEATHER_DATA" | awk '{print $1}')
CONDITION_CODE=$(echo "$WEATHER_DATA" | awk '{print $2}')

ICON=""
case $CONDITION_CODE in
    113) ICON="󰖙" ;;
    116) ICON="󰖕" ;;
    119|122) ICON="󰖐" ;;
    143|248|260|263|266) ICON="" ;;
    293|296|299|302|305|308) ICON="" ;;
    311|314|317|320) ICON="" ;;
    323|326|329|332|335|338) ICON="" ;;
    386|389|392|395) ICON="󰖓" ;;
    *) ICON="" ;;
esac

echo "$ICON $TEMPERATURE"
