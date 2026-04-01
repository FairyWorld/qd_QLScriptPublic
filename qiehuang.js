// 当前脚本来自于  脚本库下载！
// 当前脚本来自于 http://2.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cc 脚本库下载！
// 脚本库官方QQ群1群: 
// 脚本库官方QQ群2群: 1077801222
// 脚本库官方QQ群3群: 433030897
// 脚本库中的所有脚本文件均来自热心网友上传和互联网收集。
// 脚本库仅提供文件上传和下载服务，不提供脚本文件的审核。
// 您在使用脚本库下载的脚本时自行检查判断风险。
// 所涉及到的 账号安全、数据泄露、设备故障、软件违规封禁、财产损失等问题及法律风险，与脚本库无关！均由开发者、上传者、使用者自行承担。

const axios = require('axios');
const CONFIG = {
    baseUrl: 'https://api.zhumanito.cn/api',
    timeout: 20000,
    accountDelay: 180000, // 账号间延迟改为3分钟（180秒），降低限流风险
    wateringDelay: 240000, // 浇水间隔改为4分钟（240秒）
    taskCompleteDelay: 10000, // 任务完成后额外延迟10秒
    loginDelay: 5000 // 登录成功后额外延迟5秒
};

// 脱敏函数
function maskWid(wid) {
    if (wid.length <= 8) return wid;
    return `${wid.substring(0, 4)}****${wid.substring(wid.length - 4)}`;
}

function maskPhone(phone) {
    if (!phone || phone.length <= 7) return phone;
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`;
}

function parseQhcsEnv() {
    const qhcsEnv = process.env.QHCS || '';
    if (!qhcsEnv) {
        console.log('info: 未检测到环境变量QHCS，请按配置说明设置！');
        console.log('info: 格式：备注+++User-Agent+++wid+++wm_phone');
        console.log('info: 例如：宏+++Mozilla/5.0...+++1..41+++138...79');
        return null;
    }

    const accountLines = qhcsEnv.replace(/\r\n/g, '\n').split('\n');
    const accounts = [];

    for (let idx = 0; idx < accountLines.length; idx++) {
        const line = accountLines[idx].trim();
        if (!line) {
            console.log(`info: 检测到第${idx + 1}个无效项（空内容），已跳过`);
            continue;
        }

        const parts = line.split('+++').map(item => item.trim());
        
        if (parts.length < 4) {
            console.log(`info: 第${idx + 1}个账号格式错误（需要备注+++ua+++wid+++wm_phone），已跳过`);
            continue;
        }

        const remark = parts[0];
        const ua = parts[1];
        const wid = parts[2];
        const wm_phone = parts[3];

        accounts.push({
            index: idx + 1,
            remark: remark,
            ua: ua,
            wid: wid,
            wm_phone: wm_phone, // 【新增】手机号码
            token: '',
            userData: {},
            landData: []
        });
    }

    if (accounts.length === 0) {
        console.log('info: 没有可用账号（所有项格式错误或为空），脚本终止');
        return null;
    }

    return accounts;
}

function getHeaders(account) {
    const headers = {
        'User-Agent': account.ua,
        'Origin': 'https://h5.zhumanito.cn',
        'Referer': 'https://h5.zhumanito.cn/',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
    };
    
    // 只有在有 token 时才添加 Authorization 头
    if (account.token) {
        headers['Authorization'] = account.token;
    }
    
    return headers;
}

async function loginAccount(account) {
    const loginUrl = `${CONFIG.baseUrl}/login`;
    const headers = {
        'User-Agent': account.ua,
        'Origin': 'https://h5.zhumanito.cn',
        'Referer': 'https://h5.zhumanito.cn/',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'application/json;charset=UTF-8'
    };
    
    // 【修复】正确的请求体，包含 wid 和 wm_phone
    const payload = {
        wid: account.wid,
        wm_phone: account.wm_phone  // 【关键】添加手机号码参数
    };

    try {
        console.log(`info: 账号${account.index}（备注：${account.remark}）：发起登录请求`);
        console.log(`info: 账号${account.index}：wid脱敏：${maskWid(account.wid)}，手机号脱敏：${maskPhone(account.wm_phone)}`);

        const response = await axios.post(loginUrl, payload, {
            headers: headers,
            timeout: CONFIG.timeout
        });

        const res = response.data;
        if (res.code !== 200) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：登录失败，原因：${res.msg || '未知错误'}`);
            return false;
        }

        // 保存返回的数据
        account.token = res.data.token;
        account.userData = res.data.user;
        account.landData = res.data.land || [];

        console.log(`success: 账号${account.index}（备注：${account.remark}）：登录成功！`);
        console.log(`info: 账号${account.index}：当前资源：水${account.userData.water_num}，阳光${account.userData.sun_num}`);
        if (account.landData.length > 0) {
            console.log(`info: 账号${account.index}：土地状态：共${account.landData.length}块，生长阶段${account.landData[0].seed_stage}`);
        }

        console.log(`success: 账号${account.index}（备注：${account.remark}）登录成功`);
        
        // 登录成功后添加延迟
        await new Promise(resolve => setTimeout(resolve, CONFIG.loginDelay));
        return true;

    } catch (error) {
        const errMsg = error.response 
            ? `[${error.response.status}] ${JSON.stringify(error.response.data)}` 
            : error.message;
        console.log(`info: 账号${account.index}（备注：${account.remark}）：登录异常，原因：${errMsg}`);
        return false;
    }
}

