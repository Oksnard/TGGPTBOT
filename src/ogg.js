import axios from "axios";
import ffmpeg from 'fluent-ffmpeg'
import installer from '@ffmpeg-installer/ffmpeg'
import { createWriteStream } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { removeFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url))

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path)
    }

    toMP3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`)
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOptions('-t 30')
                    .output(outputPath)
                    .on('end', () => {
                        resolve(outputPath)
                        removeFile(input)
                    })
                    .on('error', (e) => reject(e))
                    .run()
            })
        } catch (e) {
            console.error(e)
        }
    }

    async create(url, filename) {
        try {
            const oggFilePath = resolve(__dirname, '../voices', `${filename}.ogg`)
            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream'
            })

            return new Promise(resolve => {
                const stream = createWriteStream(oggFilePath)
                response.data.pipe(stream)
                stream.on('finish', () => resolve(oggFilePath))
            })
        } catch (e) {
            console.error(e)
        }
    }
}

export const ogg = new OggConverter()