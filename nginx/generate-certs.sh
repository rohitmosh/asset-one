#!/bin/bash
set -e

# Resolve target certs directory relative to script path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERTS_DIR="$SCRIPT_DIR/certs"

mkdir -p "$CERTS_DIR"

if [ -f "$CERTS_DIR/eams.key" ] && [ -f "$CERTS_DIR/eams.crt" ]; then
    echo "SSL certificates already exist in $CERTS_DIR."
    exit 0
fi

echo "Generating self-signed SSL certificates for OHPC EAMS..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/eams.key" \
  -out "$CERTS_DIR/eams.crt" \
  -subj "/C=IN/ST=Odisha/L=Bhubaneswar/O=OHPC/OU=IT/CN=localhost"

chmod 600 "$CERTS_DIR/eams.key"
chmod 644 "$CERTS_DIR/eams.crt"

echo "SSL Certificates generated successfully at: $CERTS_DIR"
