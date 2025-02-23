#!/bin/bash

# 创建必要的目录
mkdir -p assets/icon.iconset

# 为 macOS 生成不同尺寸的图标
magick assets/icon.svg -resize 16x16 assets/icon.iconset/icon_16x16.png
magick assets/icon.svg -resize 32x32 assets/icon.iconset/icon_16x16@2x.png
magick assets/icon.svg -resize 32x32 assets/icon.iconset/icon_32x32.png
magick assets/icon.svg -resize 64x64 assets/icon.iconset/icon_32x32@2x.png
magick assets/icon.svg -resize 128x128 assets/icon.iconset/icon_128x128.png
magick assets/icon.svg -resize 256x256 assets/icon.iconset/icon_128x128@2x.png
magick assets/icon.svg -resize 256x256 assets/icon.iconset/icon_256x256.png
magick assets/icon.svg -resize 512x512 assets/icon.iconset/icon_256x256@2x.png
magick assets/icon.svg -resize 512x512 assets/icon.iconset/icon_512x512.png
magick assets/icon.svg -resize 1024x1024 assets/icon.iconset/icon_512x512@2x.png

# 生成 48x48 尺寸（Windows 图标需要）
magick assets/icon.svg -resize 48x48 assets/icon.iconset/icon_48x48.png

# 生成 macOS .icns 文件
iconutil -c icns assets/icon.iconset -o assets/icon.icns

# 为 Windows 生成 .ico 文件（包含多个尺寸）
magick convert assets/icon.iconset/icon_16x16.png \
                assets/icon.iconset/icon_32x32.png \
                assets/icon.iconset/icon_48x48.png \
                assets/icon.iconset/icon_256x256.png \
                assets/icon.ico

# 清理临时文件
# rm -rf assets/icon.iconset 