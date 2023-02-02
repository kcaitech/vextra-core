# sktest

## 安装nodejs 16.x

## 修改npm源
npm config set registry https://registry.npmmirror.com
 > restore: https://registry.npmjs.com

## 开始, 是否不用-g也行？
sudo npm install -g @vue/cli@5.0.8

npm install
? 如遇到electron-builder找不到：sudo npm i -g electron-builder

npm run electron:serve
网页：npm run serve

</br>

## 生成文档
npx typedoc --tsconfig typedoc.tsconfig.json



</br></br></br>
---
# 坑
mac 升级之后 electron 打包报错 Exit code: ENOENT. spawn /usr/bin/python ENOENT
重新下载python2.7 下载地址
找到安装的位置
which python
然后你会得到一个地址
vim ~/.zshrc
## 在最后面加上 你刚才获取的地址 
export PYTHON_PATH=/Users/badwin/Documents/****/****/python2-bin/python
## 重启
source ~/.zshrc
再去打包就 ok了
链接：https://www.jianshu.com/p/496d016ddefb


## 服务端
npm run build-server
node dist_server/main.js --path ~/Documents/symbol.sketch
