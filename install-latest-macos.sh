#!/usr/bin/env bash

# A script to download and install the latest version of the binary on MacOS.

VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
curl -sLO https://github.com/stencila/dockter/releases/download/$VERSION/dockter-macos-x64.tar.gz
tar xvf dockter-macos-x64.tar.gz
sudo mv dockter /usr/local/bin/
