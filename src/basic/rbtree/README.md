# https://github.com/nalply/rbts.git


1 实现段句的数据结构，实现方式有二：
    a)节点记录当前节点为根的数的字符数量，实际的key值需要从根开始计算
    b)节点记录与父节点的偏移值，同样的，实际的key值需要从根开始计算
2 实现区间查找
    a)节点记录key:(cord, len)，key均不相交，value为数组或者另外一个tree，value的内容可重复，查找时需要去重
    b)

