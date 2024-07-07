import { writeFileSync } from 'fs'
import { YaoyaoGame } from './games.mjs'

const sessionId = await YaoyaoGame.login('iuroc', '12345678')
if (!await YaoyaoGame.checkLogin(sessionId))
    throw new Error('sessionId 校验失败')
const client = new YaoyaoGame(sessionId)
// const idList = JSON.parse(readFileSync('data/idList.json').toString()) as number[]
// const infoList = await client.getAllInfo(idList)
// writeFileSync('data/infoList2.json', JSON.stringify(infoList))

writeFileSync('data/idList.json', JSON.stringify(await client.getAllIdList()))