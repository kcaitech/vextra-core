
！！注意！！
不需要进事务的以“__”开头命名

事务
notify由transact去触发，包括编辑过程及undo/redo
数据变化监听及备份由proxy监听变量的修改操作完成

内核编辑模式
repo.start()
shape.translate(x,y)
shape.rotate(a)
shape.expand(x,y)
repo.commit()/repo.rollback()

shadow
编辑由最外层editor编辑及发布shadow同步事件
