#!/bin/bash

OPTIONS="Shutdown\nReboot\nSleep\nLogout"

# --- UPDATED WOFI COMMAND ---

CHOICE=$(echo -e "$OPTIONS" | wofi \
    --show dmenu \
    --width 150 \
    --height 170 \
    --location 2 \
    --prompt "Action:" \
    --cache-file /dev/null)

# ---------------------------

case "$CHOICE" in
# ... (rest of your case statement remains the same)
