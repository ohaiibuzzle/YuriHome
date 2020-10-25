import { link } from "fs/promises"

const axios = require('axios')
const fs = require('fs')
const process = require('process')
const cronJob = require("cron").CronJob;
const express = require('express')
const app = express();

const port = process.env.PORT || 3000

const subreddit = "WholesomeYuri"
const limit = 100
const allowNSFW = false
const downloadDir = "./Yuris"

async function getJSON(url: string) {
    let req = await axios.get(url)
    return req["data"]["data"]["children"]
}

function checkImage(url : string) {
    if ((url.substring(url.length - 3) != "png") && (url.substring(url.length-3, url.length) != "jpg")) {
        console.log("Not an image: " + url);
        return false;
    }
    return true;
}

function checkNSFW(over_18: boolean) {
    if (over_18) {
        if (!allowNSFW) {
            console.log("NSFW is not allowed!")
            return false;
        }
        return true;
    }
    return true;
}

function replaceFilename(filename: string) {
    let safed = filename.replace(/[/\\?%*:|"<>&;]/g,"")
    return safed
}

async function getImages() {
    let url = "https://www.reddit.com/r/" + subreddit + ".json?limit=" + limit
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
            console.log("Trying to download: " + filename + " (" + postData.url + ")")
            await axios({
                method: "GET",
                url: postData.url,
                responseType: "stream"
            }).then(function (response) {
                response.data.pipe(fs.createWriteStream(filename))
            })}            
            catch (err) {
                console.log(err)
            }
        }
    }
    console.log("Done!")
}
async function init() {
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir)
    }
    process.chdir(downloadDir)
    await getImages()
}

async function start() {
    init()
    new cronJob("*/5 * * * *", async function() {
        getImages()
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
