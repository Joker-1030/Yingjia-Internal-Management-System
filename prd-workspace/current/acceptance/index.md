# Acceptance Index

> Active Acceptance registry for the M01-M12 modular PRD Source of Truth. Stable IDs, priorities and source-governance history remain traceable; the global current set is maintained by the linked module files.

- [M01](./M01.md)
- [M02](./M02.md)
- [M03](./M03.md)
- [M04](./M04.md)
- [M05](./M05.md)
- [M06](./M06.md)
- [M07](./M07.md)
- [M08](./M08.md)
- [M09](./M09.md)
- [M10](./M10.md)
- [M11](./M11.md)
- [M12](./M12.md)
- [P01](./P01.md)
- [AI](./AI.md)

## 跨模块筛选验收

| AC 编号 | Given | When | Then | 优先级 |
| --- | --- | --- | --- | --- |
| AC-SHARED-01 | 任一当前模块页面存在两个或以上页面级筛选字段 | 用户查看、填写、组合、换行展示或重置筛选 | 每个控件具有常驻可见且唯一的字段标签，标签紧邻控件左侧并与控件同行，换行时按“标签 + 控件”整组换行，不改为上下布局；不同业务字段使用独立控件且只匹配自身字段；同一结果集的多个已填字段按 AND 取交集，多选字段内部取并集；权限、数据范围、排序和空态不变 | P1 |
