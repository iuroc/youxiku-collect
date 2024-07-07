# 游戏库采集程序

采集地址：https://www.yx123789.com

## 采集步骤

1. 从 `games.mts` 中导入 `YaoyaoGame` 类
2. 调用 `YaoyaoGame.login` 方法，传入账号密码，获得登录后的 `sessionId`
3. 可以使用 `YaoyaoGame.checkLogin` 校验 `sessionId` 是否已经登录可用
4. 实例化 `YaoyaoGame` 类，传入 `sessionId`，对象命名为 `client`
5. 调用 `client.getAllIdList` 获取所有的游戏 ID
6. 调用 `client.getAllInfo` 获取所有的游戏信息和下载地址

## 采集结果

因为文本体积较大，所以使用了 ZIP 压缩，请[点此下载]()，然后解压后获得下面的文件。

1. `data/idList.json` -- 全部的游戏 ID
2. `data/infoList.json` -- 全部的游戏信息和下载地址（采集时程序有 Bug，所以数据未去重，不过导出的 `data/game_list.sql` 已经人工去重了，并且目前 Bug 已经修复，再次采集时不再有重复的问题）
3. `data/game_list.sql` -- 将 `infoList.json` 使用 Navicat Premium 导入到 MySQL，然后转储为 SQL 的结果
