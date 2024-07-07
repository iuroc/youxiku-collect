import { writeFileSync } from 'fs'
import PQueue from 'p-queue'

type GameInfo = {
    /** 游戏名称 */
    gameName: string
    /** 游戏更新 */
    updateTime: string
    /** 游戏介绍正文 */
    content: string
    /** 正文配图 */
    images: string[]
    /** 游戏视频 */
    video: string | null
    /** 游戏封面 */
    cover: string
    download?: string
    /** 游戏分类 */
    type: string
}

export class YaoyaoGame {
    static baseUrl = 'https://www.yx123789.com'

    public constructor(private sessionId: string) {
    }

    /** 获取全部页面的游戏编号列表 */
    getAllIdList(): Promise<number[]> {
        return new Promise<number[]>(async (resolve, reject) => {
            const queue = new PQueue({ concurrency: 10 })
            const pageCount = await this.getPageCount()
            for (let page = 0; page < pageCount; page++)
                queue.add(async () => this.getIdList(page++))
            const resultList: number[] = []
            queue.on('completed', (result: number[]) => {
                resultList.push(...result)
                console.log(`共采集到 ${resultList.length} 个游戏编号`)
            })
            queue.on('idle', () => {
                resolve(resultList)
            })
            queue.on('error', reject)
        })
    }

    async getAllInfo(idList: number[]): Promise<GameInfo[]> {
        return new Promise((resolve, reject) => {
            const queue = new PQueue({ concurrency: 50 })
            const infoList: GameInfo[] = []
            const errorIdList: number[] = []
            idList.forEach(id => {
                queue.add(async () => {
                    try {
                        return await this.getInfo(id)
                    } catch (error) {
                        if (error instanceof Error)
                            console.log(`Error-${id}: ${error.message}`)
                        errorIdList.push(id)
                    }
                })
            })
            queue.on('completed', (info: GameInfo) => {
                try {
                    if (info.gameName.startsWith('【不限速游戏盒子】')) return
                    infoList.push(info)
                    console.log(`已采集 ${infoList.length} 条游戏信息`)
                } catch { }
            })
            queue.on('idle', () => {
                console.log(`失败列表：${errorIdList.join(', ')}`)
                resolve(infoList)
            })
            queue.on('error', reject)
        })
    }

    /** 获取总页数 */
    public async getPageCount(): Promise<number> {
        const body = await fetch(`${YaoyaoGame.baseUrl}/?type=product`).then(res => res.text())
        const match = body.match(/pagecount: (\d+)/)
        if (!match) throw new Error('获取总页数失败')
        return parseInt(match[1])
    }

    /** 获取某一页游戏编号列表 */
    async getIdList(page: number): Promise<number[]> {
        const body = await fetch(`${YaoyaoGame.baseUrl}/?type=product&page=${page + 1}`).then(res => res.text())
        return [...body.matchAll(/<a class="grid_author_avt".*?type=productinfo&id=(\d+)/g)].map(i => parseInt(i[1]))
    }