async function getUnfinishedTasks(account) {
    const taskUrl = `${CONFIG.baseUrl}/task`;
    const headers = getHeaders(account);

    try {
        const response = await axios.get(taskUrl, {
            headers: headers,
            timeout: CONFIG.timeout
        });

        const res = response.data;
        if (res.code !== 200) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：获取任务列表失败，原因：${res.msg || '未知错误'}`);
            return [];
        }

        console.log('info: ' + '='.repeat(40));
        console.log(`info: 账号${account.index}（备注：${account.remark}） - 所有任务状态：`);
        const unfinishedTasks = [];
        for (const task of res.data.task) {
            const statusText = task.status === 1 ? '已完成' : '未完成';
            console.log(`info: 任务${task.id}：${task.content} | 奖励：水${task.water_num} 阳光${task.sun_num} | ${statusText}`);
            if (task.status === 0) {
                unfinishedTasks.push(task);
            }
        }
        console.log('info: ' + '='.repeat(40));

        return unfinishedTasks;

    } catch (error) {
        const errMsg = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
        console.log(`info: 账号${account.index}（备注：${account.remark}）：获取任务异常，原因：${errMsg}`);
        return [];
    }
}

async function completeTask1(account) {
    const completeUrl = `${CONFIG.baseUrl}/task/complete`;
    const headers = getHeaders(account);
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    const data = 'task_id=1&';

    try {
        console.log(`info: 账号${account.index}（备注：${account.remark}）：开始执行【每日签到】任务（ID=1）`);

        const response = await axios.post(completeUrl, data, {
            headers: headers,
            timeout: CONFIG.timeout
        });

        const res = response.data;
        if (res.code !== 200) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：【每日签到】失败，原因：${res.msg || '未知错误'}`);
            return false;
        }

        if (res.data.user) {
            account.userData = res.data.user;
        }

        console.log(`success: 账号${account.index}（备注：${account.remark}）：【每日签到】任务完成！`);
        console.log(`success: 账号${account.index}（备注：${account.remark}）每日签到任务完成`);
        return true;

    } catch (error) {
        const errMsg = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
        console.log(`info: 账号${account.index}（备注：${account.remark}）：【每日签到】异常，原因：${errMsg}`);
        return false;
    }
}

