#!/bin/sh
set -eu

measurement_id="${GA_MEASUREMENT_ID:-}"
case "$measurement_id" in
    '') ;;
    G-*)
        case "${measurement_id#G-}" in
            ''|*[!A-Z0-9]*)
                printf '%s\n' 'GA_MEASUREMENT_ID must be empty or a GA4 measurement ID (G- followed by uppercase letters and digits).' >&2
                exit 1
                ;;
        esac
        ;;
    *)
        printf '%s\n' 'GA_MEASUREMENT_ID must be empty or a GA4 measurement ID (G- followed by uppercase letters and digits).' >&2
        exit 1
        ;;
esac

# The optional output path lets validation exercise this script without a container.
output_path="${1:-/usr/share/nginx/html/runtime-config.js}"
printf 'window.__JUTSU_CONFIG__ = {"gaMeasurementId":"%s"};\n' "$measurement_id" > "$output_path"
