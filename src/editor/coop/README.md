client 可以引用data数据

需要获取当前baseVer更早的版本的情况
1. undo delete reponode，时，cmd的数据版本比baseVer小
todo 应该怎么处理更新回来的cmd? 直接插入到当前ops的前面


当前版本太旧提交时被拒绝
拉取到服务端支持的版本本地更新后再提交


todo 本地order应该设置为多少？？
数据导入时0，最小，后续可改
本地编辑时MAX_SAFE_INTEGER, 最大，远程过来的op不会动到本地的。此数据也不会写入到文档，除非本地保存版本。
如果本地保存版本直接上传，需要修改此order!


todo index的order怎么更新为op.order,
todo 本地undo后的op也要实时变换，以在redo时可直接用。


undo delete
1. 当被undo的op已经有版本号，则undoop记录对应版本号的数据
2. 当被undo的op正在上传，则待上传返回后，在undo-do-redo时重新更新undo记录的数据到返回的op的版本
3. 当被undo的op还没上传，直接本地消掉不再上传