async function completeTask2(account, task) {
    const browseUrl = `https://api.zhumanito.cn/?wid=${account.wid}`;
    const completeUrl = `${CONFIG.baseUrl}/task/complete`;
    const headers = getHeaders(account);

    try {
        console.log(`info: 账号${account.index}（备注：${account.remark}）：开始执行【浏览指定页面】任务（ID=2）`);
        console.log(`info: 账号${account.index}：正在访问目标链接：${browseUrl}`);

        await axios.get(browseUrl, {
            headers: headers,
            timeout: CONFIG.timeout,
            maxRedirects: 5
        });
        await new Promise(resolve => setTimeout(resolve, 7000));
        console.log(`info: 账号${account.index}：目标页面浏览完成`);

        const submitHeaders = { ...headers };
        submitHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        const data = `task_id=${task.id}&`;

        const response = await axios.post(completeUrl, data, {
            headers: submitHeaders,
            timeout: CONFIG.timeout
        });

        const res = response.data;
        if (res.code !== 200) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：【浏览指定页面】提交失败，原因：${res.msg || '未知错误'}`);
            return false;
        }

        if (res.data.user) {
            account.userData = res.data.user;
        }

        console.log(`success: 账号${account.index}（备注：${account.remark}）：【浏览指定页面】任务完成！`);
        console.log(`success: 账号${account.index}（备注：${account.remark}）浏览指定页面任务完成`);
        return true;

    } catch (error) {
        const errMsg = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
        console.log(`info: 账号${account.index}（备注：${account.remark}）：【浏览指定页面】异常，原因：${errMsg}`);
        return false;
    }
}

// 新增重试参数，处理429限流错误
async function completeWatering(account, retryCount = 0) {
    const maxRetry = 3; // 最多重试3次
    const waterUrl = `${CONFIG.baseUrl}/water`;
    const headers = getHeaders(account);
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    try {
        console.log('info: ' + '='.repeat(40));
        console.log(`info: 账号${account.index}（备注：${account.remark}）：开始执行浇水操作`);

        const response = await axios.post(waterUrl, '', {
            headers: headers,
            timeout: CONFIG.timeout
        });

        const res = response.data;
        if (res.code === 10006 && res.msg.includes('能量值不足')) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：浇水失败，原因：${res.msg}`);
            return false;
        }

        if (res.code !== 200) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：浇水失败，原因：${res.msg || '未知错误'}`);
            return false;
        }

        account.userData = res.data.user;
        account.landData = res.data.land || [];

        const currentWater = account.userData.water_num;
        const currentSun = account.userData.sun_num;
        const landCount = account.landData.length;
        console.log(`success: 账号${account.index}（备注：${account.remark}）：浇水成功！`);
        console.log(`info: 账号${account.index}：剩余资源：水${currentWater}，阳光${currentSun}`);
        if (landCount > 0) {
            console.log(`info: 账号${account.index}：土地状态：共${landCount}块，生长阶段${account.landData[0].seed_stage}`);
        }
        console.log('info: ' + '='.repeat(40));

        console.log(`success: 账号${account.index}（备注：${account.remark}）浇水成功`);
        return true;

    } catch (error) {
        const errMsg = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
        // 处理429限流错误，指数退避重试
        if (error.response && error.response.status === 429 && retryCount < maxRetry) {
            const retryDelay = (retryCount + 1) * 60000; // 重试延迟：1分钟、2分钟、3分钟
            console.log(`info: 账号${account.index}（备注：${account.remark}）：浇水触发限流，${retryDelay/1000}秒后重试（第${retryCount+1}/${maxRetry}次）`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return completeWatering(account, retryCount + 1); // 递归重试
        }
        console.log(`info: 账号${account.index}（备注：${account.remark}）：浇水异常，原因：${errMsg}`);
        return false;
    }
}

function getUserStatus(account) {
    if (!account.userData) {
        console.log(`info: 账号${account.index}（备注：${account.remark}）：未获取到用户数据，返回默认资源值0`);
        return { water: 0, sun: 0 };
    }
    return {
        water: account.userData.water_num || 0,
        sun: account.userData.sun_num || 0
    };
}

async function autoMultiAccount() {
    console.log('info: 【茄皇多账号自动化脚本】已启动');
    const accounts = parseQhcsEnv();
    if (!accounts) return;
    
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const totalAccounts = accounts.length;

        console.log(`\ninfo: ` + '='.repeat(50));
        console.log(`info: 正在处理账号 ${account.index}/${totalAccounts}（备注：${account.remark}）`);
        console.log('info: ' + '='.repeat(50));

        const loginSuccess = await loginAccount(account);
        if (!loginSuccess) {
            console.log(`info: 账号${account.index}（备注：${account.remark}）：登录失败，跳过后续所有操作`);
            continue;
        }

        const unfinishedTasks = await getUnfinishedTasks(account);
        if (unfinishedTasks.length > 0) {
            for (const task of unfinishedTasks) {
                if (task.id === 1 && task.content === '每日签到') {
                    await completeTask1(account);
                } else if (task.id === 2 && task.content === '浏览指定页面') {
                    await completeTask2(account, task);
                } else {
                    console.log(`info: 账号${account.index}（备注：${account.remark}）：发现未知任务（ID：${task.id}，内容：${task.content}），已跳过`);
                }
            }

            // 任务完成后添加额外延迟，避免请求密集
            await new Promise(resolve => setTimeout(resolve, CONFIG.taskCompleteDelay));
            
            const status = getUserStatus(account);
            console.log(`\ninfo: 账号${account.index}（备注：${account.remark}）：所有可处理任务已完成`);
            console.log(`info: 账号${account.index}：任务后资源：水${status.water}，阳光${status.sun}`);
            console.log(`success: 账号${account.index}（备注：${account.remark}）所有任务处理完成`);
        } else {
            console.log(`\ninfo: 账号${account.index}（备注：${account.remark}）：无未完成任务或无法获取任务列表`);
            const status = getUserStatus(account);
            console.log(`info: 账号${account.index}：当前资源：水${status.water}，阳光${status.sun}`);
        }

        console.log(`\ninfo: 账号${account.index}（备注：${account.remark}）：进入循环浇水逻辑（触发条件：水≥20 且 阳光≥20）`);
        while (true) {
            const status = getUserStatus(account);
            if (status.water >= 20 && status.sun >= 20) {
                console.log(`\ninfo: 账号${account.index}（备注：${account.remark}）：资源满足（水${status.water}，阳光${status.sun}），执行浇水`);
                const waterSuccess = await completeWatering(account);
                if (!waterSuccess) {
                    console.log(`info: 账号${account.index}（备注：${account.remark}）：浇水失败，退出浇水循环`);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, CONFIG.wateringDelay));
            } else {
                console.log(`\ninfo: 账号${account.index}（备注：${account.remark}）：资源不足（水${status.water}，阳光${status.sun}），停止浇水`);
                break;
            }
        }

        console.log(`\ninfo: 账号${account.index}/${totalAccounts}（备注：${account.remark}）：所有操作处理完毕`);
        if (i < totalAccounts - 1) {
            // 修正日志计算错误（除数从100000改为1000，毫秒转秒）
            console.log(`info: 账号间延迟${CONFIG.accountDelay / 1000}秒，准备处理下一个账号...\n`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.accountDelay));
        }
    }

    console.log(`\ninfo: ` + '='.repeat(50));
    console.log('info: 所有账号已全部处理完成！脚本执行结束');
    console.log('info: ' + '='.repeat(50));
}

autoMultiAccount().catch(err => {
    console.log(`info: 脚本执行异常：${err.message}`);
    process.exit(1);
});

// 当前脚本来自于  脚本库下载！
// 当前脚本来自于 http://2.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cc 脚本库下载！
// 脚本库官方QQ群1群: 
// 脚本库官方QQ群2群: 1077801222
// 脚本库官方QQ群3群: 433030897
// 脚本库中的所有脚本文件均来自热心网友上传和互联网收集。
// 脚本库仅提供文件上传和下载服务，不提供脚本文件的审核。
// 您在使用脚本库下载的脚本时自行检查判断风险。
// 所涉及到的 账号安全、数据泄露、设备故障、软件违规封禁、财产损失等问题及法律风险，与脚本库无关！均由开发者、上传者、使用者自行承担。