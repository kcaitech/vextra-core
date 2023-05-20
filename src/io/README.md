exchange format
自有格式，用于前后端数据传输，内部数据存储，服务端数据存储

symbols、pages单独记录再引用
用户信息记录到redis

OSS结构
[uuid]/document-meta.json // 存pages:{uuid, name}[]列表; 使用到的文档的versionId; 发布的文档，另存一份，有相应的配置选项。更新内容可重新发布，覆盖原文档。
[uuid]/pages/[uuid].json
[uuid]/pages-symrefs/[uuid].json
[uuid]/pages-artboardrefs/[uuid].json
[uuid]/symbols/[uuid].json
[uuid]/artboards/[uuid].json
[uuid]/artboards-symrefs/[uuid].json
[uuid]/medias/[uuid].[svg|jpg|...]
[uuid]/metas/[document-refs.json...] // 文档内引用的其它文档数据记录

本地文件结构(zip打包压缩)
[uuid]/document-meta.json // 存pages:{uuid, name}[]列表
[uuid]/pages/[uuid].json
[uuid]/symbols/[uuid].json
[uuid]/artboards/[uuid].json
[uuid]/medias/[uuid].[svg|jpg|...]
