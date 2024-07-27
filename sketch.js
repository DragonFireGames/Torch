// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Modified and improved by DragonFire7z
// Please acknowledge use of this code by including this header.

var size = 5;
var psize = 1.7;
var cheatview = false;
var cheatwall = false;
var enabletreasure = true;
var decayrate = 1;

var cd = 3;
var view = 20 * size;
var flux = 0;
var rad = 0;
var trad = 0;
var tiles = [];
var tree = [];
var border = { x: 0, y: 0 };
var chunk = { x: 5, y: 5 };
var windowLeast = 400;
var exitloc = 0;
var tilemap = [];
for (var x = 0; x < chunk.x; x++) {
  tree[x] = [];
  for (var y = 0; y < chunk.y; y++) {
    tree[x][y] = [];
  }
}
var cooldown = cd;
var stepcount = 0;
var decaycount = 1;
var bestpath = 0;
class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.shown = false;
    this.mod = "";
    tree[floor(map(x, 0, border.x, 0, 1) * chunk.x)][
      floor(map(y, 0, border.y, 0, 1) * chunk.y)
    ].push(this);
    tiles.push(this);
    var self = this;
    setTimeout(()=>{
      tilemap[x/size][y/size] = [getTileID[this.type],this.shown,this.mod];
      if (player == self) {
        playermap = [x,y];
      }
    },1)
  }
  getfill(n) {
    return getFiller[this.type][n] + this.mod;
  }
  reload() {
    if (cheatview == true) {
      graphics.fill(this.getfill(1));
      graphics.rect(this.x, this.y, size, size);
      return;
    }
    if (this.shown == true) {
      graphics.fill(this.getfill(2));
      graphics.rect(this.x, this.y, size, size);
    }
  }
  show() {
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dists = dx * dx + dy * dy;
    if (dists < rad) {
      if (cheatview == false && this != player) {
        graphics.fill(this.getfill(2));
        graphics.rect(this.x, this.y, size, size);
        this.shown = true;
      }
      fill(this.getfill(1));
      if (dists < trad) {
        fill(this.getfill(0));
      }
      rect(this.x, this.y, size, size);
    }
  }
  intersect(obj) {
    return (
      floor(this.x / size) == floor(obj.x / size) &&
      floor(this.y / size) == floor(obj.y / size)
    );
  }
}
class MazeBuilder {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.cols = 2 * this.width + 1;
    this.rows = 2 * this.height + 1;
    this.maze = this.initArray([]);
  }

  initArray(value) {
    return new Array(this.rows)
      .fill()
      .map(() => new Array(this.cols).fill(value));
  }

  rand(min, max) {
    return min + Math.floor(Math.random() * (1 + max - min));
  }

  posToSpace(x) {
    return 2 * (x - 1) + 1;
  }

  posToWall(x) {
    return 2 * x;
  }

  inBounds(r, c) {
    if (
      typeof this.maze[r] == "undefined" ||
      typeof this.maze[r][c] == "undefined"
    ) {
      return false; // out of bounds
    }
    return true;
  }

  shuffle(array) {
    // sauce: https://stackoverflow.com/a/12646864
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isGap(...cells) {
    return cells.every((array) => {
      let row, col;
      [row, col] = array;
      if (this.maze[row][col].length > 0) {
        if (!this.maze[row][col].includes("door")) {
          return false;
        }
      }
      return true;
    });
  }
}

