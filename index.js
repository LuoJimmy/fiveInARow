/**
 * Created by Jimmy Luo on 2019/1/7.
 */
//定义属性
var maps = [],//记录棋盘上的棋子，0为空，1为白子，2为黑子
    size = 15,//棋盘行列数
    cellSize = 40,//格子大小
    chessSize = 36,//棋子大小
    paddingSize = 20,//棋盘留白大小
    mode = 0,//比赛模式，0双人，1人机
    me = true;//我
    over = false,
    title = document.getElementsByClassName('title')[0],
    chessboard = document.getElementsByClassName('chessboard')[0],
    canvas = document.getElementById('canvas'),
    position = [{},{}],//记录上两步棋子位置，position[0]:{x,y,type,isUndo}
    white = new Image(),
    black = new Image(),
    isBlack = false,
    winnerText = document.getElementsByClassName('winner-text'),
    canvasFiveInARow = new CanvasFiveInARow(chessboard, canvas),
    core = new Core();

/**
 * 棋盘对象，单独封装，方便DOM/Canvas实现的切换
 * @param chessboard
 * @param canvas
 * @constructor
 */
function CanvasFiveInARow(chessboard, canvas) {

    this.chessboard = chessboard;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    /**
     * 初始化棋盘
     * @param size 棋盘行列数
     * @param cellSize 格子大小
     * @param paddingSize 格子大小
     */
    this.initChessBoard = function (size, cellSize, paddingSize) {
        this.chessboard.style.width = size*cellSize + 'px';
        this.chessboard.style.height = size*cellSize + 'px';
        this.canvas.width = size*cellSize;
        this.canvas.height = size*cellSize;
        this.ctx.strokeStyle = "#333";
        for(var m = 0;m < size-1;m++){
            for(var n = 0;n < size-1;n++){
                this.ctx.strokeRect(m*cellSize + paddingSize,n*cellSize + paddingSize,cellSize,cellSize);  //绘制大小为cellSize的小正方形
            }
        }
    };

    /**
     * 画棋子
     * @param type 类型，Image对象，black黑子,white白子
     * @param x
     * @param y
     * @param chessSize
     */
    this.drawChess = function(type, x, y, chessSize) {
        this.ctx.drawImage(type, x, y, chessSize, chessSize);
    };

    /**
     * 清除棋子
     * @param x
     * @param y
     * @param cellSize
     * @param chessSize
     * @param paddingSize
     */
    this.wipeChess = function(x, y, cellSize, chessSize, paddingSize) {
        this.ctx.clearRect(x*cellSize+paddingSize-chessSize/2,
            y*cellSize+paddingSize-chessSize/2, chessSize, chessSize);

        //重画被清除棋子周围的格子
        this.ctx.beginPath();
        this.ctx.moveTo(x*cellSize+paddingSize-cellSize+chessSize/2, y*cellSize+paddingSize);
        this.ctx.lineTo(x*cellSize+paddingSize+cellSize-chessSize/2, y*cellSize+paddingSize);
        this.ctx.moveTo(x*cellSize+paddingSize, y*cellSize+paddingSize-cellSize+chessSize/2);
        this.ctx.lineTo(x*cellSize+paddingSize, y*cellSize+paddingSize+cellSize-chessSize/2);
        this.ctx.strokeStyle = "#333";
        this.ctx.stroke();
    };

    /**
     * 清空画布
     */
    this.wipeCanvas = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    /**
     * 填满画布
     * @param img
     */
    this.drawCanvas = function(img) {
        this.ctx.drawImage(img, 0, 0);
    }
}

/**
 * 核心算法
 * @constructor
 */
