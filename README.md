# 版本构建
## 确认package.json中的版本号未发布
npm i
npm run build<br>
npm publish<br>


## 开发过程使用（带源码，不用于可发布版本）
npm run dev<br>


## schema生成代码
npm run schema<br>
// 如出现奇怪运行错误，更新node版本


# 模块引用关系
data -> basic
io ->   data
render -> data
dataview -> render
            data
            io
coop -> data
        dataview
        io
editor->    data
            dataview
            coop
            io
