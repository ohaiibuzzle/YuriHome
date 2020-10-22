import { link } from "fs/promises"

let axios = require('axios')
let fs = require('fs')
let https = require('https')
let process = require('process')
let cronJob = require("cron").CronJob;
let express = require('express')
let app = express();

let port = process.env.PORT || 3000

let subreddit = "WholesomeYuri"
let limit = 100
let allowNSFW = false
let downloadDir = "./Yuris"

async function getJSON(url: string) {
    let req = await axios.get(url)
    return req["data"]["data"]["children"]
}

function checkImage(url : string) {
    if ((url.substring(url.length - 3) != "png") && (url.substring(url.length-3, url.length) != "jpg")) {
        return false;
    }
    return true;
}

function checkNSFW(over_18: boolean) {
    if (over_18) {
        if (!allowNSFW) {
            return false;
        }
    }
    return true;
}

function replaceFilename(filename: string) {
    let safed = filename.replace(/[/\\?%*:|"<>]/g,"")
    return safed
}

async function getImages() {
    let url = "https://www.reddit.com/r/" + subreddit + "/new.json?limit=" + limit
    let postList = await getJSON(url)

    for (let i = 0; i < postList.length; i++){
        let postData = postList[i]["data"]
        
        if (!checkImage(postData.url)) continue
        if (!checkNSFW(postData.over_18)) continue
        
        var filename = replaceFilename(postData.title) + postData.url.substring(postData.url.length-4)
        if (fs.existsSync(filename)) {
            console.log("File already exists: " + filename + " (" + postData.url + ")")
        } else {
        try {
            console.log("Downloading file: " + filename + " (" + postData.url + ")")    
            const file = fs.createWriteStream(filename)
            const request = https.get(postData.url, function(response) {
                    response.pipe(file)
            })} catch (err) {
                console.log(err)
            }
        }
    }
}
async function init() {
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir)
    }
    process.chdir(downloadDir)
    await getImages()
}

async function start() {
    await init()
    new cronJob("*/5 * * * *", async function() {
        await getImages()
    }, null, true);
    var Gallery = require("express-photo-gallery")
    var options = {
        title: "Buzzle's Cloud Yuri Stash"
    }
    app.use('/', Gallery(".", options))
    app.listen(port)
    console.log("Gallery listening on port: " + port)
}

start()