function Core() {

    //赢法数组
    this.wins = [];

    //赢法总数
    this.count = 0;

    //赢法的统计数组
    this.myWin = [];
    this.computerWin = [];

    //上一次赢法的统计数组的，供悔棋功能使用
    this._myWin = [];
    this._computerWin = [];

    this.initData = function() {
        var i, j, k;

        for(i = 0; i< size; i++) {
            this.wins[i] = [];
            for(j = 0; j < size; j++) {
                this.wins[i][j] = [];
            }
        }

        //横线赢法
        for(i = 0; i< size; i++) {
            for(j = 0; j < size-4; j++) {
                for(k = 0; k < 5;k++) {
                    this.wins[i][j+k][this.count] = true;
                }
                this.count++;
            }

        }

        //竖线赢法
        for(i = 0; i< size; i++) {
            for(j = 0; j < size-4; j++) {
                for(k = 0; k < 5;k++) {
                    this.wins[j+k][i][this.count] = true;
                }
                this.count++;
            }

        }

        //正斜线赢法
        for(i = 0; i< size-4; i++) {
            for(j = 0; j < size-4; j++) {
                for(k = 0; k < 5;k++) {
                    this.wins[i+k][j+k][this.count] = true;
                }
                this.count++;
            }

        }

        //反斜线赢法
        for(i = 0; i< size-4; i++) {
            for(j = size-1; j > 3; j--) {
                for(k = 0; k < 5;k++) {
                    this.wins[i+k][j-k][this.count] = true;
                }
                this.count++;
            }

        }

        for(i = 0; i < this.count; i++){
            this.myWin[i] = 0;
            this._myWin[i] = 0;
            this.computerWin[i] = 0;
            this._computerWin[i] = 0;
        }

    };

    this.computerAI = function() {
        var myScore = [];
        var computerScore = [];
        var max = 0;
        var u = 0, v = 0;
        var i, j, k;
        var isWin = false;

        for(i = 0; i < size; i++){
            myScore[i] = [];
            computerScore[i] = [];
            for(j = 0; j < size; j++){
                myScore[i][j] = 0;
                computerScore[i][j] = 0;
            }
        }
        for(i = 0; i < size; i++){
            for(j = 0; j < size; j++){
                if(maps[i][j] == 0){
                    for(k = 0; k < this.count; k++){
                        if(this.wins[i][j][k]){
                            if(this.myWin[k] == 1){
                                myScore[i][j] += 200;
                            }else if(this.myWin[k] == 2){
                                myScore[i][j] += 400;
                            }else if(this.myWin[k] == 3){
                                myScore[i][j] += 2000;
                            }else if(this.myWin[k] == 4){
                                myScore[i][j] += 10000;
                            }

                            if(this.computerWin[k] == 1){
                                computerScore[i][j] += 220;
                            }else if(this.computerWin[k] == 2){
                                computerScore[i][j] += 420;
                            }else if(this.computerWin[k] == 3){
                                computerScore[i][j] += 2100;
                            }else if(this.computerWin[k] == 4){
                                computerScore[i][j] += 20000;
                            }
                        }
                    }

                    if(myScore[i][j] > max){
                        max  = myScore[i][j];
                        u = i;
                        v = j;
                    }else if(myScore[i][j] == max){
                        if(computerScore[i][j] > computerScore[u][v]){
                            u = i;
                            v = j;
                        }
                    }

                    if(computerScore[i][j] > max){
                        max  = computerScore[i][j];
                        u = i;
                        v = j;
                    }else if(computerScore[i][j] == max){
                        if(myScore[i][j] > myScore[u][v]){
                            u = i;
                            v = j;
                        }
                    }

                }
            }
        }
        if(position[1].x) {
            position[0].x = position[1].x;
            position[0].y = position[1].y;
            position[0].type = position[1].type;
            position[0].isUndo = false;
        }
        position[1].x = u;
        position[1].y = v;
        position[1].type = isBlack ? 2:1;
        position[1].isUndo = false;

        if(isBlack){
            canvasFiveInARow.drawChess(black,
                u*cellSize+paddingSize-chessSize/2, v*cellSize+paddingSize-chessSize/2, chessSize);//界面标棋子
            isBlack = false;
            maps[u][v] = 2; //黑子为2
        }else{
            canvasFiveInARow.drawChess(white,
                u*cellSize+paddingSize-chessSize/2, v*cellSize+paddingSize-chessSize/2, chessSize);//界面标棋子
            isBlack = true;
            maps[u][v] = 1; //白子为1
        }
        for(k = 0; k < this.count; k++){
            if(this.wins[u][v][k]){
                this.computerWin[k]++;
                this._myWin[k] = this.myWin[k];
                this.myWin[k] = 6;//这个位置人不可能赢了
                if(this.computerWin[k] == 5){
                    isWin = true;
                    over = true;
                }
            }
        }
        if(!over){
            me = !me;
        }
        return isWin;
    };

    /**
     * 判断谁赢了
     * @param type 当前的棋子类型,[1|2]
     * @param x 棋子的x坐标
     * @param y 棋子的y坐标
     * @param maxSize 最大的格子数
     * @returns {*} [0|1|2],0还不知道谁赢，1表示白子赢，2表示黑子赢
     */
    this.whoWin = function(type, x, y, maxSize) {
        var currentX = x,currentY = y,total,who = 0;

        //判断每行是否有五个
        reset();
        while(y > 0 &&maps[x][y-1] === type){  //当前子左边还有
            total++;
            y--;

        }
        x = currentX;
        y = currentY;
        while(y+1<maxSize &&maps[x][y+1] === type){  //当前子右边还有
            y++;
            total++;
        }
        who = isWho();
        if(who !== 0) {
            return who;
        }


        //判断每列是否有五个
        reset();
        while(x>0&&maps[x-1][y] === type){   //当前子上面还有
            total++;
            x--;
        }
        x = currentX;
        y = currentY;
        while(x+1<maxSize&&maps[x+1][y] === type){  //下面
            total++;
            x++;
        }
        who = isWho();
        if(who !== 0) {
            return who;
        }

        //判断反斜线上有没有五个
        reset();
        while(x>0&&y>0&&maps[x-1][y-1] === type){ //左上
            x--;
            y--;
            total++;
        }
        x = currentX;
        y = currentY;
        while(x+1 < maxSize&&y+1 < maxSize&&maps[x+1][y+1] === type){  //右下
            x++;
            y++;
            total++;
        }
        who = isWho();
        if(who !== 0) {
            return who;
        }

        //判断判断正斜线上有没有五个
        reset();
        while(x > 0&&y+1 < maxSize&&maps[x-1][y+1] === type){  //右上
            x--;
            y++;
            total++;
        }
        x = currentX;
        y = currentY;
        while(x+1 < maxSize&&y > 0&&maps[x+1][y-1] === type){   //左下
            x++;
            y--;
            total++;
        }
        who = isWho();
        if(who !== 0) {
            return who;
        }

        return who;

        function isWho(){       //哪边赢，1白子，2黑子
            var result = 0;
            if(total >= 5){
                type === 1 ? result = 1:result = 2;
            }
            return result;
        }
        function reset(){
            total = 1;
        }
    };
}

