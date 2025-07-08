# Vextra Core



## 版本构建
npm i
npm run build<br>


## 开发过程使用（带源码，不用于可发布版本）
npm run dev<br>


## schema生成代码
修改内核数据请先修改schema目录中的json schema数据定义
再运行npm run schema 生成新的数据结构


// 如出现奇怪运行错误，更新node版本到22


# 模块引用关系
data -> basic
io ->   data
render -> data
dataview -> render
            data
            io
operator -> data
        dataview
        io
editor->    data
            dataview
            operator
            io
