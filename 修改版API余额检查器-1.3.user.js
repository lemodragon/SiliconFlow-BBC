// ==UserScript==
// @name         修改版API余额检查器
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  准确检查多个API密钥的余额（美化版）
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 创建UI
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 15px;
        background-color: #f0f0f0;
        border-radius: 10px;
        z-index: 9999;
        width: 600px;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
    `;

    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
        width: 100%;
        height: 200px;
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 14px;
        resize: vertical;
    `;
    textarea.placeholder = '在此粘贴API密钥，每行一个';

    const button = document.createElement('button');
    button.textContent = '检查余额';
    button.style.cssText = `
        display: block;
        width: 100%;
        padding: 12px;
        margin-bottom: 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    `;
    button.onmouseover = () => button.style.backgroundColor = '#45a049';
    button.onmouseout = () => button.style.backgroundColor = '#4CAF50';

    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        background-color: white;
        font-size: 14px;
        line-height: 1.5;
    `;

    container.appendChild(textarea);
    container.appendChild(button);
    container.appendChild(resultDiv);
    document.body.appendChild(container);

    // 检查余额函数
    function checkBalance(apiKey) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.siliconflow.cn/v1/user/info',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`
                },
                timeout: 20000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const responseText = response.responseText;
                            if (responseText.includes('"Ok"')) {
                                const data = JSON.parse(responseText);
                                if (data.data && data.data.balance !== undefined) {
                                    resolve(`<span style="color: #4CAF50;">✅ ${data.data.balance}</span> ${apiKey}`);
                                } else {
                                    resolve(`<span style="color: #f44336;">❌ ${apiKey}, 无效响应数据</span>`);
                                }
                            } else {
                                resolve(`<span style="color: #f44336;">❌ ${apiKey}, ${responseText}</span>`);
                            }
                        } catch (error) {
                            resolve(`<span style="color: #f44336;">❌ ${apiKey}, 解析错误: ${error}</span>`);
                        }
                    } else {
                        resolve(`<span style="color: #f44336;">❌ ${apiKey}, HTTP错误 ${response.status}</span>`);
                    }
                },
                onerror: function(error) {
                    resolve(`<span style="color: #f44336;">❌ ${apiKey}, 请求错误: ${error}</span>`);
                },
                ontimeout: function() {
                    resolve(`<span style="color: #f44336;">❌ ${apiKey}, 20秒超时</span>`);
                }
            });
        });
    }

    // 点击事件处理
    button.addEventListener('click', async () => {
        const keys = textarea.value.trim().split('\n').filter(key => key.trim() !== '');
        resultDiv.innerHTML = '<p style="text-align: center; color: #666;">正在检查...</p>';
        button.disabled = true;
        button.style.backgroundColor = '#cccccc';
        const startTime = performance.now();
        const results = await Promise.all(keys.map(checkBalance));
        const endTime = performance.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(2);
        resultDiv.innerHTML = results.join('<br>') + `<br><p style="text-align: right; color: #4CAF50; margin-top: 10px;">总用时：${totalTime} 秒</p>`;
        button.disabled = false;
        button.style.backgroundColor = '#4CAF50';
    });
})();