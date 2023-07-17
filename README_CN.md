# 远程开发

由于众所周知的原因，本项目建议二次开发通过远程的方式进行开发。
1. 安装Remote - SSH;
2. command + shift + p,搜索`Remote - SSH`,
3. 输入：`ssh -i ~/seoul.pem ubuntu@43.155.142.200`

# 生产环境

```bash
pm2 start yarn -- start
pm2 stop yarn
pm2 restart yarn 
```
6rlJM2a1GNKzx3UV
