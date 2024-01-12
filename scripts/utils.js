// Old Name
// const drawTitle = () => {
//     console.info("");
//     console.info(`88888888ba     Deploiement script for :                                  88                                            `);
//     console.info(`88      "8b                                                        ,d    88                                            `);
//     console.info(`88      ,8P                                                        88    88                                            `);
//     console.info(`88aaaaaa8P' 8b,dPPYba,  ,adPPYba,  88,dPYba,,adPYba,   ,adPPYba, MM88MMM 88,dPPYba,   ,adPPYba, 88       88 ,adPPYba,  `);
//     console.info(`88""""""'   88P'   "Y8 a8"     "8a 88P'   "88"    "8a a8P_____88   88    88P'    "8a a8P_____88 88       88 I8[    ""  `);
//     console.info(`88          88         8b       d8 88      88      88 8PP"""""""   88    88       88 8PP""""""" 88       88  \`"Y8ba,   `);
//     console.info(`88          88         "8a,   ,a8" 88      88      88 "8b,   ,aa   88,   88       88 "8b,   ,aa "8a,   ,a88 aa    ]8I  `);
//     console.info(`88          88          \`"YbbdP"'  88      88      88  \`"Ybbd8"'   "Y888 88       88  \`"Ybbd8"'  \`"YbbdP'Y8 \`"YbbdP"'  `);
//     console.info("");
//   }

// https://textkool.com/fr/ascii-art-generator?hl=default&vl=default&font=Colossal&text=Esiode
const drawTitle = () => {
    console.info(``)
    console.info(`Deploiement script for :`)
    console.info(``)
    console.info(`8888888888         d8b               888          `)
    console.info(`888                Y8P               888          `)
    console.info(`888                                  888          `)
    console.info(`8888888   .d8888b  888  .d88b.   .d88888  .d88b.  `)
    console.info(`888       88K      888 d88""88b d88" 888 d8P  Y8b `)
    console.info(`888       "Y8888b. 888 888  888 888  888 88888888 `)
    console.info(`888            X88 888 Y88..88P Y88b 888 Y8b.     `)
    console.info(`8888888888 88888P' 888  "Y88P"   "Y88888  "Y8888  `)
    console.info(``)
}

const exeCmd = (cmd, returnBool) => new Promise((resolve, reject) => {
    return exec(cmd, (err, stdout, stderr) => {
        if (err) {
            return reject(err);
        }
        if (returnBool)
            return resolve(true);
        return resolve(stdout.trim());
    })
})


module.exports = {
    drawTitle,
    exeCmd
}