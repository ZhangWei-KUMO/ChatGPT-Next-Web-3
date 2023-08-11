#!/bin/bash

# 执行 `git pull` 命令拉取最新代码
echo "正从Github上拉取最新代码..."
git pull
# 打包
yarn build
# 重启pm2
pm2 restart yarn 