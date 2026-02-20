let Step1 = {
    data: {
        title: '直播-初见',
        content: [
            '第一次看直播的契机是刷到了【随缘更新】大佬做的<a href="https://www.bilibili.com/video/BV1Jk4y1q7g8/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3&t=18" target="_blank">这个视频</a>，特别好看，原来你也...',
            '没想到后来<a href="https://www.bilibili.com/video/BV1hx4y1K7ya/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3" target="_blank">cos了甘雨</a>',
            '而且<a href="https://www.bilibili.com/video/BV1vr421M7yP/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3&t=416" target="_blank">学习大摆锤</a>还是看的甘雨呢，一定是有特别的缘分吧。',
            '第二天就开始蹲守，结果蹲到了P5R，听到莉娅明显还没恢复过来的声音，一阵心疼<a href="https://www.bilibili.com/video/BV1Dj411w7uv/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3&t=6223">上了舰长</a>，Leah和PS老板以为要么是主机吸引，要么是要打深渊。',
            '"果然，还主机，主机是神马？"听到是深渊攻略过来的还很失望。后来我说，等可以打深渊的时候，我就来上提督。',
            '没想到仅仅7天，白天还说要修养一段时间，晚上就开始打深渊了，于是<a href="https://www.bilibili.com/video/BV1Gm4y1m7M6/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3&t=999">提督如约而至</a>。',
            '很巧，上提那天是我生日。现实的事情压着，过得格外难熬。就是这样一个夜晚，蹲到了莉娅打深渊。',
            '屏幕那边的声音有些虚弱却那么认真，好像那点灰暗忽然就散了一些，当时就做了一个决定。后来想，遇到莉娅，大概是那年最好的生日礼物。',
            '10天后，等到了下一笔绩效，果断<a href="https://www.bilibili.com/video/BV1xh411E7nL/?share_source=copy_web&vd_source=d34302a66cb85ac10f21415e816b9dc3&t=1179">上了总督</a>。右下是莉娅收到总督后的表情↘'
        ],
        img: [
            'static/img/fengmian.jpg',
            'static/img/fengmian.jpg',
            'static/img/fengmian.jpg',
            'static/img/2/first.png',
            'static/img/2/first.png',
            'static/img/2/second.png',
            'static/img/2/second.png',
            'static/img/2/second.png',
            'static/img/2/third.png',
        ],
        bubble: [
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '20%'],
            ['45%', '20%'],
            ['45%', '20%'],
            ['65%', '30%'],
        ]
    },
    next: false,
    curIndex: 0,
    init: function () {
        // 清除 Step0 遗留的 body 类，切换到 step1 背景
        for (let i = 1; i <= 4; i++) {
            document.body.classList.remove('step0-' + i);
        }
        document.body.classList.add('step1');
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[0];
        document.getElementById('bubble').style.left = this.data.bubble[0][0];
        document.getElementById('bubble').style.top = this.data.bubble[0][1];
    },
    nextStep: function () {
        console.log(this.data.img);
        this.curIndex++;
        if (this.curIndex === this.data.content.length - 1) {
            this.next = true;
        }
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.body.classList.toggle('step1-' + this.curIndex);
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        console.log(parseFloat(this.data.bubble[this.curIndex][1]),window.innerHeight);
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    prevStep: function () {
        document.body.classList.toggle('step1-' + this.curIndex);
        this.curIndex--;
        this.next = false;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    restoreLast: function () {
        // 清除 Step2 遗留的类，恢复 step1 背景
        document.body.classList.remove('step2');
        for (let i = 1; i <= 8; i++) document.body.classList.remove('step2-' + i);
        document.body.classList.add('step1');
        this.curIndex = this.data.content.length - 1;
        this.next = true;
        for (let i = 1; i <= this.curIndex; i++) document.body.classList.add('step1-' + i);
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    }
}