/**
 * 初始化
 */
function init() {

    // context.globalCompositeOperation = "destination-over";
    /*white.crossOrigin = 'Anonymous';
    black.crossOrigin = 'Anonymous';*/

    isBlack = false;

    //人机模式，数据初始化
    if(mode === 1) {
        me = true;
        over = false;
        core.initData();
    }

    //按钮状态初始化
    Array.prototype.slice.call(document.getElementsByClassName('undo')).forEach(function(item) {
        item.setAttribute('disabled', 'disabled');
    });
    document.getElementById('revertUndo').setAttribute('disabled','disabled');
    document.getElementsByClassName('winner-text')[0].innerText = '';



    //初始化棋盘
    canvasFiveInARow.wipeCanvas();
    canvasFiveInARow.initChessBoard(size, cellSize, paddingSize);

    //初始化棋子
    white.src = 'imgs/white.png';
    black.src = 'imgs/black.png';

    //初始化maps
    for(var i = 0;i < size; i++) {
        maps[i] = [];
        for(var j = 0;j < size;j++) {
            maps[i][j] = 0;
        }
    }
}

/**
 * 切换游戏模式
 * @param type
 */
function changeMode(type) {
    var titleStr = '';

    if(confirm("切换游戏模式吗？")) {
        mode = type;
        init();
        if(mode === 0) {
            titleStr = '双人对战';
            document.getElementById('doubleMan').setAttribute('disabled', 'disabled');
            document.getElementById('manComputer').removeAttribute('disabled');
            document.getElementById('undo').style.display = 'none';
            document.getElementById('whiteUndo').style.display = 'inline-block';
            document.getElementById('blackUndo').style.display = 'inline-block';
        } else {
            titleStr = '人机对战';
            document.getElementById('doubleMan').removeAttribute('disabled');
            document.getElementById('manComputer').setAttribute('disabled', 'disabled');
            document.getElementById('undo').style.display = 'inline-block';
            document.getElementById('whiteUndo').style.display = 'none';
            document.getElementById('blackUndo').style.display = 'none';
        }
        title.innerText = titleStr;
    }

}

