let Step2 = {
    data: {
        title: '直播-点滴',
        content: [
            '从那以后，蹲直播慢慢变成了每天的日常。晚饭摸鱼时间、下班回家路上，进入莉娅直播间——好像少了这一步，这一天就不太完整。',
            '最喜欢看莉娅打游戏，不论是深渊还是主机。爽号、痛苦号，魂系、肉鸽，不管什么游戏，都看得津津有味。',
            '很喜欢解忧环节。听莉娅把邮件一封封念完，认认真真回应，好像所有事都能暂时放下一点。',
            '还喜欢那些"懒得化妆"的素颜日。经常觉得素颜反而更好看——也会觉得更加贴近了更真实的莉娅。',
            '前年国庆，<a href="https://www.bilibili.com/video/BV1hT1oYeEU9" target="_blank">水友唱歌大赛</a>。有歌神也有五音不全的快乐，你笑得停不下来，我看着你笑也特别开心。',
            '那年十月，<a href="https://www.bilibili.com/video/BV1NtmEYWEin" target="_blank">半夜睡不着，悄悄开了直播</a>。也被我蹲到了，有一点小确幸。',
            '跨年那晚，问"<a href="https://www.bilibili.com/video/BV1dK6DYGEbC" target="_blank">谁陪我跨年呀</a>"，没想到跨年竟然是在燕云的痛凹中度过呢。',
            '去年五月，<a href="https://www.bilibili.com/video/BV1T2EvzCEki" target="_blank">给提督们做点心来啦</a>。吃过莉娅的蛋糕、饼干、月饼、凤梨酥，不但甜在嘴里，也甜在心里。',
            '十一月，"<a href="https://www.bilibili.com/video/BV1zXDpYYENM" target="_blank">又三年不见啦</a>"。一日不见，如隔三秋。这一年莉娅帮我做出了一个重要决定，我也变得更忙，看直播的时间少了很多，有时候错过直播，早上上班路上会看看回放。',
        ],
        bubble: [
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['15%', '0%'],
            ['15%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
        ]
    },
    next: false,
    curIndex: 0,
    init: function () {
        // 清除 Step1 遗留的 body 类，切换到 step2 背景
        document.body.classList.remove('step1');
        for (let i = 1; i <= 8; i++) document.body.classList.remove('step1-' + i);
        document.body.classList.add('step2');
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[0];
        document.getElementById('bubble').style.left = this.data.bubble[0][0];
        document.getElementById('bubble').style.top = this.data.bubble[0][1];
    },
    nextStep: function () {
        this.curIndex++;
        if (this.curIndex === this.data.content.length - 1) {
            this.next = true;
        }
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.body.classList.toggle('step2-' + this.curIndex);
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    prevStep: function () {
        document.body.classList.toggle('step2-' + this.curIndex);
        this.curIndex--;
        this.next = false;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    restoreLast: function () {
        document.body.classList.remove('step3');
        document.body.classList.add('step2');
        this.curIndex = this.data.content.length - 1;
        this.next = true;
        for (let i = 1; i <= this.curIndex; i++) document.body.classList.add('step2-' + i);
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    }
}