    /** 获取游戏信息 */
    async getInfo(gameId: string | number): Promise<GameInfo> {
        const body = await fetch(`${YaoyaoGame.baseUrl}/?type=productinfo&id=${gameId}`, {
            headers: this.getCookie()
        }).then(res => res.text())
        const nameMatch = body.match(/<h1 class="entry-title">(.*?)<\/h1>/)
        if (!nameMatch) throw new Error('获取游戏名称失败')
        const gameName = nameMatch[1].replace(/\s{2,}/g, ' ').trim()
        // updateTime
        const updateTimeMatch = body.match(/<time datetime="(.*?)"/)
        if (!updateTimeMatch) throw new Error('获取游戏更新时间失败')
        const updateTime = updateTimeMatch[1]
        // content
        const contentMatch = body.match(/<div class="entry-content u-text-format u-clearfix">(.*?)<div id="pay-single-box">/s)
        if (!contentMatch) throw new Error('获取游戏介绍内容失败')
        const contentHtml = contentMatch[1].replaceAll(/<video.*?<\/video>/g, '')
        const contentText = contentHtml.replaceAll(/<br>|<\/li>/g, '\n').replaceAll(/<.*?>/g, '').replaceAll(/\s+\n/g, '\n').trim()
        // images
        const imagesRegex = /<img.*?src=['"](http[^'"]+)/g
        let imagesMatch
        const images = []
        while ((imagesMatch = imagesRegex.exec(contentHtml)) !== null)
            images.push(this.dnameReplace(imagesMatch[1]))
        // video
        const videoMatch = body.match(/<div class="bgWhite mvEditbox">.*?<video.*?src=['"](http[^'"]+)/s)
        const video = videoMatch ? videoMatch[1] : null
        // cover
        const coverMatch = body.match(/<div class="pay--content"><img.*?src=['"](http[^'"]+)/s)
        if (!coverMatch) throw new Error('获取封面失败')
        const cover = coverMatch[1]
        // type
        const typeMatch = body.match(/<span class="meta-category">.*?<i class="dot">.*?<i class="dot"><\/i>(.*?)</s)
        if (!typeMatch) throw new Error('获取分类名称失败')
        const type = typeMatch[1].trim()
        return {
            type,
            gameName,
            updateTime,
            content: contentText,
            images,
            video,
            cover,
            download: await this.getDownloadInfo(gameId)
        }
    }

    /**
     * 获取游戏下载信息
     * @param gameId 游戏编号
     * @param genkey 游戏密钥，通过 `getInfo` 获取
     * @returns 游戏下载信息
     */
    public async getDownloadInfo(gameId: string | number): Promise<string> {
        const body = await fetch(`${YaoyaoGame.baseUrl}/buy.php?type=productinfo&id=${gameId}`, {
            method: 'POST',
            headers: this.getCookie()
        }).then(res => res.text())
        const match = body.match(/location.href='(.*?)'/)
        if (!match) return console.log('正在重试'), this.getDownloadInfo(gameId)
        const href = match[1]
        const body2 = await fetch(`${YaoyaoGame.baseUrl}/${href}`).then(res => res.text())
        const infoMatch = body2.match(/<textarea.*?>(.*?)<\/textarea>/s)
        if (!infoMatch) return console.log('正在重试'), this.getDownloadInfo(gameId)
        return infoMatch[1].replaceAll(/\r/g, '').replaceAll(/【.*/g, '').replaceAll(/^\s*|\s*$/mg, '')
    }

    /** 获取登录后的 `sessionId` */
    static async login(username: string, password: string) {
        const res = await fetch(`${this.baseUrl}/member/login.php?action=login&from=index.php`, {
            method: 'POST',
            body: new URLSearchParams({
                'M_email': username,
                'M_pwd': password
            }),
            redirect: 'manual'
        })
        const body = await res.text()
        const errorMsgMatch = body.match(/alert('(.*?)')/)
        if (errorMsgMatch) throw new Error(errorMsgMatch[1])
        for (const item of res.headers.getSetCookie()) {
            const match = item.match(/^PHPSESSID=(.*?);/)
            if (match) return match[1]
        }
        throw new Error('登录失败')
    }

    /** 校验 `sessionId` 是否为登录状态 */
    static async checkLogin(sessionId: string) {
        const body = await fetch(`${this.baseUrl}/member/login.php`, {
            headers: {
                cookie: 'PHPSESSID=' + sessionId,
            }
        }).then(res => res.text())
        return body.startsWith('<script>')
    }

    private getCookie() {
        return { cookie: 'PHPSESSID=' + this.sessionId }
    }

    dnameReplace(text: string): string {
        const dnameMap = [
            ['media.st.dl.pinyuncloud.com', 'media.st.dl.eccdnx.com'],
            ['shared.st.dl.eccdnx.com', 'shared.akamai.steamstatic.com'],
        ]
        dnameMap.forEach(dnames => {
            text = text.replace(new RegExp(dnames[0], 'g'), dnames[1])
        })
        return text
    }



}

export class GameCollect {
    static async start(username: string, password: string, path: string) {
        const sessionId = await YaoyaoGame.login(username, password)
        if (!await YaoyaoGame.checkLogin(sessionId))
            throw new Error('sessionId 校验失败')
        const client = new YaoyaoGame(sessionId)
        const idList = await client.getAllIdList()
        const infoList = await client.getAllInfo(idList)
        writeFileSync(path, JSON.stringify(infoList))
    }
}