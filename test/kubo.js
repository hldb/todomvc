#! /usr/bin/env node
"use strict";
const path = require("path");
const os = require("os");
const fs = require("fs");
const colors = require("ansi-colors");
const tar = require("tar");
var shell = require("shelljs");

const { mkdir, writeFile } = require("fs/promises");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const cliProgress = require("cli-progress");
const PassThrough = require("stream").PassThrough;
const byteCounter = new PassThrough();

const downloadFile = async (url, folder = "./test/kubo") => {
  const destination = path.resolve("./test/kubo", folder);
  if (!fs.existsSync(destination)) {
    const fileStream = fs.createWriteStream(destination, { flags: "wx" });

    const res = await fetch(url);
    let bytesRecv = 0;
    const contentLength = res.headers.get("Content-Length");
    const fetchBar = new cliProgress.SingleBar(
      {
        format:
          "fetch kubo |" +
          colors.magentaBright("{bar}") +
          "| {percentage}% || {value}/{total}",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
      },
      cliProgress.Presets.rect
    );
    fetchBar.start(contentLength, 0);
    await finished(
      Readable.fromWeb(res.body)
        .addListener("data", function (chunk) {
          bytesRecv += chunk.length;
          fetchBar.update(bytesRecv);
        })
        .pipe(fileStream)
    );
    await tar.x({ cwd:path.resolve("./test/"), file: path.resolve("./test/kubo/archive.tgz") });
  } else {
    console.log("\x1b[33m kubo archive exists\x1b[0m");
    await tar.x({ cwd:path.resolve("./test/"), file: path.resolve("./test/kubo/archive.tgz") });
  }
  const ipfsBin = path.resolve("./test/kubo/ipfs");
  const ipfsDir = path.resolve("./test/kubo");
  const conf = path.resolve("./test/kubo/config");

  const ipfsInit =  shell.exec(`${ipfsBin} --repo-dir=${ipfsDir} init --profile=test`);
  const ipfsAddress = shell.exec(`${ipfsBin} --repo-dir=${ipfsDir} config --json Addresses.Swarm [\\"/ip4/0.0.0.0/udp/4001/quic-v1/webtransport\\"]`);

  const ipfsDaemon = await shell.exec(`${ipfsBin} --repo-dir=${ipfsDir} daemon`);
  ipfsDaemon.stdout.on("data", function (data) {
    const regex = /\/ip4.*webtransport.*$/gm;
    const multiAddr = data.match(regex);
    console.log("ADDR: ", multiAddr.shift());
  });
  ipfsDaemon.stderr.on("data", function (data) {
    console.log(data);
  });
};

let platform = process.platform;
let arch = os.arch();

if (platform === "linux") {
  if (arch === "x64") {
    downloadFile(
      "https://dist.ipfs.tech/kubo/v0.20.0/kubo_v0.20.0_linux-amd64.tar.gz",
      "archive.tgz"
    );
  } else if (arch === "arm64") {
    downloadFile(
      "https://dist.ipfs.tech/kubo/v0.20.0/kubo_v0.20.0_linux-arm64.tar.gz",
      "archive.tgz"
    );
  } else {
    console.log("arch not supported: ", arch);
  }
} else if (platform === "darwin") {
  if (arch === "x64") {
    downloadFile(
      "https://dist.ipfs.tech/kubo/v0.20.0/kubo_v0.21.0_darwin-amd64.tar.gz",
      "archive.tgz"
    );
  } else if (arch === "arm64") {
    downloadFile(
"https://dist.ipfs.tech/kubo/v0.21.0-rc3/kubo_v0.21.0-rc3_darwin-arm64.tar.gz",
      "archive.tgz"
    );
  } else {
    console.log("arch not supported: ", arch);
  }
}
