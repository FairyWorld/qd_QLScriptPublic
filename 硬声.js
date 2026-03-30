/*
------------------------------------------
@Author: 
@Date: 2024.06.07 19:15
@Description: 硬声APP的自动化任务程序
cron: 12 12 * * *
------------------------------------------
#Notice:
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
*/
const { Env } = require("./tools/env")
const $ = new Env("硬声");
let ckName = `yingsheng`;
const strSplitor = "#";
const envSplitor = ["&", "\n"];
process.env[ckName] = "15666655552#sndjdj"
const axios = require("axios");
const defaultUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001e31) NetType/WIFI Language/zh_CN miniProgram"
const CryptoJS = require('crypto-js');
let param_version = '2.8.0'
let salt = 'lw0270iBJzxXdJLRtePEENsauRzkHSqm'


let AES_key = 'q09cRVOPCnfJzt7p'
let AES_IV = 'cnry8k3o4WdCGU1T'
class Task {
    constructor(env) {
        this.index = $.userIdx++
        let user = env.split(strSplitor);
        this.name = user[0];
        this.passwd = user[1];
        this.auth = '';
        this.device_id = '07cdc486c91ca0457e4263cfa9667aa7od'
        this.valid = false;
        this.coins = 0;
        this.user_id = null;
    }
    async calculateSign(params, apiType) {

        params['Authorization'] = this.auth
        params['timestamp'] = Math.floor(new Date().getTime() / 1000)
        if (apiType == 'yingsheng') {
            params['platform'] = 'h5'
            console.log(salt + this.SHA1Encrypt($.jsonToStr(params, '&')) + this.auth)
            params['sign'] = this.SHA1Encrypt(salt + this.SHA1Encrypt($.jsonToStr(params, '&')) + this.auth)
        }
        if (apiType == 'ysapi') {
            params['platform'] = 'android'
            console.log($.jsonToStr(params, '&', true) + AES_IV + AES_key)
            console.log(AES_IV + AES_key + this.SHA1Encrypt($.jsonToStr(params, '&', true) + AES_IV + AES_key) + this.auth)
            params['sign'] = this.SHA1Encrypt(AES_IV + AES_key + this.SHA1Encrypt($.jsonToStr(params, '&', true) + AES_IV + AES_key) + this.auth)
        }
        params['version'] = param_version
        return {
            "Authorization": params['Authorization'],
            "timestamp": params['timestamp'],
            "platform": params['platform'],
            "sign": params['sign'],
            "version": params['version']
        }
    }
    SHA1Encrypt(message) {
        //实现SHA1 
        return CryptoJS.SHA1(message).toString();
    }

    EncryptCrypto(message) {
        return CryptoJS.AES.encrypt(
            CryptoJS.enc.Utf8.parse(message),
            CryptoJS.enc.Utf8.parse(AES_key),
            { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7, iv: CryptoJS.enc.Utf8.parse(AES_IV) }
        ).ciphertext.toString(CryptoJS.enc.Base64) + '\n';
    }
    async run() {

        await this.login()


    }
    async login() {
        try {
            let pwd = this.EncryptCrypto(this.passwd)
            console.log(pwd)
            let param = { 'account': this.name, 'password': pwd, 'device_id': this.device_id }
            let url = `https://ysapi.elecfans.com/api/sso/accountLogin`
            let body = $.jsonToStr(param, '&', true)
            let headersParams = await this.calculateSign(param, 'ysapi')
            let options = {
                method: 'post',
                url,
                headers: {
                    ...headersParams,
                    "User-Agent": defaultUserAgent,
                    "Content-Type": "application/x-www-form-urlencoded" // 发送 urlencoded body 时通常需要
                },
                data: body
            }
            let { data: result } = await axios.request(options)
            if (result.code == 0) {
                this.valid = true
                this.name = result.data.mobile
                this.coins = result.data.coins
                this.auth = result.data.Authorization
                this.user_id = result.data.user_id
                console.log(`登录成功`)
                console.log(`手机：${this.name}`)
                console.log(`硬币：${this.coins}`)
            } else {
                console.log(`登录失败: ${JSON.stringify(result)}`)
            }
        } catch (e) {
            console.log(e)
        } finally { }
    }
    async getSignStatus() {
        try {
            let param = { 'date': '' }
            let url = `https://yingsheng.elecfans.com/ysapi/wapi/activity/signin/data?${$.jsonToStr(param, '&')}`
            let headersParams = this.calculateSign(param, 'yingsheng')
            let options = {
                method: 'get',
                url,
                headers: {
                    ...headersParams,
                    "User-Agent": defaultUserAgent,
                },
            }
            let { data: result } = await axios.request(options)
            if (result.code == 0) {
                if (result.data.data.today_is_sign == 1) {
                    console.log(`今日已签到`)
                } else {
                    console.log(`今日未签到`)
                    await $.wait(TASK_WAIT_TIME);
                    await this.signin();
                }
            } else {
                console.log(`查询签到状态失败: ${result.message}`)
            }
        } catch (e) {
            console.log(e)
        } finally { }
    }

    async signin() {
        try {
            let param = { 'date': '' }
            let url = `https://yingsheng.elecfans.com/ysapi/wapi/activity/signin/signin`
            let body = JSON.stringify(param)
            let headersParams = this.calculateSign(param, 'yingsheng')
            let options = {
                method: 'post',
                url,
                headers: {
                    ...headersParams,
                    "User-Agent": defaultUserAgent,
                    "Content-Type": "application/json"
                },
                data: body
            }
            let { data: result } = await axios.request(options)
            if (result.code == 0) {
                console.log(`签到成功，获得${result.data.coins}硬币`)
            } else {
                console.log(`签到失败: ${result.message}`)
            }
        } catch (e) {
            console.log(e)
        } finally { }
    }
}


!(async () => {
    await getNotice()
    $.checkEnv(ckName);

    for (let user of $.userList) {
        //

        await new Task(user).run();

    }


})()
    .catch((e) => console.log(e))
    .finally(() => $.done());

async function getNotice() {
    let options = {
        url: `https://ghproxy.net/https://raw.githubusercontent.com/smallfawn/Note/refs/heads/main/Notice.json`,
        headers: {
            "User-Agent": defaultUserAgent,
        }
    }
    let { data: res } = await axios.request(options);
    $.log(res)
    return res
}



