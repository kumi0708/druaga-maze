// ドルアーガの塔 迷路生成: 壁伸ばし法 + 8bit LFSR(XNOR, tap=bit7,bit4)
// 仕様出典: https://qiita.com/devmynote/items/ea9d9cd323439363a670
(function (root) {
  const MAX_X = 17, MAX_Y = 8;
  const DIR_U = 0, DIR_R = 1, DIR_D = 2, DIR_L = 3;

  const ALGORITHM = {
    name: "壁伸ばし法",
    rng: "8bit LFSR (XNOR帰還, tap = bit7 / bit4)",
  };

  // フロアn(1..60)のシード値。フロア60のみ255。
  function seedOf(floor) {
    return floor === 60 ? 255 : floor - 1;
  }

  function makeRand(u) {
    let seed = u & 0xff;
    let prev = u & 1;
    return function () {
      const r2 = (((seed >> 7) ^ (seed >> 4)) & 1) ^ 1;
      seed = ((seed << 1) | r2) & 0xff;
      const v = ((prev << 1) | r2) & 3;
      prev = r2;
      return v;
    };
  }

  // 戻り値: wall1[x][y]=柱(x,y)の上辺, wall2[x][y]=柱(x,y)の左辺
  function generate(seedValue) {
    const dr = makeRand(seedValue);
    const pole = Array.from({ length: MAX_X }, () => Array(MAX_Y).fill(false));
    const wall1 = Array.from({ length: MAX_X }, () => Array(MAX_Y + 1).fill(false));
    const wall2 = Array.from({ length: MAX_X + 1 }, () => Array(MAX_Y).fill(false));

    function build(x, y) {
      if (x < 0 || x >= MAX_X || y < 0 || y >= MAX_Y || pole[x][y]) return;
      pole[x][y] = true;
      for (;;) {
        switch (dr()) {
          case DIR_U: if (wall1[x][y]) break; wall1[x][y] = true; build(x, y - 1); return;
          case DIR_R: if (wall2[x + 1][y]) break; wall2[x + 1][y] = true; build(x + 1, y); return;
          case DIR_D: if (wall1[x][y + 1]) break; wall1[x][y + 1] = true; build(x, y + 1); return;
          default:    if (wall2[x][y]) break; wall2[x][y] = true; build(x - 1, y); return;
        }
      }
    }

    for (let x = MAX_X - 1; x >= 0; x--)
      for (let y = 0; y < MAX_Y; y++) build(x, y);

    return { wall1, wall2 };
  }

  function toAscii(m) {
    const W = (MAX_X + 1) * 2 + 1, H = (MAX_Y + 1) * 2 + 1;
    const g = Array.from({ length: H }, () => Array(W).fill(" "));
    for (let i = 0; i < W; i += 2) { g[0][i] = g[H - 1][i] = "+"; }
    for (let i = 0; i < W; i++) { if (i % 2) g[0][i] = g[H - 1][i] = "-"; }
    for (let j = 0; j < H; j++) { if (j % 2) g[j][0] = g[j][W - 1] = "|"; else g[j][0] = g[j][W - 1] = "+"; }
    for (let x = 0; x < MAX_X; x++) for (let y = 0; y < MAX_Y; y++) {
      const px = (x + 1) * 2, py = (y + 1) * 2;
      g[py][px] = "+";
      if (m.wall1[x][y]) g[py - 1][px] = "|";
      if (m.wall2[x][y]) g[py][px - 1] = "-";
    }
    for (let x = 0; x < MAX_X; x++) {
      if (m.wall1[x][MAX_Y]) g[H - 2][(x + 1) * 2] = "|";
    }
    for (let y = 0; y < MAX_Y; y++) {
      if (m.wall2[MAX_X][y]) g[(y + 1) * 2][W - 2] = "-";
    }
    return g.map((r) => r.join("")).join("\n");
  }

  const api = { MAX_X, MAX_Y, ALGORITHM, seedOf, makeRand, generate, toAscii };
  if (typeof module !== "undefined") module.exports = api;
  else root.Druaga = api;
})(typeof window !== "undefined" ? window : globalThis);