/**
 * 悔棋
 * @param type
 */
function undo(type) {
    console.log('悔棋');
    _undoPosition(1);
    switch (type) {
        case 0:
            var k;

            //计算机
            for(k = 0; k < core.count; k++){ // 将可能赢的情况都减1
                if(core.wins[position[1].x][position[1].y][k]){
                    core.computerWin[k]--;
                    core.myWin[k] = core._myWin[k];//这个位置对方可能赢
                }
            }

            // 我，悔棋
            _undoPosition(0);
            document.getElementById('undo').setAttribute('disabled', 'disabled');

            for(k = 0; k < core.count; k++){ // 将可能赢的情况都减1
                if(core.wins[position[0].x][position[0].y][k]){
                    core.myWin[k]--;
                    core.computerWin[k] = core._computerWin[k];//这个位置对方可能赢
                }
            }
            break;
        case 1: //白子悔棋
            if(position[1].type === 2) {//黑子为最后一步
                _undoPosition(0);
                document.getElementById('blackUndo').setAttribute('disabled', 'disabled');
            }
            document.getElementById('whiteUndo').setAttribute('disabled', 'disabled');
            isBlack = false;
            break;
        case 2: //黑子悔棋
            if(position[1].type === 1) {//白子为最后一步
                _undoPosition(0);
                document.getElementById('whiteUndo').setAttribute('disabled', 'disabled');
            }
            document.getElementById('blackUndo').setAttribute('disabled', 'disabled');
            isBlack = true;
            break;
    }
    document.getElementById('revertUndo').removeAttribute('disabled');

    function _undoPosition(index) {
        canvasFiveInARow.wipeChess(position[index].x, position[index].y, cellSize, chessSize, paddingSize);
        position[index].isUndo = true;
        maps[position[index].x][position[index].y] = 0;
    }
}

/**
 * 撤销悔棋
 */
function revertUndo() {
    console.log('撤销悔棋');

    position.forEach(function(item, index) {
        if(item.isUndo) {
            item.isUndo = false;
            maps[item.x][item.y] = item.type;
            if(item.type === 1) {
                canvasFiveInARow.drawChess(white,
                    item.x*cellSize+paddingSize-chessSize/2, item.y*cellSize+paddingSize-chessSize/2, chessSize);//界面标白子
                isBlack = true;
            } else {
                canvasFiveInARow.drawChess(black,
                    item.x*cellSize+paddingSize-chessSize/2, item.y*cellSize+paddingSize-chessSize/2, chessSize);//界面标黑子
                isBlack = false;
            }
        }
    });
    Array.prototype.slice.call(document.getElementsByClassName('undo')).forEach(function(item) {
        item.removeAttribute('disabled');
    });
    document.getElementById('revertUndo').setAttribute('disabled', 'disabled');

    if(mode === 1) {
        var k;

        //我
        for(k = 0; k < core.count; k++){
            if(core.wins[position[0].x][position[0].y][k]){
                core.myWin[k]++;
                core._computerWin[k] = core.computerWin[k];
                core.computerWin[k] = 6;//这个位置对方不可能赢
            }
        }

        //计算机
        for(k = 0; k < core.count; k++){ // 将可能赢的情况都减1
            if(core.wins[position[1].x][position[1].y][k]){
                core.computerWin[k]++;
                core._myWin[k] = core.myWin[k];
                core.myWin[k] = 6;//这个位置对方不可能赢
            }
        }
    }
}