var graphics;
var player;
var playermap;
var treasure = 0;
var timer = 0;
setInterval(function () {
  if (screen == 1) {
    timer++;
  }
}, 1000);
var screen = 0;
var step = "initializing maze... ";
function setup() {
  createCanvas(windowWidth, windowHeight);
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.noStroke();
  windowLeast = round((windowWidth + windowHeight) / 2);
}
function draw() {
  background(20);
  if (screen == 0) {
    textAlign(CENTER);
    textSize(windowWidth / 20 + windowHeight / 20);
    fill(250);
    text("Torch", windowWidth / 2, windowHeight / 2);
    textSize(windowWidth / 100 + windowHeight / 100);
    if (getVariable("view", false) == false) {
      text(
        "Press N for a new game",
        windowWidth / 2,
        windowHeight / 2 + windowHeight / 30
      );
    } else {
      text(
        "Press N for a new game!   Press Space/Enter to resume an old game!",
        windowWidth / 2,
        windowHeight / 2 + windowHeight / 30
      );
    }
    text(
      "Size: " +
        (37 - psize * 10) +
        "   Lights on: " +
        cheatview +
        "   Purple Dots: " +
        enabletreasure +
        "   Light Decay: " +
        round(decayrate * 100) +
        "%",
      windowWidth / 2,
      windowHeight / 2 + windowHeight / 15
    );
    if (psize <= 0.2) {
      fill("red");
      text(
        "Warning: Maze too large to properly save!",
        windowWidth / 2,
        windowHeight / 2 + windowHeight / 10
      );
    }
    if (frameCount % 5 == 0) {
      if (keyIsDown(lookup["down"])) {
        psize += 0.1;
        psize = round(min(psize, 3.6), 1);
      }
      if (keyIsDown(lookup["up"])) {
        psize -= 0.1;
        psize = round(max(psize, 0.1), 1);
      }
    }
    if (frameCount % 3 == 0) {
      if (keyIsDown(lookup["right"])) {
        decayrate += 0.05;
        decayrate = min(decayrate, 3);
      }
      if (keyIsDown(lookup["left"])) {
        decayrate -= 0.05;
        decayrate = max(decayrate, 0);
      }
    }
    if (keyIsDown(lookup["n"])) {
      size = ceil((psize * windowLeast) / 100);
      screen = 4;
      maze();
    }
    if (keyIsDown(lookup["space"]) || keyIsDown(lookup["enter"])) {
      size = ceil((psize * windowLeast) / 100);
      screen = 4;
      view = getVariable("view", view);
      timer = getVariable("timer", timer);
      size = getVariable("size", size);
      treasure = getVariable("treasure", treasure);
      stepcount = getVariable("stepcount", stepcount);
      decaycount = getVariable("decaycount", decaycount);
      bestpath = getVariable("bestpath", bestpath);
      border = getVariable("border", border);
      var data = getVariable("maze", false);
      if (data != false) {
        tiles = [];
        tree = [];
        tilemap = data;
        graphics.clear();
        chunk.x = ceil(border.x / size / 25);
        chunk.y = ceil(border.y / size / 25);
        for (var x = 0; x < chunk.x; x++) {
          tree[x] = [];
          for (var y = 0; y < chunk.y; y++) {
            tree[x][y] = [];
          }
        }
        var maxx = (floor(windowHeight / (size * 2)) - 1) * size * 2;
        var maxy = (floor(windowWidth / (size * 2)) - 1) * size * 2;
        for (var x = 0; x < data.length; x++) {
          for (var y = 0; y < data[x].length; y++) {
            var l = data[x][y];
            if (l.length == 0) {continue;}
            if (l[0] == getTileID["player"]) {continue;}
            var l2 = new Tile(x*size,y*size);
            l2.type = IDtoTile[l[0]];
            l2.shown = l[1];
            l2.mod = l[2];
            if (l2.type == "exit") {
              exitloc = tiles.length-1;
            }
            l2.reload();
          }
        }
        var p = getVariable("player",undefined);
        player = new Tile(p.x,p.y);
        player.type = p.type;
        player.shown = p.shown;
        player.mod = p.mod;
      } else {
        maze();
        return;
      }
      screen = 1;
    }
  }
  if (screen == 1) {
    if (frameCount % 10 == 0) {
      storeItem("view", view);
      storeItem("treasure", treasure);
      storeItem("stepcount", stepcount);
      storeItem("decaycount", decaycount);
      storeItem("bestpath", bestpath);
      storeItem("timer", timer);
      storeItem("size", size);
      storeItem("border", border);
      storeItem("maze", tilemap);
      storeItem("player", player);
    }
    flux = (sin(frameCount * 0.07) + noise(frameCount * 0.01)) * size * 2;
    rad = (view + flux) ** 2;
    trad = (((view + flux) * 2) / 3) ** 2;
    cd = 0.06 * frameRate();
    noStroke();
    image(graphics, 0, 0, windowWidth, windowHeight);
    var px = floor(map(player.x, 0, border.x, 0, 1) * chunk.x);
    var py = floor(map(player.y, 0, border.y, 0, 1) * chunk.y);
    var vx = ceil(map(view, 0, border.x, 0, 1) * chunk.x);
    var vy = ceil(map(view, 0, border.y, 0, 1) * chunk.y);
    for (var x = 0; x < tree.length; x++) {
      for (var y = 0; y < tree[x].length; y++) {
        if (abs(px - x) < vx + 1 && abs(py - y) < vy + 1) {
          render(x, y);
        }
      }
    }
    player.show();
    cooldown--;
    if (cooldown <= 0) {
      keybind();
      cooldown = cd;
    }
    if (keyIsDown(lookup["esc"])) {
      screen = 0;
    }
  }
  if (screen == 2) {
    textAlign(CENTER);
    textSize(windowWidth / 20 + windowHeight / 20);
    fill(250);
    text("You Win!", windowWidth / 2, windowHeight / 2);
    textSize(windowWidth / 100 + windowHeight / 100);
    text(
      'Press "space"/"enter" to play again!',
      windowWidth / 2,
      windowHeight / 2 + windowHeight / 20
    );
    var sec = timer % 60;
    if (sec < 10) {
      sec = "0" + sec;
    }
    var mins = floor(timer / 60);
    if (mins < 10) {
      mins = "0" + mins;
    }
    var hrs = floor(min / 60);
    if (hrs < 10) {
      hrs = "0" + hrs;
    }
    text(
      "Time Completed: " +
        mins +
        ":" +
        sec +
        "   Purple Dots Found: " +
        treasure +
        "   Best Path: " +
        bestpath +
        "steps   Your Path: " +
        stepcount +
        "steps",
      windowWidth / 2,
      windowHeight / 2 + windowHeight / 10
    );
    text(
      "Size: " +
        (37 - psize * 10) +
        "   Lights on: " +
        cheatview +
        "   Purple Dots: " +
        enabletreasure +
        "   Light Decay: " +
        round(decayrate * 100) +
        "%",
      windowWidth / 2,
      windowHeight / 2 + (windowHeight / 20) * 3
    );
    if (keyIsDown(lookup["space"]) || keyIsDown(lookup["enter"])) {
      screen = 4;
      maze();
    }
    if (keyIsDown(lookup["esc"])) {
      screen = 0;
    }
  }
  if (screen == 3) {
    textAlign(CENTER);
    textSize(windowWidth / 20 + windowHeight / 20);
    fill(250);
    text("You Lost!", windowWidth / 2, windowHeight / 2);
    textSize(windowWidth / 100 + windowHeight / 100);
    text(
      'Press "space"/"enter" to play again!',
      windowWidth / 2,
      windowHeight / 2 + windowHeight / 20
    );
    if (keyIsDown(lookup["space"]) || keyIsDown(lookup["enter"])) {
      screen = 4;
      maze();
    }
    if (keyIsDown(lookup["esc"])) {
      screen = 0;
    }
  }
  if (screen == 4) {
    textAlign(CENTER);
    var avg = windowLeast;
    textSize(avg / 10);
    fill(250);
    text("Loading", windowWidth / 2 - avg / 15, windowHeight / 2);
    push();
    translate(avg / 9.5 + avg / 70, 0);
    text(
      ".",
      windowWidth / 2,
      windowHeight / 2 + (windowWidth / 80) * min(sin(frameCount / 20), 0)
    );
    text(
      ".",
      windowWidth / 2 + avg / 70,
      windowHeight / 2 +
        (windowWidth / 80) * min(sin(frameCount / 20 + PI / 3), 0)
    );
    text(
      ".",
      windowWidth / 2 + avg / 35,
      windowHeight / 2 +
        (windowWidth / 80) * min(sin(frameCount / 20 + (PI / 3) * 2), 0)
    );
    pop();
    textSize(avg / 40);
    text(step, windowWidth / 2, windowHeight / 2 + windowHeight / 15);
    if (keyIsDown(lookup["esc"])) {
      screen = 0;
    }
  }
}
function keybind() {
  var dx = player.x;
  var dy = player.y;
  if (keyIsDown(lookup["d"]) || keyIsDown(lookup["right"])) {
    player.x += size;
    stepcount++;
    decaycount++;
  }
  if (keyIsDown(lookup["a"]) || keyIsDown(lookup["left"])) {
    player.x -= size;
    stepcount++;
    decaycount++;
  }
  if (keyIsDown(lookup["s"]) || keyIsDown(lookup["down"])) {
    player.y += size;
    stepcount++;
    decaycount++;
  }
  if (keyIsDown(lookup["w"]) || keyIsDown(lookup["up"])) {
    player.y -= size;
    stepcount++;
    decaycount++;
  }
  var int = collides(player);
  if (int) {
    if (int.type == "wall") {
      if (cheatwall == false) {
        player.x = dx;
        player.y = dy;
        stepcount--;
        decaycount--;
      }
    } else if (int.type == "key") {
      graphics.fill(20);
      graphics.rect(int.x, int.y, size, size);
      var kx = floor(map(int.x, 0, border.x, 0, 1) * chunk.x);
      var ky = floor(map(int.y, 0, border.y, 0, 1) * chunk.y);
      tree[kx][ky].splice(tree[kx][ky].indexOf(int), 1);
      tiles.splice(tiles.indexOf(int), 1);
      tilemap[int.x/size][int.y/size] = [];
      exitloc--;
      tiles[exitloc].type = "exit_open";
      tiles[exitloc].reload();
      tilemap[tiles[exitloc].x/size][tiles[exitloc].y/size][0] = getTileID["exit_open"];
    } else if (int.type == "treasure") {
      treasure++;
      view += size * 6;
      graphics.fill(20);
      graphics.rect(int.x, int.y, size, size);
      var ix = floor(map(int.x, 0, border.x, 0, 1) * chunk.x);
      var iy = floor(map(int.y, 0, border.y, 0, 1) * chunk.y);
      tree[ix][iy].splice(tree[ix][iy].indexOf(int), 1);
      tiles.splice(tiles.indexOf(int), 1);
      tilemap[int.x/size][int.y/size] = [];
      exitloc--;
    } else {
      player.x = dx;
      player.y = dy;
      stepcount--;
      decaycount--;
    }
    if (int.type == "exit_open") {
      //Rickroll
      //if (size > 15) {
        //window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley');
      //}
      
      screen = 2;
    }
  }
  if (decaycount % 31 == 0) {
    view -= round(size * decayrate, 2);
    if (view + flux < 0) {
      screen = 3;
    }
    decaycount++;
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  windowLeast = round((windowWidth + windowHeight) / 2);
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.noStroke();
}
async function maze() {
  view = 20 * size;
  timer = 0;
  tiles = [];
  tree = [];
  graphics.clear();
  var px = 0;
  var py = 0;
  var mz = new MazeBuilder(
    floor(windowHeight / (size * 2)) - 1,
    floor(windowWidth / (size * 2)) - 1
  );
  // place initial walls
  mz.maze.forEach((row, r) => {
    row.forEach((cell, c) => {
      switch (r) {
        case 0:
        case mz.rows - 1:
          mz.maze[r][c] = ["wall"];
          break;

        default:
          if (r % 2 == 1) {
            if (c == 0 || c == mz.cols - 1) {
              mz.maze[r][c] = ["wall"];
            }
          } else if (c % 2 == 0) {
            mz.maze[r][c] = ["wall"];
          }
      }
    });

    if (r == 0) {
      // place exit in top row
      let doorPos = mz.posToSpace(mz.rand(1, mz.width));
      mz.maze[r][doorPos] = ["door", "exit"];
    }

    if (r == mz.rows - 1) {
      // place entrance in bottom row
      let doorPos = mz.posToSpace(mz.rand(1, mz.width));
      mz.maze[r][doorPos] = ["door", "entrance"];
    }
  });
  var part = new Promise(function (resolve) {
    var partition = function (r1, r2, c1, c2) {
      // create partition walls
      // ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method

      let horiz, vert, x, y, start, end;

      if (r2 < r1 || c2 < c1) {
        step = "partitioning maze: " + num + " parts";
        setTimeout(() => {
          resolve();
        }, 500);
        return false;
      }

      if (r1 == r2) {
        horiz = r1;
      } else {
        x = r1 + 1;
        y = r2 - 1;
        start = Math.round(x + (y - x) / 4);
        end = Math.round(x + (3 * (y - x)) / 4);
        horiz = mz.rand(start, end);
      }

      if (c1 == c2) {
        vert = c1;
      } else {
        x = c1 + 1;
        y = c2 - 1;
        start = Math.round(x + (y - x) / 3);
        end = Math.round(x + (2 * (y - x)) / 3);
        vert = mz.rand(start, end);
      }

      for (let i = mz.posToWall(r1) - 1; i <= mz.posToWall(r2) + 1; i++) {
        for (let j = mz.posToWall(c1) - 1; j <= mz.posToWall(c2) + 1; j++) {
          if (i == mz.posToWall(horiz) || j == mz.posToWall(vert)) {
            mz.maze[i][j] = ["wall"];
          }
        }
      }

      let gaps = mz.shuffle([true, true, true, false]);

      // create gaps in partition walls

      if (gaps[0]) {
        let gapPosition = mz.rand(c1, vert);
        mz.maze[mz.posToWall(horiz)][mz.posToSpace(gapPosition)] = [];
      }

      if (gaps[1]) {
        let gapPosition = mz.rand(vert + 1, c2 + 1);
        mz.maze[mz.posToWall(horiz)][mz.posToSpace(gapPosition)] = [];
      }

      if (gaps[2]) {
        let gapPosition = mz.rand(r1, horiz);
        mz.maze[mz.posToSpace(gapPosition)][mz.posToWall(vert)] = [];
      }

      if (gaps[3]) {
        let gapPosition = mz.rand(horiz + 1, r2 + 1);
        mz.maze[mz.posToSpace(gapPosition)][mz.posToWall(vert)] = [];
      }

      num++;
      // recursively partition newly created chambers
      setTimeout(() => {
        partition(r1, horiz - 1, c1, vert - 1);
        partition(horiz + 1, r2, c1, vert - 1);
        partition(r1, horiz - 1, vert + 1, c2);
        partition(horiz + 1, r2, vert + 1, c2);
      });
    };
    var num = 0;
    partition(1, mz.height - 1, 1, mz.width - 1);
  });
  await part;
  // start partitioning
  if (screen != 4) {
    return;
  }
  if (enabletreasure == true) {
    var placetreas = new Promise(function (resolve) {
    var amount = round((mz.maze.length * mz.maze[0].length) / 650);
    var placeTreasure = function (i) {
      pcnt = map(i, 0, amount - 1, 0, 1);
      step = "placing treasures: " + round(pcnt * 100) + "%";
      var x = round(random(0, mz.maze.length / 4 - 2)) * 4 + 2;
      var y = round(random(0, mz.maze[0].length / 4 - 2)) * 4 + 2;
      mz.maze[x][y] = "treasure";
      mz.maze[x + 1][y] = [];
      mz.maze[x - 1][y] = [];
      mz.maze[x][y + 1] = [];
      mz.maze[x][y - 1] = [];
      if (i < amount - 5) {
        setTimeout(() => {
          placeTreasure(i + 5);
        });
      } else {
        setTimeout(() => {
          resolve();
        }, (windowLeast / 10) * scale);
      }
    };
    var pcnt = 0;
    placeTreasure(0);
    placeTreasure(1);
    placeTreasure(2);
    placeTreasure(3);
    placeTreasure(4);
  });
    await placetreas;
  }
  if (screen != 4) {
    return;
  }
  var number = 0;
  var running = 0;
  var found = false;
  var countSteps = function (array, r, c, val, stop) {
    return new Promise(async function (resolve) {
      number++;
      running++;
      step = running+" running "+number+" steps";
      
      if (!mz.inBounds(r, c)) {
        running--;
        resolve(false);
        return false; // out of bounds
      }

      if (array[r][c] <= val) {
        running--;
        resolve(false);
        return false; // shorter route already mapped
      }

      if (!mz.isGap([r, c])) {
        running--;
        resolve(false);
        return false; // not traversable
      }

      array[r][c] = val;

      if (mz.maze[r][c].includes(stop)) {
        running--;
        resolve(true);
        return true; // reached destination
      }
      /*if (running > 5000) {
        running--;
        await wait(random()*100);
        running++;
      }*/
      await countSteps(array, r - 1, c, val + 1, stop);
      await countSteps(array, r, c + 1, val + 1, stop);
      await countSteps(array, r + 1, c, val + 1, stop);
      await countSteps(array, r, c - 1, val + 1, stop);
      running--;
      resolve();
    });
  }
  var placestep = "";
  var placekey = new Promise(async function (resolve) {
    let fromEntrance = mz.initArray();
    let fromExit = mz.initArray();

    mz.totalSteps = -1;

    for (var j = 1; j < mz.cols - 1; j++) {
      if (mz.maze[mz.rows - 1][j].includes("entrance")) {
          await countSteps(fromEntrance, mz.rows - 1, j, 0, "exit");
        }
        if (mz.maze[0][j].includes("exit")) {
          await countSteps(fromExit, 0, j, 0, "entrance");
        }
    }
      await wait(1);
          let fc = -1,
            fr = -1;

          mz.maze.forEach((row, r) => {
            row.forEach((cell, c) => {
              if (typeof fromEntrance[r][c] == "undefined") {
                setTimeout(() => {
                  resolve();
                }, 500);
                return;
              }
              let stepCount = fromEntrance[r][c] + fromExit[r][c];
              if (stepCount > mz.totalSteps) {
                fr = r;
                fc = c;
                mz.totalSteps = stepCount;
              }
            });
          });

          mz.maze[fr][fc] = ["key"];

          setTimeout(() => {
            resolve();
          }, 500);
  });
  await placekey;
  bestpath = mz.totalSteps;
  border.x = mz.maze.length * size;
  border.y = mz.maze[0].length * size;
  chunk.x = ceil(mz.maze.length / 25);
  chunk.y = ceil(mz.maze[0].length / 25);
  for (var x = 0; x < chunk.x; x++) {
    tree[x] = [];
    for (var y = 0; y < chunk.y; y++) {
      tree[x][y] = [];
    }
  }
  tilemap = [];
  for (var x = 0; x < mz.maze.length; x++) {
    tilemap[x] = [];
    for (var y = 0; y < mz.maze[0].length; y++) {
      tilemap[x][y] = [];
    }
  }
  player = new Tile(size, 0);
  player.type = "player";
  if (screen != 4) {
    return;
  }
  var dis = new Promise(function (resolve) {
    var getY = function (x) {
      pcnt = map(x, 0, mz.maze.length - 1, 0, 1);
      step = "tiling maze: " + round(pcnt * 100) + "%";
      for (var y = 0; y < mz.maze[x].length; y++) {
        maketile(mz, x, y);
      }
      if (x < mz.maze.length - 5) {
        setTimeout(() => {
          getY(x + 5);
        });
      } else {
        setTimeout(() => {
          resolve();
        }, (windowLeast / 10) * scale);
      }
    };
    var pcnt = 0;
    getY(0);
    getY(1);
    getY(2);
    getY(3);
    getY(4);
  });
  await dis;
  if (screen == 4) {
    screen = 1;
  }
}
function maketile(mz, x, y) {
  if (mz.maze[x][y] == "") {
    return;
  }
  var w = new Tile(x * size, y * size);
  if (mz.maze[x][y] == "wall") {
    w.mod = random(-5, 5);
    w.type = "wall";
  } else if (mz.maze[x][y] == "key") {
    w.shown = true;
    w.type = "key";
    w.reload();
    return;
  } else if (mz.maze[x][y] == "treasure") {
    w.type = "treasure";
  } else if (mz.maze[x][y][0] == "door") {
    w.type = "enter";
    if (mz.maze[x][y][1] == "exit") {
      player.x += x * size;
      player.y += y * size;
    } else {
      w.type = "exit";
      exitloc = tiles.indexOf(w);
    }
  }
  if (
    x == 0 ||
    y == 0 ||
    x == mz.maze.length - 1 ||
    y == mz.maze[x].length - 1
  ) {
    if (w.type == "wall") {
      w.type = "hardwall";
    }
    w.shown = true;
  }
  w.reload();
}
function render(x, y) {
  if (tree[x] != undefined) {
    if (tree[x][y] != undefined) {
      for (var i = 0; i < tree[x][y].length; i++) {
        tree[x][y][i].show();
      }
    }
  }
}
function collides(obj) {
  var px = floor(map(obj.x, 0, border.x, 0, 1) * chunk.x);
  var py = floor(map(obj.y, 0, border.y, 0, 1) * chunk.y);
  for (var i = 0; i < tree[px][py].length; i++) {
    if (tree[px][py][i].intersect(obj) && tree[px][py][i] != obj) {
      return tree[px][py][i];
    }
  }
  return undefined;
}
var lookup = {
  esc: 27,
  "`": 192,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  0: 48,
  "-": 189,
  "=": 187,
  backspace: 8,
  tab: 9,
  q: 81,
  w: 87,
  e: 69,
  r: 82,
  t: 84,
  y: 89,
  u: 85,
  i: 73,
  o: 79,
  p: 80,
  "[": 219,
  "]": 221,
  "|": 220,
  meta: 91,
  a: 65,
  s: 83,
  d: 68,
  f: 70,
  g: 71,
  h: 72,
  j: 74,
  k: 75,
  l: 76,
  ";": 186,
  "'": 222,
  enter: 13,
  shift: 16,
  z: 90,
  x: 88,
  c: 67,
  v: 86,
  b: 66,
  n: 78,
  m: 77,
  ",": 188,
  ".": 190,
  "/": 191,
  ctrl: 17,
  alt: 18,
  space: 32,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
};
var getFiller = {
  player: ["cyan", "blue", "rgb(20,20,70)"],
  wall: [220, 170, 100],
  hardwall: [220, 170, 100],
  key: ["red", "rgb(200,30,30)", "rgb(150,25,25)"],
  treasure: ["magenta", "rgb(200,70,200)", "rgb(150,50,150)"],
  enter: ["green", "rgb(25,100,25)", "rgb(20,80,20)"],
  exit: ["green", "rgb(25,100,25)", "rgb(20,80,20)"],
  exit_open: ["lime", "rgb(30,200,30)", "rgb(25,150,25)"]
};
var getTileID = {
  player: 0,
  wall: 1,
  hardwall: 2,
  key: 3,
  treasure: 4,
  enter: 5,
  exit: 6,
  exit_open: 7
}
var IDtoTile = [
  "player",
  "wall",
  "hardwall",
  "key",
  "treasure",
  "enter",
  "exit",
  "exit_open"
]
function keyPressed() {
  if (keyCode == lookup["l"] && screen == 0) {
    cheatview = !cheatview;
  }
  if (keyCode == lookup["p"] && screen == 0) {
    enabletreasure = !enabletreasure;
  }
  if (keyCode == lookup["g"] && keyIsDown(lookup["c"]) && screen == 0) {
    cheatwall = !cheatwall;
  }
}
function getVariable(name, def) {
  return getItem(name) ?? def;
}

function wait(t) {
  return new Promise(function(resolve) {
    setTimeout(()=>{
      resolve();
    },t)
  });
}