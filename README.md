# 游戏库采集程序

采集地址：https://www.yx123789.com

## 采集步骤

1. 编辑 `src/main.mts` 文件，填入账号和密码
2. 执行 `tsc -w` 编译 TypeScript 代码
3. 执行 `node dist/main.mjs` 开始采集

## 采集结果

因为文本体积较大，所以使用了 ZIP 压缩，请[点此下载](https://github.com/iuroc/youxiku-collect/releases/download/1.0.0/data.zip)，然后解压后获得下面的文件。

1. `data/idList.json` -- 全部的游戏 ID
2. `data/infoList.json` -- 全部的游戏信息和下载地址（采集时程序有 Bug，所以数据未去重，不过导出的 `data/game_list.sql` 已经人工去重了，并且目前 Bug 已经修复，再次采集时不再有重复的问题）
3. `data/game_list.sql` -- 将 `infoList.json` 使用 Navicat Premium 导入到 MySQL，然后转储为 SQL 的结果

### Excel 格式

[点此下载 Excel 文件](https://github.com/iuroc/youxiku-collect/releases/download/1.0.0/game_list.xlsx)

![image](https://github.com/iuroc/youxiku-collect/assets/61752998/caf22858-5736-451a-8251-eda1179e5a17)