/**
 * 再来一局
 */
function gameAgain() {
    if(confirm("是否再来一局")) {
        init();
    }
}


/**
 * 退出游戏
 */
function gameQuit() {
    if(confirm("是否退出游戏")) {
        window.close();
    }
}

init();

//下子
canvas.addEventListener('click', _chessBoardClick);

function _chessBoardClick(e) {

    if(mode === 1 && !me) {
        return;
    }

    var x = e.clientX - (this.offsetLeft + paddingSize);
    var y = e.clientY - (this.offsetTop + paddingSize);
    var who = 0;

    //矫正x,y坐标
    x = x%cellSize < cellSize/2 ? parseInt(x/cellSize) : parseInt(x/cellSize)+1;
    y = y%cellSize < cellSize/2 ? parseInt(y/cellSize) : parseInt(y/cellSize)+1;

    if(maps[x][y] === 0){
        if(position[1].x) {
            position[0].x = position[1].x;
            position[0].y = position[1].y;
            position[0].type = position[1].type;
            position[0].isUndo = false;
        }
        position[1].x = x;
        position[1].y = y;
        position[1].type = isBlack ? 2:1;
        position[1].isUndo = false;

        if(isBlack){
            canvasFiveInARow.drawChess(black,
                x*cellSize+paddingSize-chessSize/2, y*cellSize+paddingSize-chessSize/2, chessSize);//界面标棋子
            isBlack = false;
            maps[x][y] = 2; //黑子为2
            document.getElementById('blackUndo').removeAttribute('disabled');
            who = core.whoWin(2, x, y, size);
        }else{
            canvasFiveInARow.drawChess(white,
                x*cellSize+paddingSize-chessSize/2, y*cellSize+paddingSize-chessSize/2, chessSize);//界面标棋子
            isBlack = true;
            maps[x][y] = 1; //白子为1
            document.getElementById('whiteUndo').removeAttribute('disabled');
            who = core.whoWin(1, x, y, size);
        }
        document.getElementById('undo').removeAttribute('disabled');
        document.getElementById('revertUndo').setAttribute('disabled', 'disabled');

        //人机模式
        if(mode === 1) {
            for(var k = 0; k < core.count; k++){ // 将可能赢的情况都加1
                if(core.wins[x][y][k]){
                    core.myWin[k]++;
                    core._computerWin[k] = core.computerWin[k];
                    core.computerWin[k] = 6;//这个位置电脑不可能赢了
                    if(core.myWin[k] == 5){
                        //等棋子先画完
                        setTimeout(function() {
                            winnerText[0].innerText = "（恭喜你，你获胜了）";
                            alert("恭喜你，你获胜了");
                        },100);
                        _lockChessBoard();
                        over = true;
                    }
                }
            }
            if(!over){
                me = !me;
                if(core.computerAI()) {
                    //等棋子先画完
                    setTimeout(function() {
                        winnerText[0].innerText = "（电脑获胜了）";
                        alert("电脑获胜了");
                    },100);

                    _lockChessBoard();
                }
            }
        }
    }
    if(who !== 0 && mode === 0) {

        //等棋子先画完
        setTimeout(function() {
            if(who === 1) {
                winnerText[0].innerText = "（白子赢）";
                alert("白子赢");
            } else {
                winnerText[0].innerText = "（黑子赢）";
                alert("黑子赢");
            }
        }, 100);

        _lockChessBoard();

    }

    //锁定棋盘
    function _lockChessBoard() {
        canvas.removeEventListener('click', arguments.callee);
        Array.prototype.slice.call(document.getElementsByClassName('undo')).forEach(function(item) {
            item.setAttribute('disabled', 'disabled');
        });
        document.getElementById('revertUndo').setAttribute('disabled','disabled');
    }


}

